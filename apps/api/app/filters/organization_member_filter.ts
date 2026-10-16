import { BaseFilter } from '#mixins/with_filters'

export default class OrganizationMemberFilter extends BaseFilter {
  /**
   * By the name or the email of the user
   */
  search(value: string) {
    this.query.whereIn('user_id', (users) => {
      users
        .from('users')
        .select('id')
        .whereILike('email', `%${value}%`)
        .orWhereILike('full_name', `%${value}%`)
    })
  }

  role(value: 'admin' | 'member' | 'guest') {
    this.query.where('role', value)
  }

  status(value: 'active' | 'disabled') {
    this.query.where('status', value)
  }
}
