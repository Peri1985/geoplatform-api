import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Where the file is in S3 (see documentations/infrastructure/STORAGE.md)
      table.string('key', 512).notNullable().unique()
      // The original file name, as the user uploaded it
      table.string('name', 255).notNullable()
      table.string('mime_type', 255).notNullable()
      table.integer('size').notNullable()

      // Who the file belongs to: the files list of a user
      table
        .uuid('owner_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      // What the file is attached to, if anything (polymorphic): the table name of the
      // record (e.g. "users") and its id. No foreign key: it points to different tables.
      table.string('attachable_type', 100).nullable()
      table.uuid('attachable_id').nullable()
      table.index(['attachable_type', 'attachable_id'])

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
