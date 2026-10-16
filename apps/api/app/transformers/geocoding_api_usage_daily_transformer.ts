import type GeocodingApiUsageDaily from '#models/geocoding_api_usage_daily'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class GeocodingApiUsageDailyTransformer extends BaseTransformer<GeocodingApiUsageDaily> {
  toObject() {
    return this.pick(this.resource, ['organizationId', 'date', 'calls'])
  }
}
