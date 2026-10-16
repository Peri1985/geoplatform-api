import { BaseFilter } from '#mixins/with_filters'

/**
 * from and to are months (YYYY-MM), both included. As text, YYYY-MM sorts by date.
 */
export default class GeocodingApiUsageMonthlyFilter extends BaseFilter {
  from(value: string) {
    this.query.where('period', '>=', value)
  }

  to(value: string) {
    this.query.where('period', '<=', value)
  }
}
