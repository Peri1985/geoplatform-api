import { BaseFilter } from '#mixins/with_filters'
import { DateTime } from 'luxon'

export default class GeocodingSubscriptionFilter extends BaseFilter {
  organizationId(value: string) {
    this.query.where('organization_id', value)
  }

  planId(value: string) {
    this.query.where('plan_id', value)
  }

  /**
   * true: the active one (no end, or an end in the future); false: the ended ones
   */
  active(value: boolean) {
    const now = DateTime.now().toISO()
    if (value) {
      this.query.where((query) => query.whereNull('ends_at').orWhere('ends_at', '>', now))
    } else {
      this.query.where('ends_at', '<=', now)
    }
  }
}
