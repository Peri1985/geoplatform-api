import AuditLog from '#models/audit_log'
import { pruneAuditLog } from '#services/audit'
import drive from '@adonisjs/drive/services/main'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { createUser, isolate, password } from '#tests/helpers'

const geojson = Buffer.from(JSON.stringify({ type: 'Point', coordinates: [23.64, 37.942] }))

const entries = (action: string) =>
  AuditLog.query().where('action', action).orderBy('created_at', 'asc')

test.group('Audit log', (group) => {
  isolate(group)
  group.each.setup(() => {
    drive.fake('s3')
    return () => drive.restore('s3')
  })

  test('signup is recorded with the new user as author, without the password', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/v1/auth/signup').json({
      fullName: 'Maria P',
      email: 'maria@test.local',
      password,
      passwordConfirmation: password,
    })
    const { id } = (response.body() as { data: { user: { id: string } } }).data.user

    const [entry] = await entries('users.created')
    assert.equal(entry.userId, id)
    assert.equal(entry.subjectType, 'users')
    assert.equal(entry.subjectId, id)
    assert.equal(entry.changes?.email, 'maria@test.local')
    assert.notProperty(entry.changes, 'password')
  })

  test('file upload, URL and delete are recorded with the user and the request', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const upload = await client
      .post('/v1/files')
      .header('User-Agent', 'audit-test')
      .file('file', geojson, { filename: 'port.geojson' })
      .loginAs(user)
    const fileId = (upload.body().data as { file: { id: string } }).file.id
    await client.delete(`/v1/files/${fileId}`).loginAs(user)

    const [created] = await entries('files.created')
    assert.equal(created.userId, user.id)
    assert.equal(created.subjectType, 'files')
    assert.equal(created.subjectId, fileId)
    assert.equal(created.changes?.name, 'port.geojson')
    assert.isString(created.ip)
    assert.equal(created.userAgent, 'audit-test')
    assert.isString(created.requestId)

    // The upload answer contains a download URL
    const [issued] = await entries('files.url_issued')
    assert.equal(issued.subjectId, fileId)
    assert.equal(issued.userId, user.id)

    const [deleted] = await entries('files.deleted')
    assert.equal(deleted.subjectId, fileId)
    assert.equal(deleted.userId, user.id)
  })

  test('updates record only the changed fields, never the password', async ({ assert }) => {
    const user = await createUser()
    user.fullName = 'New Name'
    user.password = 'another-password-123'
    await user.save()

    const [entry] = await entries('users.updated')
    assert.deepEqual(entry.changes, { fullName: { from: null, to: 'New Name' } })
  })

  test('entries cannot be changed', async ({ assert }) => {
    await createUser()
    const [entry] = await entries('users.created')

    await assert.rejects(
      () => db.from('audit_logs').where('id', entry.id).update({ action: 'tampered' }),
      /audit_logs rows cannot be changed/
    )
  })

  test('entries stay when their user is deleted, without the user', async ({ assert }) => {
    const user = await createUser()
    const userId = user.id
    await user.delete()

    const [created] = await entries('users.created')
    assert.isNull(created.userId)
    assert.equal(created.subjectId, userId)
    const [deleted] = await entries('users.deleted')
    assert.equal(deleted.subjectId, userId)
  })

  test('prune deletes only entries older than the retention period', async ({ assert }) => {
    await createUser()
    await db.table('audit_logs').insert({
      action: 'users.updated',
      created_at: DateTime.now().minus({ days: 400 }).toSQL(),
    })

    const deleted = await pruneAuditLog(365)
    assert.equal(deleted, 1)
    assert.lengthOf(await entries('users.created'), 1)
  })
})
