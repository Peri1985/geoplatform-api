import { GeocodingPlanSchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import GeocodingSubscription from '#models/geocoding_subscription'
import { withAudit } from '#mixins/with_audit'
import { compose } from '@adonisjs/core/helpers'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

/**
 * A package of the geocoding API. Not changed once it has subscribers: create a new
 * one instead and deactivate the old. NULL limits mean "no limit".
 */
export default class GeocodingPlan extends compose(
  GeocodingPlanSchema,
  withAudit(),
  withFilters(filters.GeocodingPlan)
) {
  static table = 'geocoding.geocoding_plans'

  @hasMany(() => GeocodingSubscription, { foreignKey: 'planId' })
  declare subscriptions: HasMany<typeof GeocodingSubscription>
}
