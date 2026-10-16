import vine from '@vinejs/vine'
import { search } from '#validators/pagination'

const limits = {
  name: vine.string().trim().minLength(1).maxLength(100),
  // Euros without VAT, up to 2 decimals
  priceMonthly: vine.number().min(0).decimal([0, 2]),
  // null = no limit
  monthlyQuota: vine.number().withoutDecimals().min(1).nullable(),
  ratePerSecond: vine.number().withoutDecimals().min(1).nullable(),
  isActive: vine.boolean().optional(),
}

export const createGeocodingPlanValidator = vine.create({
  code: vine
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/)
    .maxLength(50)
    .unique({ table: 'geocoding.geocoding_plans', column: 'code' }),
  ...limits,
})

/**
 * The code cannot change: it identifies the plan
 */
export const updateGeocodingPlanValidator = vine.create({
  name: limits.name.optional(),
  priceMonthly: limits.priceMonthly.optional(),
  monthlyQuota: limits.monthlyQuota.optional(),
  ratePerSecond: limits.ratePerSecond.optional(),
  isActive: limits.isActive,
})

export const listGeocodingPlansValidator = vine.create({
  search: search(),
  isActive: vine.boolean().optional(),
})
