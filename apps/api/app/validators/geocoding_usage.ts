import vine from '@vinejs/vine'
import { pagination } from '#validators/pagination'

const day = () => vine.date({ formats: ['YYYY-MM-DD'] }).optional()
const month = () =>
  vine
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()

/**
 * ?apiKeyId=&endpoint=forward&statusCode=200&billable=true&from=<ISO>&to=<ISO>
 */
export const listUsageValidator = vine.create({
  ...pagination,
  apiKeyId: vine.string().uuid().optional(),
  endpoint: vine.string().trim().maxLength(50).optional(),
  statusCode: vine.number().withoutDecimals().optional(),
  billable: vine.boolean().optional(),
  from: vine.date({ formats: ['iso8601'] }).optional(),
  to: vine.date({ formats: ['iso8601'] }).optional(),
})

/**
 * ?from=2026-10-01&to=2026-10-31 (days, both included)
 */
export const dailyUsageValidator = vine.create({ from: day(), to: day() })

/**
 * ?from=2026-01&to=2026-12 (months, both included)
 */
export const monthlyUsageValidator = vine.create({ from: month(), to: month() })
