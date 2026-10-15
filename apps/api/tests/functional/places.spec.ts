import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'

const piraeusPort = { type: 'Point' as const, coordinates: [23.64, 37.942] as [number, number] }
const syntagma = { type: 'Point' as const, coordinates: [23.7348, 37.9755] as [number, number] }

// GET and POST /places share a URL, so the typed client merges their response types
type PlaceJson = { id: number; name: string; location: unknown; createdById: number | null }

test.group('Places', (group) => {
  isolate(group)

  test('need a logged-in user', async ({ client }) => {
    const response = await client.get('/api/v1/places')
    response.assertStatus(401)
  })

  test('are created with the caller as owner and returned as GeoJSON', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const created = await client
      .post('/api/v1/places')
      .json({ name: 'Λιμάνι Πειραιά', location: piraeusPort })
      .loginAs(user)

    created.assertStatus(201)
    const place = created.body().data as PlaceJson
    assert.equal(place.createdById, user.id)
    assert.deepEqual(place.location, piraeusPort)

    const list = await client.get('/api/v1/places').loginAs(user)
    const places = list.body().data as PlaceJson[]
    assert.deepEqual(places[0].location, piraeusPort)
  })

  test('reject coordinates out of range', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/api/v1/places')
      .json({ name: 'Πουθενά', location: { type: 'Point', coordinates: [200, 37] } })
      .loginAs(user)
    response.assertStatus(422)
  })

  test('nearby finds places within the radius, nearest first', async ({ client, assert }) => {
    const user = await createUser()
    await client.post('/api/v1/places').json({ name: 'Σύνταγμα', location: syntagma }).loginAs(user)
    await client
      .post('/api/v1/places')
      .json({ name: 'Λιμάνι', location: piraeusPort })
      .loginAs(user)
    const names = (body: { data: { name: string }[] }) => body.data.map((place) => place.name)

    const near = await client
      .get('/api/v1/places/nearby')
      .qs({ lat: 37.943, lon: 23.647, radius: 2000 })
      .loginAs(user)
    near.assertStatus(200)
    assert.deepEqual(names(near.body()), ['Λιμάνι'])

    const far = await client
      .get('/api/v1/places/nearby')
      .qs({ lat: 37.943, lon: 23.647, radius: 20000 })
      .loginAs(user)
    assert.deepEqual(names(far.body()), ['Λιμάνι', 'Σύνταγμα'])
  })

  test('can be changed only by their owner or an admin', async ({ client }) => {
    const owner = await createUser()
    const other = await createUser()
    const admin = await createUser({ role: 'admin' })

    const created = await client
      .post('/api/v1/places')
      .json({ name: 'Λιμάνι', location: piraeusPort })
      .loginAs(owner)
    const place = created.body().data as PlaceJson
    const url = `/api/v1/places/${place.id}`

    const byOther = await client.patch(url).json({ name: 'Δικό μου' }).loginAs(other)
    byOther.assertStatus(403)

    const byOwner = await client.patch(url).json({ name: 'Λιμάνι Πειραιά' }).loginAs(owner)
    byOwner.assertStatus(200)

    const byAdmin = await client.patch(url).json({ name: 'Λιμάνι του Πειραιά' }).loginAs(admin)
    byAdmin.assertStatus(200)

    const deleteByOther = await client.delete(url).loginAs(other)
    deleteByOther.assertStatus(403)

    const deleteByOwner = await client.delete(url).loginAs(owner)
    deleteByOwner.assertStatus(204)
  })
})
