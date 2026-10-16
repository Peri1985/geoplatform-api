import type GeocodingPlan from '#models/geocoding_plan'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class GeocodingPlanTransformer extends BaseTransformer<GeocodingPlan> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'code',
      'name',
      'priceMonthly',
      'monthlyQuota',
      'ratePerSecond',
      'isActive',
      'createdAt',
      'updatedAt',
    ])
  }
}
