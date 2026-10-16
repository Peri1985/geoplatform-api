import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // gen_random_uuid() is built into PostgreSQL 13+
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      // Staff of our company: full control of the platform, outside any organization
      table.string('type').notNullable().defaultTo('admin')
      table.string('locale', 5).notNullable().defaultTo('el')
      // Encrypted by the app before saving
      table.text('two_factor_secret').nullable()
      table.text('two_factor_recovery_codes').nullable()
      table.boolean('two_factor_enabled').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
