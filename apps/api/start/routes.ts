/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
| Routes are public unless they sit in a group with middleware.auth().
|
*/

import { middleware } from '#start/kernel'
import { authThrottle } from '#start/limiter'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router
  .group(() => {
    router.get('health', [controllers.Health, 'show'])

    /**
     * Public: create an account or get an access token
     */
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')
      .use(authThrottle)

    /**
     * Everything below needs "Authorization: Bearer <token>"
     */
    router
      .group(() => {
        router
          .group(() => {
            router.get('profile', [controllers.Profile, 'show'])
            router.post('logout', [controllers.AccessTokens, 'destroy'])
          })
          .prefix('account')
          .as('profile')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
