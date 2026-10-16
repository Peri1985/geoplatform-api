import GeocodingApiKey from '#models/geocoding_api_key'
import GeocodingApiUsage from '#models/geocoding_api_usage'
import GeocodingApiUsageDaily from '#models/geocoding_api_usage_daily'
import GeocodingApiUsageMonthly from '#models/geocoding_api_usage_monthly'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { isolate } from '#tests/helpers'
import { createOrganization, now } from '#tests/models_helpers'

test.group('Models: geocoding', (group) => {
  isolate(group)

  test('api keys live in the geocoding schema and keep their restrictions', async ({ assert }) => {
    const acme = await createOrganization()
    const key = await GeocodingApiKey.create({
      organizationId: acme.id,
      name: 'Production',
      prefix: 'gk_live_ab12',
      keyHash: 'a'.repeat(64),
      allowedDomains: ['example.gr', '*.example.gr'],
      allowedIps: ['192.0.2.0/24'],
    })

    assert.equal(GeocodingApiKey.table, 'geocoding.geocoding_api_keys')
    const fresh = await GeocodingApiKey.findOrFail(key.id)
    assert.deepEqual(fresh.allowedDomains, ['example.gr', '*.example.gr'])
    assert.equal(fresh.environment, 'production')
    assert.isTrue(fresh.isUsable)

    fresh.revokedAt = now()
    assert.isFalse(fresh.isUsable)
  })

  test('usage is recorded per call and summed per day', async ({ assert }) => {
    const acme = await createOrganization()
    const key = await GeocodingApiKey.create({
      organizationId: acme.id,
      name: 'Test',
      environment: 'test',
      prefix: 'gk_test_cd34',
      keyHash: 'b'.repeat(64),
    })
    await GeocodingApiUsage.create({
      organizationId: acme.id,
      apiKeyId: key.id,
      endpoint: 'forward',
      statusCode: 200,
      responseMs: 42,
      resultCount: 1,
    })
    const day = { organizationId: acme.id, date: DateTime.fromISO('2026-10-16') }
    await GeocodingApiUsageDaily.create({ ...day, calls: 10 })

    assert.lengthOf(await GeocodingApiUsage.query().where('api_key_id', key.id), 1)
    // One row per organization and day
    await assert.rejects(() => GeocodingApiUsageDaily.create({ ...day, calls: 5 }))
  })

  test('monthly usage is one row per organization and month', async ({ assert }) => {
    const acme = await createOrganization()
    const month = { organizationId: acme.id, period: '2026-10' }
    await GeocodingApiUsageMonthly.create({ ...month, calls: 100 })

    // One row per organization and month
    await assert.rejects(() => GeocodingApiUsageMonthly.create({ ...month, calls: 5 }))
  })
})
