import { GeocodingSubscriptionSchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import GeocodingPlan from '#models/geocoding_plan'
import Organization from '#models/organization'
import { withAudit } from '#mixins/with_audit'
import { compose } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * An organization's subscription to geocoding API, from starts_at until ends_at
 * (NULL = still active). At most one active per organization.
 */
export default class GeocodingSubscription extends compose(
  GeocodingSubscriptionSchema,
  withAudit(),
  withFilters(filters.GeocodingSubscription)
) {
  static table = 'geocoding.geocoding_subscriptions'

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => GeocodingPlan, { foreignKey: 'planId' })
  declare plan: BelongsTo<typeof GeocodingPlan>

  get isActive() {
    return !this.endsAt || this.endsAt > DateTime.now()
  }
}
