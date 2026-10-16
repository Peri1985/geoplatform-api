import type GeocodingApiKey from '#models/geocoding_api_key'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Never includes key_hash: the key itself is shown only once, when it is created.
 */
export default class GeocodingApiKeyTransformer extends BaseTransformer<GeocodingApiKey> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'organizationId',
      'name',
      'environment',
      'prefix',
      'allowedDomains',
      'allowedIps',
      'lastUsedAt',
      'expiresAt',
      'revokedAt',
      'createdById',
      'createdAt',
      'updatedAt',
      'isUsable',
    ])
  }
}
