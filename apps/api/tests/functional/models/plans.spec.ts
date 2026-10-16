import GeocodingPlan from '#models/geocoding_plan'
import GeocodingSubscription from '#models/geocoding_subscription'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { isolate } from '#tests/helpers'
import { createGeocodingPlan, createOrganization, fromNow } from '#tests/models_helpers'

test.group('Models: plans and subscriptions', (group) => {
  isolate(group)

  test('a geocoding plan keeps its limits and its price as an exact decimal', async ({
    assert,
  }) => {
    const plan = await createGeocodingPlan()
    const fresh = await GeocodingPlan.findOrFail(plan.id)

    assert.equal(GeocodingPlan.table, 'geocoding.geocoding_plans')
    assert.equal(fresh.priceMonthly, '49.00')
    assert.equal(fresh.monthlyQuota, 500_000)
    assert.isTrue(fresh.isActive)
  })

  test('only one active subscription per organization and product', async ({ assert }) => {
    const acme = await createOrganization()
    const plan = await createGeocodingPlan()
    const first = await GeocodingSubscription.create({
      organizationId: acme.id,
      planId: plan.id,
      ...fromNow(),
    })

    // Once the first has ended, a new one (e.g. an upgrade) is allowed
    first.endsAt = DateTime.now()
    await first.save()
    assert.isFalse(first.isActive)
    await GeocodingSubscription.create({ organizationId: acme.id, planId: plan.id, ...fromNow() })

    // A second active one is not (last: a failed query ends the test's transaction)
    await assert.rejects(() =>
      GeocodingSubscription.create({ organizationId: acme.id, planId: plan.id, ...fromNow() })
    )
  })
})
