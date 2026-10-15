import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { errors as authErrors } from '@adonisjs/auth'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards)

    // The user is loaded from the database on every request, so a deactivation
    // takes effect immediately, even for tokens issued before it
    if (!ctx.auth.user!.isActive) {
      throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'access_tokens',
      })
    }

    return next()
  }
}
