import { BaseFilter } from '#mixins/with_filters'
import type { DateTime } from 'luxon'

export default class GeocodingApiUsageFilter extends BaseFilter {
  apiKeyId(value: string) {
    this.query.where('api_key_id', value)
  }

  /**
   * forward, reverse, autocomplete, batch
   */
  endpoint(value: string) {
    this.query.where('endpoint', value)
  }

  statusCode(value: number) {
    this.query.where('status_code', value)
  }

  billable(value: boolean) {
    this.query.where('billable', value)
  }

  from(value: DateTime) {
    this.query.where('created_at', '>=', value.toISO()!)
  }

  to(value: DateTime) {
    this.query.where('created_at', '<=', value.toISO()!)
  }
}
