import { BaseFilter } from '#mixins/with_filters'
import type { DateTime } from 'luxon'

/**
 * from and to are days, both included
 */
export default class GeocodingApiUsageDailyFilter extends BaseFilter {
  from(value: DateTime) {
    this.query.where('date', '>=', value.toISODate()!)
  }

  to(value: DateTime) {
    this.query.where('date', '<=', value.toISODate()!)
  }
}
