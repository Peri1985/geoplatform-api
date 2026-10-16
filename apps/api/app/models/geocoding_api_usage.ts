import { GeocodingApiUsageSchema } from '#database/schema'
import { compose } from '@adonisjs/core/helpers'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import GeocodingApiKey from '#models/geocoding_api_key'
import Organization from '#models/organization'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * One API call, for statistics and billing. Never holds the searched address.
 */
export default class GeocodingApiUsage extends compose(
  GeocodingApiUsageSchema,
  withFilters(filters.GeocodingApiUsage)
) {
  static table = 'geocoding.geocoding_api_usage'

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => GeocodingApiKey, { foreignKey: 'apiKeyId' })
  declare apiKey: BelongsTo<typeof GeocodingApiKey>
}
