import { BaseFilter } from '#mixins/with_filters'

export default class GeocodingApiKeyFilter extends BaseFilter {
  /**
   * By name or by the visible start of the key (gk_live_ab12)
   */
  search(value: string) {
    this.query.where((query) => {
      query.whereILike('name', `%${value}%`).orWhereILike('prefix', `${value}%`)
    })
  }

  environment(value: 'production' | 'test') {
    this.query.where('environment', value)
  }

  revoked(value: boolean) {
    if (value) {
      this.query.whereNotNull('revoked_at')
    } else {
      this.query.whereNull('revoked_at')
    }
  }
}
