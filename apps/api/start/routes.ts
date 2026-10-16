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

        /**
         * CRUD routes with router.resource: index (GET /), store (POST /), show (GET /:id),
         * update (PUT and PATCH /:id), destroy (DELETE /:id). apiOnly() leaves out the
         * create/edit form pages, which an API does not have.
         */
        router
          .resource('files', controllers.Files)
          .apiOnly()
          .except(['update'])
          .where('id', router.matchers.uuid())

        router
          .resource('organizations', controllers.Organizations)
          .apiOnly()
          .where('id', router.matchers.uuid())

        /**
         * The data of one organization: /organizations/:organizationId/...
         */
        router
          .group(() => {
            router
              .resource('members', controllers.OrganizationMembers)
              .apiOnly()
              .where('id', router.matchers.uuid())
          })
          .prefix('organizations/:organizationId')
          .as('organizations')
          .where('organizationId', router.matchers.uuid())

        /**
         * Product 1, the geocoding API: everything under /geocoding
         */
        router
          .group(() => {
            router
              .resource('plans', controllers.geocoding.Plans)
              .where('id', router.matchers.uuid())
              .apiOnly()
            router
              .resource('organization.subscriptions', controllers.geocoding.Subscriptions)
              .where('organization_id', router.matchers.uuid())
              .where('id', router.matchers.uuid())
              .except(['update'])
              .apiOnly()
            router
              .resource('api-keys', controllers.geocoding.ApiKeys)
              .where('id', router.matchers.uuid())
              .apiOnly()
            router
              .group(() => {
                router.get('/', [controllers.geocoding.Usage, 'index']).as('index')
                router.get('daily', [controllers.geocoding.Usage, 'daily']).as('daily')
                router.get('monthly', [controllers.geocoding.Usage, 'monthly']).as('monthly')
              })
              .prefix('usage')
              .as('usage')
          })
          .prefix('geocoding')
          .as('geocoding')
      })
      .use(middleware.auth())
  })
  .prefix('/v1')

/**
 * OpenAPI docs, generated from the routes (node ace docs:generate)
 */
router.get('docs', [controllers.Docs, 'show']).as('docs.show')
router.get('docs.json', [controllers.Docs, 'json']).as('docs.json')
