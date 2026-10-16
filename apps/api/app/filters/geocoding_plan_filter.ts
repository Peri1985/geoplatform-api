import { BaseFilter } from '#mixins/with_filters'

export default class GeocodingPlanFilter extends BaseFilter {
  search(value: string) {
    this.query.where((query) => {
      query.whereILike('code', `%${value}%`).orWhereILike('name', `%${value}%`)
    })
  }

  isActive(value: boolean) {
    this.query.where('is_active', value)
  }
}
