import vine from '@vinejs/vine'
import { search } from '#validators/pagination'

const restrictions = {
  // Empty = no restriction
  allowedDomains: vine.array(vine.string().trim().maxLength(253)).maxLength(50).optional(),
  allowedIps: vine.array(vine.string().ipAddress()).maxLength(50).optional(),
  expiresAt: vine
    .date({ formats: ['iso8601'] })
    .afterOrEqual('today')
    .nullable()
    .optional(),
}

export const createGeocodingApiKeyValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(100),
  environment: vine.enum(['production', 'test']).optional(),
  ...restrictions,
})

export const updateGeocodingApiKeyValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(100).optional(),
  ...restrictions,
})

export const listGeocodingApiKeysValidator = vine.create({
  search: search(),
  environment: vine.enum(['production', 'test']).optional(),
  revoked: vine.boolean().optional(),
})
