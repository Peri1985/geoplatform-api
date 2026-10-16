import vine from '@vinejs/vine'

/**
 * ?page=2, for the validators of paginated lists. The page size is the same for
 * all of them, in config/pagination.ts.
 */
export const pagination = {
  page: vine.number().withoutDecimals().min(1).optional(),
}

/**
 * Text search, e.g. ?search=acme
 */
export const search = () => vine.string().trim().maxLength(100).optional()
