import type GeocodingApiUsageMonthly from '#models/geocoding_api_usage_monthly'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class GeocodingApiUsageMonthlyTransformer extends BaseTransformer<GeocodingApiUsageMonthly> {
  toObject() {
    return this.pick(this.resource, ['organizationId', 'period', 'calls'])
  }
}
