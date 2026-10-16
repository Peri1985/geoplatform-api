import type GeocodingApiUsage from '#models/geocoding_api_usage'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class GeocodingApiUsageTransformer extends BaseTransformer<GeocodingApiUsage> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'organizationId',
      'apiKeyId',
      'endpoint',
      'statusCode',
      'responseMs',
      'resultCount',
      'billable',
      'createdAt',
    ])
  }
}
