import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { BaseModel } from '@adonisjs/lucid/orm'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

/**
 * A filter for the list of a model, in app/filters/<model>_filter.ts. Each public
 * method is one filter: Model.filter({ status: 'active' }) calls status('active').
 * Empty values are skipped, so a missing ?status= does not filter.
 */
export abstract class BaseFilter {
  /**
   * Not typed with the model: the model refers to its filter, so the filter
   * referring back to the model would be a circular type
   */
  constructor(protected query: ModelQueryBuilderContract<LucidModel>) {}
}

/**
 * The input a filter accepts, from its methods: { status?: 'active' | ..., search?: string }
 */
export type FilterInput<Filter> = {
  [Key in keyof Filter]?: Filter[Key] extends (value: infer Value) => void ? Value : never
}

/**
 * Adds Model.filter(input) to a model. It returns the query, so more conditions,
 * ordering and pagination can follow:
 *
 *   Organization.filter({ search: 'acme' }).orderBy('name').paginate(1, paginationConfig.perPage)
 */
export function withFilters<Filter extends BaseFilter>(
  FilterClass: new (query: ModelQueryBuilderContract<LucidModel>) => Filter
) {
  // Only the methods the filter itself defines, never inherited ones
  const methods = Object.getOwnPropertyNames(FilterClass.prototype).filter(
    (name) => name !== 'constructor'
  )

  return <T extends NormalizeConstructor<typeof BaseModel>>(superclass: T) => {
    class Filterable extends superclass {
      static filter<Model extends LucidModel>(this: Model, input: FilterInput<Filter>) {
        const query = this.query()
        const filter = new FilterClass(query) as unknown as Record<string, (value: unknown) => void>

        for (const [key, value] of Object.entries(input)) {
          if (value === undefined || value === null || value === '') continue
          if (methods.includes(key)) filter[key](value)
        }
        return query
      }
    }
    return Filterable
  }
}
