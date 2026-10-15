import type User from '#models/user'
import type Place from '#models/place'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

/**
 * Only the owner of a place, or an admin, may change or delete it
 */
export default class PlacePolicy extends BasePolicy {
  edit(user: User, place: Place): AuthorizerResponse {
    return user.isAdmin || place.createdById === user.id
  }

  delete(user: User, place: Place): AuthorizerResponse {
    return this.edit(user, place)
  }
}
