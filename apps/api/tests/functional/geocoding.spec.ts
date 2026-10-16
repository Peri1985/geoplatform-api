import GeocodingApiKey from '#models/geocoding_api_key'
import GeocodingApiUsageDaily from '#models/geocoding_api_usage_daily'
import GeocodingApiUsageMonthly from '#models/geocoding_api_usage_monthly'
import GeocodingPlan from '#models/geocoding_plan'
import GeocodingSubscription from '#models/geocoding_subscription'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { createUser, isolate } from '#tests/helpers'
import { createGeocodingPlan, createOrganization, fromNow } from '#tests/models_helpers'

test.group('Geocoding plans', (group) => {
  isolate(group)

  test('create, update and delete a plan', async ({ client, assert }) => {
    const user = await createUser()

    const create = await client
      .post('/v1/geocoding/plans')
      .json({
        code: 'Starter',
        name: 'Starter',
        priceMonthly: 19.9,
        monthlyQuota: 50000,
        ratePerSecond: null,
      })
      .loginAs(user)
    create.assertStatus(201)
    const { data } = create.body() as { data: { id: string; code: string; priceMonthly: string } }
    assert.equal(data.code, 'starter')
    assert.equal(data.priceMonthly, '19.90')

    const update = await client
      .patch(`/v1/geocoding/plans/${data.id}`)
      .json({ isActive: false })
      .loginAs(user)
    update.assertBodyContains({ data: { isActive: false } })

    const destroy = await client.delete(`/v1/geocoding/plans/${data.id}`).loginAs(user)
    destroy.assertStatus(204)
    assert.isNull(await GeocodingPlan.find(data.id))
  })

  test('a plan with subscriptions cannot be deleted', async ({ client }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const plan = await createGeocodingPlan()
    await GeocodingSubscription.create({ organizationId: acme.id, planId: plan.id, ...fromNow() })

    const response = await client.delete(`/v1/geocoding/plans/${plan.id}`).loginAs(user)
    response.assertStatus(409)
  })

  test('the code is unique', async ({ client }) => {
    const user = await createUser()
    await createGeocodingPlan('pro')

    const response = await client
      .post('/v1/geocoding/plans')
      .json({ code: 'pro', name: 'Pro', priceMonthly: 49, monthlyQuota: null, ratePerSecond: null })
      .loginAs(user)
    response.assertStatus(422)
  })
})

test.group('Geocoding subscriptions', (group) => {
  isolate(group)

  test('subscribing again changes the plan and ends the old subscription', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const pro = await createGeocodingPlan('pro')
    const business = await createGeocodingPlan('business')
    const url = `/v1/geocoding/organizations/${acme.id}/subscriptions`

    const first = await client.post(url).json({ planId: pro.id }).loginAs(user)
    first.assertStatus(201)
    first.assertBodyContains({ data: { isActive: true, plan: { code: 'pro' } } })

    const second = await client.post(url).json({ planId: business.id }).loginAs(user)
    second.assertStatus(201)

    const list = await client.get(url).loginAs(user)
    const { data } = list.body() as { data: { isActive: boolean; plan: { code: string } }[] }
    assert.deepEqual(
      data.map((s) => [s.plan.code, s.isActive]),
      [
        ['business', true],
        ['pro', false],
      ]
    )
  })

  test('cancel ends the subscription but keeps it', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const plan = await createGeocodingPlan()
    const subscription = await GeocodingSubscription.create({
      organizationId: acme.id,
      planId: plan.id,
      ...fromNow(),
    })

    const response = await client
      .delete(`/v1/geocoding/organizations/${acme.id}/subscriptions/${subscription.id}`)
      .loginAs(user)
    response.assertStatus(204)
    await subscription.refresh()
    assert.isNotNull(subscription.endsAt)
  })

  test('an inactive plan cannot be chosen', async ({ client }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const plan = await createGeocodingPlan()
    plan.isActive = false
    await plan.save()

    const response = await client
      .post(`/v1/geocoding/organizations/${acme.id}/subscriptions`)
      .json({ planId: plan.id })
      .loginAs(user)
    response.assertStatus(422)
  })
})

test.group('Geocoding API keys', (group) => {
  isolate(group)

  test('the key is shown once and only its hash is stored', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const url = `/v1/geocoding/organizations/${acme.id}/api-keys`

    const create = await client
      .post(url)
      .json({ name: 'Website', environment: 'test', allowedDomains: ['acme.gr'] })
      .loginAs(user)
    create.assertStatus(201)
    const { apiKey, key } = (
      create.body() as { data: { apiKey: Record<string, unknown>; key: string } }
    ).data
    assert.match(key, /^gk_test_/)
    assert.equal(apiKey.prefix, key.slice(0, 12))
    assert.notProperty(apiKey, 'keyHash')
    assert.deepEqual(apiKey.allowedDomains, ['acme.gr'])

    const row = await GeocodingApiKey.findOrFail(apiKey.id)
    assert.equal(row.keyHash, GeocodingApiKey.hash(key))
    assert.equal(row.createdById, user.id)

    const show = await client.get(`${url}/${apiKey.id}`).loginAs(user)
    assert.notProperty((show.body() as { data: object }).data, 'key')
  })

  test('update and revoke a key', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const { prefix, keyHash } = GeocodingApiKey.generate('production')
    const apiKey = await GeocodingApiKey.create({
      organizationId: acme.id,
      name: 'Old',
      prefix,
      keyHash,
    })
    const url = `/v1/geocoding/organizations/${acme.id}/api-keys/${apiKey.id}`

    const update = await client
      .patch(url)
      .json({ name: 'Mobile app', allowedIps: ['10.0.0.1'] })
      .loginAs(user)
    update.assertBodyContains({ data: { name: 'Mobile app', allowedIps: ['10.0.0.1'] } })

    const revoke = await client.delete(url).loginAs(user)
    revoke.assertStatus(204)
    await apiKey.refresh()
    assert.isNotNull(apiKey.revokedAt)
    assert.isFalse(apiKey.isUsable)
  })
})

test.group('Geocoding usage', (group) => {
  isolate(group)

  test('daily and monthly usage of an organization', async ({ client, assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const other = await createOrganization()
    for (const [date, calls] of [
      ['2026-09-30', 5],
      ['2026-10-01', 10],
      ['2026-10-02', 20],
    ] as const) {
      await GeocodingApiUsageDaily.create({
        organizationId: acme.id,
        date: DateTime.fromISO(date),
        calls,
      })
    }
    await GeocodingApiUsageDaily.create({
      organizationId: other.id,
      date: DateTime.fromISO('2026-10-01'),
      calls: 99,
    })
    await GeocodingApiUsageMonthly.create({ organizationId: acme.id, period: '2026-10', calls: 30 })
    const url = `/v1/geocoding/organizations/${acme.id}/usage`

    const daily = await client
      .get(`${url}/daily`)
      .qs({ from: '2026-10-01', to: '2026-10-31' })
      .loginAs(user)
    daily.assertStatus(200)
    const days = (daily.body() as { data: { calls: number }[] }).data
    assert.deepEqual(
      days.map((d) => d.calls),
      [10, 20]
    )

    const monthly = await client.get(`${url}/monthly`).loginAs(user)
    monthly.assertBodyContains({ data: [{ period: '2026-10', calls: 30 }] })

    const calls = await client.get(url).loginAs(user)
    calls.assertStatus(200)
  })
})
