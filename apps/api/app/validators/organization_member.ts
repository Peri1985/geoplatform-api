import vine from '@vinejs/vine'
import { search } from '#validators/pagination'

const role = () => vine.enum(['admin', 'member', 'guest'])

/**
 * The organization comes from the URL, as metadata, so that a user can be
 * added to it only once
 */
export const addMemberValidator = vine.withMetaData<{ organizationId: string }>().create({
  userId: vine
    .string()
    .uuid()
    .exists({ table: 'users', column: 'id' })
    .unique({
      table: 'organization_members',
      column: 'user_id',
      filter: (db, _, field) => {
        db.where('organization_id', field.meta.organizationId)
      },
    }),
  role: role().optional(),
})

export const updateMemberValidator = vine.create({
  role: role().optional(),
  status: vine.enum(['active', 'disabled']).optional(),
})

export const listMembersValidator = vine.create({
  search: search(),
  role: role().optional(),
  status: vine.enum(['active', 'disabled']).optional(),
})
