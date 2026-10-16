import { BaseFilter } from '#mixins/with_filters'

export default class UserFilter extends BaseFilter {
  search(value: string) {
    this.query.where((query) => {
      query.whereILike('email', `%${value}%`).orWhereILike('full_name', `%${value}%`)
    })
  }

  type(value: string) {
    this.query.where('type', value)
  }
}
