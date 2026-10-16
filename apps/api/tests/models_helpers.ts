import GeocodingPlan from '#models/geocoding_plan'
import Organization from '#models/organization'
import { DateTime } from 'luxon'

let counter = 0

export function createOrganization(attributes: Partial<Pick<Organization, 'name'>> = {}) {
  counter++
  return Organization.create({ name: `Org ${counter}`, ...attributes })
}

export function createGeocodingPlan(code = 'pro') {
  return GeocodingPlan.create({
    code,
    name: code.toUpperCase(),
    priceMonthly: '49.00',
    monthlyQuota: 500_000,
    ratePerSecond: 50,
  })
}

export const now = () => DateTime.now()

export const fromNow = () => ({ startsAt: now() })
