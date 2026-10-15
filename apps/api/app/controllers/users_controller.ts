import { manageUsers } from '#abilities/main'
import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { updateUserValidator } from '#validators/user'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * User management, for admins only
 */
export default class UsersController {
  async index({ bouncer, serialize }: HttpContext) {
    await bouncer.authorize(manageUsers)
    const users = await User.query().orderBy('id')
    return serialize(UserTransformer.transform(users))
  }

  /**
   * Change a user's role or deactivate them. Either one logs them out everywhere.
   */
  async update({ params, request, auth, bouncer, serialize }: HttpContext) {
    await bouncer.authorize(manageUsers)

    const user = await User.findOrFail(params.id)
    // Keeps an admin from locking themselves (and possibly everyone) out
    if (user.id === auth.getUserOrFail().id) {
      throw new Exception('You cannot change your own role or status', {
        status: 400,
        code: 'E_CANNOT_CHANGE_SELF',
      })
    }

    const data = await request.validateUsing(updateUserValidator)
    const losesAccess =
      (data.role !== undefined && data.role !== user.role) || data.isActive === false

    user.merge(data)
    await user.save()
    if (losesAccess) await User.revokeAllTokens(user)

    return serialize(UserTransformer.transform(user))
  }
}
