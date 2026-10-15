import File from '#models/file'
import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'

const geojson = Buffer.from(JSON.stringify({ type: 'Point', coordinates: [23.64, 37.942] }))

type FileJson = {
  id: string
  name: string
  mimeType: string
  ownerId: string
  size: number
  attachableType: string | null
}

test.group('Files', (group) => {
  isolate(group)

  // No real S3 in tests: files go to a local fake disk
  let disk: ReturnType<typeof drive.fake>
  group.each.setup(() => {
    disk = drive.fake('s3')
    return () => drive.restore('s3')
  })

  test('need a logged-in user', async ({ client }) => {
    const response = await client.get('/api/v1/files')
    response.assertStatus(401)
  })

  test('upload stores the object in S3 and a row with the owner', async ({ client, assert }) => {
    const user = await createUser()
    const response = await client
      .post('/api/v1/files')
      .file('file', geojson, { filename: 'port.geojson' })
      .loginAs(user)

    response.assertStatus(201)
    const { file, url } = response.body().data as { file: FileJson; url: string }
    assert.equal(file.name, 'port.geojson')
    assert.equal(file.ownerId, user.id)
    assert.equal(file.size, geojson.length)
    assert.equal(file.mimeType, 'application/geo+json')
    assert.isNull(file.attachableType)
    assert.isString(url)

    const row = await File.findOrFail(file.id)
    assert.match(row.key, new RegExp(`^uploads/${user.id}/[0-9a-f-]{36}\\.geojson$`))
    disk.assertExists(row.key)
  })

  test('upload rejects file types that are not allowed', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .post('/api/v1/files')
      .file('file', Buffer.from('echo hi'), { filename: 'script.sh' })
      .loginAs(user)
    response.assertStatus(422)
  })

  test('the list has only the caller files, newest first, in pages', async ({ client, assert }) => {
    const user = await createUser()
    const other = await createUser()
    for (const name of ['a.geojson', 'b.geojson', 'c.geojson']) {
      await client.post('/api/v1/files').file('file', geojson, { filename: name }).loginAs(user)
    }
    await client
      .post('/api/v1/files')
      .file('file', geojson, { filename: 'x.geojson' })
      .loginAs(other)

    const response = await client.get('/api/v1/files').qs({ perPage: 2 }).loginAs(user)
    response.assertStatus(200)
    // GET and POST /files share a URL, so the typed client merges their response types
    const { data, metadata } = response.body() as unknown as {
      data: FileJson[]
      metadata: { total: number; perPage: number; currentPage: number }
    }
    assert.deepEqual(
      data.map((file) => file.name),
      ['c.geojson', 'b.geojson']
    )
    assert.equal(metadata.total, 3)
    assert.equal(metadata.perPage, 2)
  })

  test('show and delete work only for the owner', async ({ client, assert }) => {
    const owner = await createUser()
    const other = await createUser()
    const upload = await client
      .post('/api/v1/files')
      .file('file', geojson, { filename: 'port.geojson' })
      .loginAs(owner)
    const { file } = upload.body().data as { file: FileJson }
    const { key } = await File.findOrFail(file.id)

    const showByOther = await client.get(`/api/v1/files/${file.id}`).loginAs(other)
    showByOther.assertStatus(404)
    const deleteByOther = await client.delete(`/api/v1/files/${file.id}`).loginAs(other)
    deleteByOther.assertStatus(404)

    const show = await client.get(`/api/v1/files/${file.id}`).loginAs(owner)
    show.assertStatus(200)
    assert.isString((show.body() as { data: { url: string } }).data.url)

    const remove = await client.delete(`/api/v1/files/${file.id}`).loginAs(owner)
    remove.assertStatus(204)
    assert.isNull(await File.find(file.id))
    disk.assertMissing(key)
  })

  test('a file can be attached to any record (polymorphic)', async ({ client, assert }) => {
    const user = await createUser()
    const upload = await client
      .post('/api/v1/files')
      .file('file', geojson, { filename: 'avatar.png.geojson' })
      .loginAs(user)
    const file = await File.findOrFail((upload.body().data as { file: FileJson }).file.id)

    await file.attachTo(user)
    assert.equal(file.attachableType, 'users')
    assert.equal(file.attachableId, user.id)

    const attached = await File.query().withScopes((scopes) => scopes.attachedTo(user))
    assert.deepEqual(
      attached.map((row) => row.id),
      [file.id]
    )

    await file.detach()
    const afterDetach = await File.query().withScopes((scopes) => scopes.attachedTo(user))
    assert.lengthOf(afterDetach, 0)
  })
})
