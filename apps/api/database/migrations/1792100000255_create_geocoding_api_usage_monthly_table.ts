import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * API calls per organization and month, to check the monthly quota of the plan
 * with one lookup. One row per organization and month.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.withSchema('geocoding').createTable('geocoding_api_usage_monthly', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('organization_id')
        .notNullable()
        .references('id')
        .inTable('public.organizations')
        .onDelete('CASCADE')
      // YYYY-MM, e.g. 2026-10
      table.string('period', 7).notNullable()
      table.integer('calls').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.unique(['organization_id', 'period'])
    })
  }

  async down() {
    this.schema.withSchema('geocoding').dropTable('geocoding_api_usage_monthly')
  }
}
