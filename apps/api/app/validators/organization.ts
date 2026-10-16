import vine from '@vinejs/vine'
import { pagination, search } from '#validators/pagination'

const details = {
  locale: vine.string().trim().maxLength(5).optional(),
  timezone: vine.string().trim().maxLength(64).optional(),
  legalName: vine.string().trim().maxLength(255).nullable().optional(),
  vatNumber: vine.string().trim().maxLength(20).nullable().optional(),
  taxOffice: vine.string().trim().maxLength(100).nullable().optional(),
  billingAddress: vine.string().trim().nullable().optional(),
  billingEmail: vine.string().trim().email().maxLength(254).nullable().optional(),
}

export const createOrganizationValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(200),
  ...details,
})

export const updateOrganizationValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(200).optional(),
  status: vine.enum(['active', 'suspended']).optional(),
  ...details,
})

/**
 * Query string of GET /organizations (see app/filters/organization_filter.ts)
 */
export const listOrganizationsValidator = vine.create({
  ...pagination,
  search: search(),
  status: vine.enum(['active', 'suspended']).optional(),
})
