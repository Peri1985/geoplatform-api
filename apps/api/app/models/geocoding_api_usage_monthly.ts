import { GeocodingApiUsageMonthlySchema } from '#database/schema'
import { compose } from '@adonisjs/core/helpers'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import Organization from '#models/organization'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * API calls of an organization in one month, compared with the monthly quota
 * of its plan.
 */
export default class GeocodingApiUsageMonthly extends compose(
  GeocodingApiUsageMonthlySchema,
  withFilters(filters.GeocodingApiUsageMonthly)
) {
  static table = 'geocoding.geocoding_api_usage_monthly'

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>
}
