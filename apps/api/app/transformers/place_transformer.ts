import type Place from '#models/place'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PlaceTransformer extends BaseTransformer<Place> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'location',
      'createdById',
      'createdAt',
      'updatedAt',
    ])
  }
}
