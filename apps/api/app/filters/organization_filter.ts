import { BaseFilter } from '#mixins/with_filters'

export default class OrganizationFilter extends BaseFilter {
  search(value: string) {
    this.query.whereILike('name', `%${value}%`)
  }

  status(value: 'active' | 'suspended') {
    this.query.where('status', value)
  }
}
