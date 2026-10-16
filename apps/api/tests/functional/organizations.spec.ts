import Organization from '#models/organization'
import OrganizationMember from '#models/organization_member'
import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'
import { createOrganization } from '#tests/models_helpers'

test.group('Organizations', (group) => {
  isolate(group)

  test('need a logged-in user', async ({ client }) => {
    const response = await client.get('/v1/organizations')
    response.assertStatus(401)
  })

  test('the creator becomes the admin of the new organization', async ({ client, assert }) => {
    const user = await createUser()
    const response = await client
      .post('/v1/organizations')
      .json({ name: 'Acme', vatNumber: '123456789' })
      .loginAs(user)

    response.assertStatus(201)
    const { data } = response.body() as { data: { id: string; name: string; isActive: boolean } }
    assert.equal(data.name, 'Acme')
    assert.isTrue(data.isActive)

    const member = await OrganizationMember.findByOrFail('organization_id', data.id)
    assert.equal(member.userId, user.id)
    assert.equal(member.role, 'admin')
  })

  test('list, show, update and delete', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization({ name: 'Acme' })

    const list = await client.get('/v1/organizations').loginAs(user)
    list.assertStatus(200)
    assert.include(
      (list.body() as { data: { id: string }[] }).data.map((o) => o.id),
      acme.id
    )

    const show = await client.get(`/v1/organizations/${acme.id}`).loginAs(user)
    show.assertBodyContains({ data: { id: acme.id, name: 'Acme' } })

    const update = await client
      .patch(`/v1/organizations/${acme.id}`)
      .json({ status: 'suspended' })
      .loginAs(user)
    update.assertBodyContains({ data: { status: 'suspended', isActive: false } })
    await acme.refresh()
    assert.isNotNull(acme.suspendedAt)

    const destroy = await client.delete(`/v1/organizations/${acme.id}`).loginAs(user)
    destroy.assertStatus(204)
    assert.isNull(await Organization.find(acme.id))
  })

  test('update works with PUT as well as PATCH', async ({ client }) => {
    const user = await createUser()
    const acme = await createOrganization()

    const response = await client
      .put(`/v1/organizations/${acme.id}`)
      .json({ name: 'Acme Maps' })
      .loginAs(user)
    response.assertBodyContains({ data: { name: 'Acme Maps' } })
  })

  test('a missing organization answers 404', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .get('/v1/organizations/00000000-0000-0000-0000-000000000000')
      .loginAs(user)
    response.assertStatus(404)
  })
})

test.group('Organization members', (group) => {
  isolate(group)

  test('add a member, change the role and remove', async ({ client, assert }) => {
    const user = await createUser()
    const maria = await createUser()
    const acme = await createOrganization()
    const url = `/v1/organizations/${acme.id}/members`

    const add = await client.post(url).json({ userId: maria.id }).loginAs(user)
    add.assertStatus(201)
    const { data } = add.body() as { data: { id: string; role: string; user: { email: string } } }
    assert.equal(data.role, 'member')
    assert.equal(data.user.email, maria.email)

    const list = await client.get(url).loginAs(user)
    assert.lengthOf((list.body() as { data: unknown[] }).data, 1)

    const update = await client.patch(`${url}/${data.id}`).json({ role: 'admin' }).loginAs(user)
    update.assertBodyContains({ data: { role: 'admin', isAdmin: true } })

    const remove = await client.delete(`${url}/${data.id}`).loginAs(user)
    remove.assertStatus(204)
    assert.isNull(await OrganizationMember.find(data.id))
  })

  test('a user is added only once', async ({ client }) => {
    const user = await createUser()
    const acme = await createOrganization()
    await OrganizationMember.create({ organizationId: acme.id, userId: user.id, role: 'admin' })

    const response = await client
      .post(`/v1/organizations/${acme.id}/members`)
      .json({ userId: user.id })
      .loginAs(user)
    response.assertStatus(422)
  })

  test('a member of another organization answers 404', async ({ client }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const other = await createOrganization()
    const member = await OrganizationMember.create({
      organizationId: other.id,
      userId: user.id,
      role: 'member',
    })

    const response = await client
      .get(`/v1/organizations/${acme.id}/members/${member.id}`)
      .loginAs(user)
    response.assertStatus(404)
  })
})
