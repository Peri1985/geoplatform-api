import File from '#models/file'
import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'
import { createOrganization } from '#tests/models_helpers'

const newFile = (ownerId: string, uploadedBy: string, name: string) =>
  File.create({
    key: `uploads/${ownerId}/${name}`,
    name,
    mimeType: 'application/geo+json',
    size: 10,
    ownerId,
    uploadedBy,
    attachableType: null,
    attachableId: null,
  })

test.group('Models: files', (group) => {
  isolate(group)

  test('the owner is a user or an organization; the uploader is always a user', async ({
    assert,
  }) => {
    const user = await createUser()
    const acme = await createOrganization()
    await newFile(user.id, user.id, 'mine.geojson')
    await newFile(acme.id, user.id, 'company.geojson')

    const userFiles = await File.query().withScopes((s) => s.ownedBy(user))
    const orgFiles = await File.query().withScopes((s) => s.ownedBy(acme))
    assert.deepEqual(
      userFiles.map((f) => f.name),
      ['mine.geojson']
    )
    assert.deepEqual(
      orgFiles.map((f) => f.name),
      ['company.geojson']
    )
    assert.equal(orgFiles[0].uploadedBy, user.id)
  })

  test('deleting the uploader keeps the file, without its uploader', async ({ assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const file = await newFile(acme.id, user.id, 'company.geojson')

    await user.delete()

    await file.refresh()
    assert.isNull(file.uploadedBy)
    assert.equal(file.ownerId, acme.id)
  })
})
