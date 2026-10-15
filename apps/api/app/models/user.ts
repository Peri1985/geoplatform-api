import { UserSchema } from '#database/schema'
import { withAudit } from '#mixins/with_audit'
import Group from '#models/group'
import Role from '#models/role'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class User extends compose(UserSchema, withAuthFinder(hash), withAudit()) {
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken

  /**
   * The groups the user belongs to, through the group_user pivot table
   */
  @manyToMany(() => Group, {
    pivotTable: 'group_user',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'group_id',
  })
  declare groups: ManyToMany<typeof Group>

  /**
   * The roles of the user, through the role_user pivot table
   */
  @manyToMany(() => Role, {
    pivotTable: 'role_user',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare roles: ManyToMany<typeof Role>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
