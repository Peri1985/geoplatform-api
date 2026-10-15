import { RoleSchema } from '#database/schema'
import User from '#models/user'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Role extends RoleSchema {
  /**
   * The users who have this role, through the role_user pivot table
   */
  @manyToMany(() => User, {
    pivotTable: 'role_user',
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>
}
