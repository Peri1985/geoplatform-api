import type GeocodingSubscription from '#models/geocoding_subscription'
import GeocodingPlanTransformer from '#transformers/geocoding_plan_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class GeocodingSubscriptionTransformer extends BaseTransformer<GeocodingSubscription> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'organizationId',
        'planId',
        'startsAt',
        'endsAt',
        'createdAt',
        'updatedAt',
        'isActive',
      ]),
      // Only when the controller has preloaded it
      plan: GeocodingPlanTransformer.transform(this.whenLoaded(this.resource.plan)),
    }
  }
}
