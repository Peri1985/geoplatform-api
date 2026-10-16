import { UserSchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import { withAudit } from '#mixins/with_audit'
import Organization from '#models/organization'
import OrganizationMember from '#models/organization_member'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class User extends compose(
  UserSchema,
  withAuthFinder(hash),
  withAudit(),
  withFilters(filters.User)
) {
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken

  /**
   * The memberships of the user, each with the role in that organization
   */
  @hasMany(() => OrganizationMember, { foreignKey: 'userId' })
  declare memberships: HasMany<typeof OrganizationMember>

  /**
   * The organizations of the user, through organization_members ($extras.pivot_role)
   */
  @manyToMany(() => Organization, {
    pivotTable: 'organization_members',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'organization_id',
    pivotColumns: ['role', 'status'],
    pivotTimestamps: true,
  })
  declare organizations: ManyToMany<typeof Organization>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
