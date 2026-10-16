import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The packages of the geocoding API (e.g. Free, Basic, Pro).
 * A package is not changed once it has subscribers: create a new one and set the
 * old one to is_active = false.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.withSchema('geocoding').createTable('geocoding_plans', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      // e.g. free, basic, pro
      table.string('code', 50).notNullable().unique()
      table.string('name', 100).notNullable()
      // In euros, without VAT
      table.decimal('price_monthly', 10, 2).notNullable().defaultTo(0)
      // API calls per month and per second; NULL = no limit
      table.integer('monthly_quota').nullable()
      table.integer('rate_per_second').nullable()
      // Can be chosen by new customers
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.withSchema('geocoding').dropTable('geocoding_plans')
  }
}
