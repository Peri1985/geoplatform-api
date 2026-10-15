import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'group_user'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('group_id')
        .notNullable()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')
        .index()
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table.unique(['group_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
