import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import type { ApiClient } from '@japa/api-client'
import type { Group } from '@japa/runner/core'

export const password = 'correct-horse-battery'

let counter = 0

/**
 * A user in the test database (rolled back after each test)
 */
export function createUser() {
  counter++
  return User.create({ email: `user${counter}@test.local`, password })
}

/**
 * Logs in through the API and returns the "Authorization" header value
 */
export async function login(client: ApiClient, user: User) {
  const response = await client.post('/api/v1/auth/login').json({ email: user.email, password })
  response.assertStatus(200)
  const { token } = response.body().data
  return `Bearer ${token}`
}

/**
 * Every test runs in a transaction that is rolled back, and with fresh rate limits
 */
export function isolate(group: Group) {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear())
}
