import { OrganizationSchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import GeocodingApiKey from '#models/geocoding_api_key'
import OrganizationMember from '#models/organization_member'
import GeocodingSubscription from '#models/geocoding_subscription'
import User from '#models/user'
import { compose } from '@adonisjs/core/helpers'
import { withAudit } from '#mixins/with_audit'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

/**
 * A customer (tenant). Everything a customer owns points to it with organization_id,
 * and every query on customer data must be limited to one organization.
 */
export default class Organization extends compose(
  OrganizationSchema,
  withAudit(),
  withFilters(filters.Organization)
) {
  @hasMany(() => OrganizationMember, { foreignKey: 'organizationId' })
  declare members: HasMany<typeof OrganizationMember>

  @manyToMany(() => User, {
    pivotTable: 'organization_members',
    pivotForeignKey: 'organization_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['role', 'status'],
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>

  /**
   * Subscriptions to the geocoding API; at most one is active (ends_at NULL)
   */
  @hasMany(() => GeocodingSubscription, { foreignKey: 'organizationId' })
  declare geocodingSubscriptions: HasMany<typeof GeocodingSubscription>

  @hasMany(() => GeocodingApiKey, { foreignKey: 'organizationId' })
  declare apiKeys: HasMany<typeof GeocodingApiKey>

  get isActive() {
    return this.status === 'active'
  }
}
