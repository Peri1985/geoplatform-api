import { OrganizationMemberSchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import Organization from '#models/organization'
import User from '#models/user'
import { compose } from '@adonisjs/core/helpers'
import { withAudit } from '#mixins/with_audit'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * A user's membership of an organization, with their role in it:
 * admin (Tenant Admin), member, or guest (only the projects they are added to).
 */
export default class OrganizationMember extends compose(
  OrganizationMemberSchema,
  withAudit(),
  withFilters(filters.OrganizationMember)
) {
  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  get isAdmin() {
    return this.role === 'admin'
  }

  get isActive() {
    return this.status === 'active'
  }
}
