import { GroupSchema } from '#database/schema'
import User from '#models/user'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Group extends GroupSchema {
  /**
   * The members of the group, through the group_user pivot table
   */
  @manyToMany(() => User, {
    pivotTable: 'group_user',
    pivotForeignKey: 'group_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>
}
