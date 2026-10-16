import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('organization_members', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('organization_id')
        .notNullable()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
        .index()
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      // The role inside this organization
      table
        .enu('role', ['admin', 'member', 'guest'], { useNative: true, enumName: 'member_role' })
        .notNullable()
        .defaultTo('member')
      table
        .enu('status', ['active', 'disabled'], { useNative: true, enumName: 'member_status' })
        .notNullable()
        .defaultTo('active')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['organization_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable('organization_members')
    this.schema.raw('DROP TYPE IF EXISTS member_status')
    this.schema.raw('DROP TYPE IF EXISTS member_role')
  }
}
