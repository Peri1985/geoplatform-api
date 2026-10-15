import User from '#models/user'
import { test } from '@japa/runner'
import { createUser, isolate, login, password } from '#tests/helpers'

test.group('Auth', (group) => {
  isolate(group)

  test('health is public', async ({ client }) => {
    const response = await client.get('/api/v1/health')
    response.assertStatus(200)
    response.assertBody({ status: 'ok' })
  })

  test('signup creates a user and returns a token', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/signup').json({
      fullName: 'Maria P',
      email: 'Maria@Test.local',
      password,
      passwordConfirmation: password,
    })

    response.assertStatus(200)
    const { user, token } = response.body().data
    assert.equal(user.email, 'maria@test.local')
    assert.notProperty(user, 'password')
    assert.isString(token)
  })

  test('signup rejects an email that exists in another case', async ({ client }) => {
    const user = await createUser()
    const response = await client.post('/api/v1/auth/signup').json({
      fullName: null,
      email: user.email.toUpperCase(),
      password,
      passwordConfirmation: password,
    })
    response.assertStatus(422)
  })

  test('login returns a Bearer token that opens the profile', async ({ client, assert }) => {
    const user = await createUser()
    const authorization = await login(client, user)

    const profile = await client
      .get('/api/v1/account/profile')
      .header('Authorization', authorization)
    profile.assertStatus(200)
    assert.equal(profile.body().data.email, user.email)
  })

  test('a wrong password and an unknown email get the same answer', async ({ client, assert }) => {
    const user = await createUser()

    const wrongPassword = await client
      .post('/api/v1/auth/login')
      .json({ email: user.email, password: 'wrong-password' })
    const unknownEmail = await client
      .post('/api/v1/auth/login')
      .json({ email: 'nobody@test.local', password })

    wrongPassword.assertStatus(400)
    unknownEmail.assertStatus(400)
    assert.deepEqual(unknownEmail.body(), wrongPassword.body())
  })

  test('protected routes need a valid token', async ({ client }) => {
    const withoutToken = await client.get('/api/v1/account/profile')
    withoutToken.assertStatus(401)

    const withBadToken = await client
      .get('/api/v1/account/profile')
      .header('Authorization', 'Bearer not-a-token')
    withBadToken.assertStatus(401)
  })

  test('logout revokes the token', async ({ client }) => {
    const user = await createUser()
    const authorization = await login(client, user)

    const logout = await client
      .post('/api/v1/account/logout')
      .header('Authorization', authorization)
    logout.assertStatus(200)

    const profile = await client
      .get('/api/v1/account/profile')
      .header('Authorization', authorization)
    profile.assertStatus(401)
  })

  test('tokens expire after 30 days', async ({ client, assert }) => {
    const user = await createUser()
    await login(client, user)

    const [token] = await User.accessTokens.all(user)
    const days = token.expiresAt!.getTime() - Date.now()
    assert.closeTo(days / (24 * 60 * 60 * 1000), 30, 0.01)
  })

  test('login is limited to 10 attempts per minute per IP', async ({ client }) => {
    const attempt = () =>
      client.post('/api/v1/auth/login').json({ email: 'nobody@test.local', password })

    for (let i = 0; i < 10; i++) {
      const response = await attempt()
      response.assertStatus(400)
    }
    const blocked = await attempt()
    blocked.assertStatus(429)
  })
})
