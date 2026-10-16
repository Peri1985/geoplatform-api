import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { writeFile } from 'node:fs/promises'
import ts from 'typescript'
import { OPENAPI_FILE } from '#controllers/docs_controller'

type Schema = Record<string, any>

const REGISTRY_FILE = '.adonisjs/client/registry/schema.d.ts'
const MAX_DEPTH = 15

/**
 * node ace docs:generate [--output=.adonisjs/openapi.json]
 *
 * Builds an OpenAPI 3.1 document from the route types that Tuyau generates
 * (body/query from the validators, responses from the controllers' return types),
 * so no decorators or hand-written schemas are needed. The dev server runs it
 * after every Tuyau codegen (see the hooks in adonisrc.ts).
 */
export default class DocsGenerate extends BaseCommand {
  static commandName = 'docs:generate'
  static description = 'Generate the OpenAPI document from the Tuyau route registry'

  static options: CommandOptions = {
    // For the router: which routes sit behind middleware.auth()
    startApp: true,
  }

  @flags.string({ description: 'Where to write the document', default: OPENAPI_FILE })
  declare output: string

  async run() {
    const root = this.app.makePath()
    const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json')!
    const { config } = ts.readConfigFile(configPath, ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root)
    const registryPath = this.app.makePath(REGISTRY_FILE)

    const program = ts.createProgram([...parsed.fileNames, registryPath], parsed.options)
    const checker = program.getTypeChecker()
    const source = program.getSourceFile(registryPath)
    if (!source) {
      this.logger.error(`${REGISTRY_FILE} not found: start the app once so Tuyau generates it`)
      this.exitCode = 1
      return
    }

    const registry = source.statements.find(
      (node): node is ts.InterfaceDeclaration =>
        ts.isInterfaceDeclaration(node) && node.name.text === 'Registry'
    )!
    const converter = new SchemaConverter(checker)
    const authenticated = await this.authenticatedRoutes()
    const paths: Record<string, Record<string, Schema>> = {}

    for (const route of checker.getPropertiesOfType(checker.getTypeAtLocation(registry))) {
      const definition = checker.getTypeOfSymbol(route)
      const methods = this.literalValues(checker, this.property(checker, definition, 'methods'))
      const pattern = this.literalValues(checker, this.property(checker, definition, 'pattern'))[0]
      const types = this.property(checker, definition, 'types')
      // The docs are not part of the API
      if (!types || !pattern || route.name.startsWith('docs.')) continue

      const operation = this.operation(checker, converter, route.name, types)
      const handler = this.handler(program, checker, route)
      if (handler) {
        operation.tags = [handler.tag]
        if (handler.description) operation.description = handler.description
      }
      if (authenticated.has(route.name)) {
        operation.security = [{ bearerAuth: [] }]
        operation.responses['401'] = { description: 'Missing or invalid access token' }
      }
      const path = String(pattern).replace(/:(\w+)\??/g, '{$1}')
      paths[path] ??= {}
      // PUT and PATCH of the same route need their own operationId
      const verbs = methods
        .map((method) => String(method).toLowerCase())
        .filter((m) => m !== 'head')
      for (const verb of verbs) {
        const operationId = verbs.length > 1 ? `${route.name}.${verb}` : route.name
        // The route itself, e.g. GET /v1/files/:id; the controller's comment goes below it
        const summary = `${verb.toUpperCase()} ${pattern}`
        paths[path][verb] = { ...operation, operationId, summary }
      }
    }

    const document = {
      openapi: '3.1.0',
      info: { title: 'GeoPlatform API', version: '1.0.0' },
      servers: [{ url: '/' }],
      // Routes without it are public
      security: [],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'Access token from POST /v1/auth/login',
          },
        },
      },
      paths,
    }
    await writeFile(this.app.makePath(this.output), JSON.stringify(document, null, 2))
    this.logger.success(`Wrote ${Object.keys(paths).length} paths to ${this.output}`)
  }

  /**
   * Names of the routes with the named "auth" middleware, e.g. from a group's .use(middleware.auth())
   */
  private async authenticatedRoutes() {
    const router = await this.app.container.make('router')
    router.commit()
    const names = new Set<string>()
    for (const routes of Object.values(router.toJSON())) {
      for (const route of routes) {
        const middleware = [...route.middleware.all()]
        if (route.name && middleware.some((entry) => 'name' in entry && entry.name === 'auth')) {
          names.add(route.name)
        }
      }
    }
    return names
  }

  /**
   * The controller method behind a route, from its registry entry:
   * response: ExtractResponse<...import('#controllers/geocoding/subscriptions_controller').default['index']...>
   * Tag from the controller (geocoding / subscriptions), description from the method's
   * JSDoc comment.
   */
  private handler(program: ts.Program, checker: ts.TypeChecker, route: ts.Symbol) {
    const text = route.declarations?.[0]?.getText() ?? ''
    const match = text.match(/import\('#controllers\/([^']+)'\)\.default\['(\w+)'\]/)
    if (!match) return
    const [, file, method] = match

    const tag = file
      .replace(/_controller$/, '')
      .replaceAll('_', ' ')
      .replaceAll('/', ' / ')
    const source = program.getSourceFile(this.app.makePath(`app/controllers/${file}.ts`))
    const controller = source?.statements.find(
      (node): node is ts.ClassDeclaration =>
        ts.isClassDeclaration(node) &&
        !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    )
    const symbol = controller && checker.getTypeAtLocation(controller).getProperty(method)
    const comment = symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : ''
    return { tag, description: comment.trim() }
  }

  private operation(
    checker: ts.TypeChecker,
    converter: SchemaConverter,
    name: string,
    types: ts.Type
  ) {
    const operation: Schema = {
      operationId: name,
      parameters: [],
      responses: {},
    }

    const params = this.property(checker, types, 'params')
    for (const param of params ? checker.getPropertiesOfType(params) : []) {
      operation.parameters.push({
        in: 'path',
        name: param.name,
        required: true,
        schema: { type: 'string' },
      })
    }

    const query = converter.convert(this.property(checker, types, 'query'))
    for (const [key, schema] of Object.entries<Schema>(query.properties ?? {})) {
      operation.parameters.push({
        in: 'query',
        name: key,
        required: query.required?.includes(key) ?? false,
        schema: this.queryParameter(schema),
      })
    }

    const body = converter.convert(this.property(checker, types, 'body'))
    if (Object.keys(body.properties ?? {}).length) {
      operation.requestBody = { required: true, content: { 'application/json': { schema: body } } }
    }

    const response = this.property(checker, types, 'response')
    if (!response || this.isEmpty(response)) {
      operation.responses['204'] = { description: 'No content' }
    } else {
      operation.responses['200'] = {
        description: 'OK',
        content: { 'application/json': { schema: converter.convert(response) } },
      }
    }

    // { status: 422; response: ... } | { status: 404; response: ... }
    const errors = this.property(checker, types, 'errorResponse')
    for (const error of errors ? (errors.isUnion() ? errors.types : [errors]) : []) {
      const status = this.literalValues(checker, this.property(checker, error, 'status'))[0]
      if (status === undefined) continue
      operation.responses[String(status)] = {
        description: 'Error',
        content: {
          'application/json': {
            schema: converter.convert(this.property(checker, error, 'response')),
          },
        },
      }
    }

    if (!operation.parameters.length) delete operation.parameters
    return operation
  }

  // `return response.noContent()` comes out of the registry as unknown
  private isEmpty(type: ts.Type): boolean {
    if (type.isUnion()) return type.types.every((t) => this.isEmpty(t))
    const empty =
      ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never | ts.TypeFlags.Unknown
    return !!(type.flags & empty)
  }

  /**
   * The validators' input types accept anything the query string can carry
   * (string | number | boolean | null): keep only the type the validator ends up with.
   */
  private queryParameter(schema: Schema): Schema {
    if (Array.isArray(schema.type)) {
      const [type] = schema.type.filter((t: string) => t !== 'null')
      return { ...schema, type }
    }
    if (!schema.anyOf) return schema
    const members: Schema[] = schema.anyOf.filter((member: Schema) => member.type !== 'null')
    if (members.some((member) => member.type === 'boolean')) return { type: 'boolean' }
    if (members.some((member) => member.type === 'number')) return { type: 'number' }
    return members.length === 1 ? members[0] : { anyOf: members }
  }

  private property(checker: ts.TypeChecker, type: ts.Type | undefined, name: string) {
    const symbol = type && checker.getPropertyOfType(type, name)
    return symbol && checker.getTypeOfSymbol(symbol)
  }

  // ["GET","HEAD"] / 'pattern' -> plain values
  private literalValues(checker: ts.TypeChecker, type: ts.Type | undefined): (string | number)[] {
    if (!type) return []
    if (type.isLiteral()) return [type.value as string | number]
    if (checker.isTupleType(type)) {
      return checker
        .getTypeArguments(type as ts.TypeReference)
        .flatMap((t) => this.literalValues(checker, t))
    }
    if (type.isUnion()) return type.types.flatMap((t) => this.literalValues(checker, t))
    return []
  }
}

/**
 * Turns a resolved TypeScript type into a JSON schema.
 */
class SchemaConverter {
  #stack = new Set<ts.Type>()

  constructor(private checker: ts.TypeChecker) {}

  convert(type: ts.Type | undefined, depth = 0): Schema {
    if (!type || depth > MAX_DEPTH) return {}
    const kind = type.flags

    if (kind & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return {}
    if (kind & ts.TypeFlags.Null) return { type: 'null' }
    if (kind & ts.TypeFlags.StringLiteral)
      return { type: 'string', const: (type as ts.StringLiteralType).value }
    if (kind & ts.TypeFlags.NumberLiteral)
      return { type: 'number', const: (type as ts.NumberLiteralType).value }
    if (kind & ts.TypeFlags.BooleanLiteral)
      return { type: 'boolean', const: this.checker.typeToString(type) === 'true' }
    if (kind & ts.TypeFlags.StringLike) return { type: 'string' }
    if (kind & ts.TypeFlags.NumberLike) return { type: 'number' }
    if (kind & ts.TypeFlags.BigIntLike) return { type: 'integer' }
    if (kind & ts.TypeFlags.BooleanLike) return { type: 'boolean' }

    if (type.isUnion()) return this.union(type, depth)

    const name = type.getSymbol()?.getName()
    if (name === 'Date' || name === 'DateTime') return { type: 'string', format: 'date-time' }

    if (this.checker.isTupleType(type)) {
      const items = this.checker.getTypeArguments(type as ts.TypeReference)
      return { type: 'array', prefixItems: items.map((item) => this.convert(item, depth + 1)) }
    }
    if (this.checker.isArrayType(type)) {
      const [item] = this.checker.getTypeArguments(type as ts.TypeReference)
      return { type: 'array', items: this.convert(item, depth + 1) }
    }

    if (type.flags & ts.TypeFlags.Object || type.isIntersection()) return this.object(type, depth)
    return {}
  }

  private union(type: ts.UnionType, depth: number): Schema {
    // undefined only makes a property optional
    const members = type.types.filter(
      (t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void))
    )
    const nullable = members.some((t) => t.flags & ts.TypeFlags.Null)
    const rest = members.filter((t) => !(t.flags & ts.TypeFlags.Null))

    let schema: Schema
    if (rest.length && rest.every((t) => t.flags & ts.TypeFlags.BooleanLiteral)) {
      schema = { type: 'boolean' }
    } else if (rest.length && rest.every((t) => t.isStringLiteral())) {
      schema = { type: 'string', enum: rest.map((t) => (t as ts.StringLiteralType).value) }
    } else if (rest.length && rest.every((t) => t.isNumberLiteral())) {
      schema = { type: 'number', enum: rest.map((t) => (t as ts.NumberLiteralType).value) }
    } else if (rest.length === 1) {
      schema = this.convert(rest[0], depth)
    } else {
      schema = { anyOf: rest.map((t) => this.convert(t, depth)) }
    }

    if (!nullable) return schema
    if (typeof schema.type === 'string') return { ...schema, type: [schema.type, 'null'] }
    return { anyOf: [...(schema.anyOf ?? [schema]), { type: 'null' }] }
  }

  private object(type: ts.Type, depth: number): Schema {
    // Recursive types (e.g. a user with organizations with users)
    if (this.#stack.has(type)) return { type: 'object' }
    this.#stack.add(type)

    const properties: Record<string, Schema> = {}
    const required: string[] = []
    for (const property of this.checker.getPropertiesOfType(type)) {
      if (property.name.startsWith('__')) continue
      const propertyType = this.checker.getTypeOfSymbol(property)
      // Methods are not part of the JSON
      if (
        propertyType.getCallSignatures().length &&
        !this.checker.getPropertiesOfType(propertyType).length
      )
        continue

      properties[property.name] = this.convert(propertyType, depth + 1)
      const optional = property.flags & ts.SymbolFlags.Optional
      const undefinable =
        propertyType.isUnion() && propertyType.types.some((t) => t.flags & ts.TypeFlags.Undefined)
      if (!optional && !undefinable) required.push(property.name)
    }

    const schema: Schema = { type: 'object', properties }
    if (required.length) schema.required = required
    const index = this.checker.getIndexInfosOfType(type)[0]
    if (index) schema.additionalProperties = this.convert(index.type, depth + 1)

    this.#stack.delete(type)
    return schema
  }
}
