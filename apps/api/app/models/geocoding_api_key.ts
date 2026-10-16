import { GeocodingApiKeySchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import Organization from '#models/organization'
import User from '#models/user'
import { compose } from '@adonisjs/core/helpers'
import { withAudit } from '#mixins/with_audit'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * A key for the geocoding API. Only its SHA-256 is stored; prefix is the visible part.
 */
export default class GeocodingApiKey extends compose(
  GeocodingApiKeySchema,
  withAudit(),
  withFilters(filters.GeocodingApiKey)
) {
  static table = 'geocoding.geocoding_api_keys'

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'createdById' })
  declare createdBy: BelongsTo<typeof User>

  /**
   * A new random key, e.g. gk_live_Xb3…, with what is stored for it. The key itself
   * is shown to the user once and never stored.
   */
  static generate(environment: 'production' | 'test') {
    const key = `gk_${environment === 'production' ? 'live' : 'test'}_${randomBytes(24).toString('base64url')}`
    return { key, prefix: key.slice(0, 12), keyHash: GeocodingApiKey.hash(key) }
  }

  /**
   * SHA-256 of a key, to find it when a request sends it
   */
  static hash(key: string) {
    return createHash('sha256').update(key).digest('hex')
  }

  get isUsable() {
    if (this.revokedAt) return false
    return !this.expiresAt || this.expiresAt > DateTime.now()
  }
}
