import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * Types for the columns the generator cannot type on its own (enums, jsonb,
 * geometry). Tables are keyed by name without their schema.
 */

const column = (tsType: string) => ({ tsType, decorators: [{ name: '@column' }] })

// jsonb, saved with JSON.stringify (see app/decorators/json_column.ts)
const json = (tsType: string) => ({
  tsType,
  decorators: [{ name: '@jsonColumn' }],
  imports: [{ source: '#decorators/json_column', namedImports: ['jsonColumn'] }],
})

const union = (...values: string[]) => column(values.map((value) => `'${value}'`).join(' | '))

const MEMBER_ROLE = union('admin', 'member', 'guest')

export default {
  tables: {
    // ------------------------------------------------------------- public
    audit_logs: { columns: { changes: column('Record<string, unknown>') } },
    organization_members: {
      columns: { role: MEMBER_ROLE, status: union('active', 'disabled') },
    },
    organizations: { columns: { status: union('active', 'suspended') } },

    // ------------------------------------------------------------- geocoding
    geocoding_api_keys: {
      columns: {
        environment: union('production', 'test'),
        allowed_domains: json('string[]'),
        allowed_ips: json('string[]'),
      },
    },
  },
} satisfies SchemaRules
