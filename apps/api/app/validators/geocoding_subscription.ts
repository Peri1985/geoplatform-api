import vine from '@vinejs/vine'
import Model from '#models/geocoding_subscription'

const relations = Object.keys(Object.fromEntries(Model.$relationsDefinitions))

export const listValidator = vine.create({
  planId: vine.string().uuid().optional(),
  page: vine.number().optional(),
  pagination: vine.boolean().optional(),
  orderBy: vine.array(vine.object({
    column: vine.string(),
    order: vine.enum(['asc', 'desc']),
  })).optional(),
  active: vine.boolean().optional(),
  preloads: vine.array(vine.enum(relations)).optional(),
})

export const createValidator = vine.create({
  organizationId: vine
    .string()
    .uuid()
    .exists({
      table: 'public.organizatons',
      column: 'id',
    }),
  planId: vine
    .string()
    .uuid()
    .exists({
      table: 'geocoding.geocoding_plans',
      column: 'id',
      // Only plans that new customers can choose
      filter: (db) => {
        db.where('is_active', true)
      },
    }),
})

export const showValidator = vine.create({
  preloads: vine.array(vine.enum(relations)).optional(),
})
