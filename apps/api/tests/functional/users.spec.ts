import User from '#models/user'
import { test } from '@japa/runner'
import { createUser, isolate, login, password } from '#tests/helpers'

test.group('Users', (group) => {
  isolate(group)

  test('are listed only for admins', async ({ client }) => {
    const user = await createUser()
    const admin = await createUser({ role: 'admin' })

    const asUser = await client.get('/api/v1/users').loginAs(user)
    asUser.assertStatus(403)

    const asAdmin = await client.get('/api/v1/users').loginAs(admin)
    asAdmin.assertStatus(200)
  })

  test('an admin can deactivate a user, who is then logged out and cannot log in', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const admin = await createUser({ role: 'admin' })
    const authorization = await login(client, user)

    const response = await client
      .patch(`/api/v1/users/${user.id}`)
      .json({ isActive: false })
      .loginAs(admin)
    response.assertStatus(200)
    assert.isFalse(response.body().data.isActive)

    const tokens = await User.accessTokens.all(user)
    assert.lengthOf(tokens, 0)

    const profile = await client
      .get('/api/v1/account/profile')
      .header('Authorization', authorization)
    profile.assertStatus(401)

    const loginAgain = await client.post('/api/v1/auth/login').json({ email: user.email, password })
    loginAgain.assertStatus(400)
  })

  test('an admin can promote a user', async ({ client, assert }) => {
    const user = await createUser()
    const admin = await createUser({ role: 'admin' })

    const response = await client
      .patch(`/api/v1/users/${user.id}`)
      .json({ role: 'admin' })
      .loginAs(admin)
    response.assertStatus(200)
    assert.equal(response.body().data.role, 'admin')

    await user.refresh()
    const asPromoted = await client.get('/api/v1/users').loginAs(user)
    asPromoted.assertStatus(200)
  })

  test('an admin cannot change their own role', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const response = await client
      .patch(`/api/v1/users/${admin.id}`)
      .json({ role: 'user' })
      .loginAs(admin)
    response.assertStatus(400)
  })
})
