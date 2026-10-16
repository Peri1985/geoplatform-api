import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * API calls per organization and day, for charts and the monthly quota without
 * counting every row of api_usage. One row per organization and day.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.withSchema('geocoding').createTable('geocoding_api_usage_daily', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('organization_id')
        .notNullable()
        .references('id')
        .inTable('public.organizations')
        .onDelete('CASCADE')
      table.date('date').notNullable()
      table.integer('calls').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['organization_id', 'date'])
    })
  }

  async down() {
    this.schema.withSchema('geocoding').dropTable('geocoding_api_usage_daily')
  }
}
