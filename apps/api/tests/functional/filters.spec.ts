import GeocodingApiKey from '#models/geocoding_api_key'
import GeocodingApiUsageMonthly from '#models/geocoding_api_usage_monthly'
import Organization from '#models/organization'
import OrganizationMember from '#models/organization_member'
import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'
import { createOrganization } from '#tests/models_helpers'

test.group('Filters', (group) => {
  isolate(group)

  test('Model.filter calls the filter methods and skips empty values', async ({ assert }) => {
    const acme = await createOrganization({ name: 'Acme Maps' })
    const other = await createOrganization({ name: 'Other' })
    other.status = 'suspended'
    await other.save()

    const ids = async (input: Parameters<typeof Organization.filter>[0]) => {
      const organizations = await Organization.filter(input).whereIn('id', [acme.id, other.id])
      return organizations.map((o) => o.id)
    }

    assert.deepEqual(await ids({ search: 'acme' }), [acme.id])
    assert.deepEqual(await ids({ status: 'suspended' }), [other.id])
    // An empty value does not filter
    assert.sameMembers(await ids({ search: '' }), [acme.id, other.id])
  })

  test('GET /organizations filters by search and status', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization({ name: 'Acme Maps' })
    await createOrganization({ name: 'Other' })

    const response = await client
      .get('/v1/organizations')
      .qs({ search: 'acme maps', status: 'active' })
      .loginAs(user)
    response.assertStatus(200)
    const { data } = response.body() as { data: { id: string }[] }
    assert.deepEqual(
      data.map((o) => o.id),
      [acme.id]
    )
  })

  test('an invalid filter value answers 422', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .get('/v1/organizations')
      .qs({ status: 'deleted' })
      .loginAs(user)
    response.assertStatus(422)
  })

  test('members filter by the name or email of the user', async ({ client, assert }) => {
    const user = await createUser()
    const maria = await createUser()
    maria.fullName = 'Maria Papadopoulou'
    await maria.save()
    const acme = await createOrganization()
    await OrganizationMember.create({ organizationId: acme.id, userId: user.id, role: 'admin' })
    await OrganizationMember.create({ organizationId: acme.id, userId: maria.id, role: 'member' })

    const response = await client
      .get(`/v1/organizations/${acme.id}/members`)
      .qs({ search: 'papadop' })
      .loginAs(user)
    const { data } = response.body() as { data: { userId: string }[] }
    assert.deepEqual(
      data.map((m) => m.userId),
      [maria.id]
    )
  })

  test('API keys filter by revoked', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const keys = []
    for (const name of ['Active', 'Revoked']) {
      const { prefix, keyHash } = GeocodingApiKey.generate('production')
      keys.push(await GeocodingApiKey.create({ organizationId: acme.id, name, prefix, keyHash }))
    }
    keys[1].revokedAt = keys[1].createdAt
    await keys[1].save()

    const response = await client
      .get(`/v1/geocoding/organizations/${acme.id}/api-keys`)
      .qs({ revoked: false })
      .loginAs(user)
    const { data } = response.body() as { data: { name: string }[] }
    assert.deepEqual(
      data.map((k) => k.name),
      ['Active']
    )
  })

  test('monthly usage filters by a range of months', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    for (const period of ['2026-08', '2026-09', '2026-10']) {
      await GeocodingApiUsageMonthly.create({ organizationId: acme.id, period, calls: 1 })
    }

    const response = await client
      .get(`/v1/geocoding/organizations/${acme.id}/usage/monthly`)
      .qs({ from: '2026-09', to: '2026-10' })
      .loginAs(user)
    const { data } = response.body() as { data: { period: string }[] }
    assert.deepEqual(
      data.map((m) => m.period),
      ['2026-10', '2026-09']
    )
  })
})
