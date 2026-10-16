import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.withSchema('geocoding').createTable('geocoding_api_usage', (table) => {
      // One row per API call, without the searched address (personal data).
      // High volume: candidate for monthly partitioning (see DB.md).
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('organization_id')
        .notNullable()
        .references('id')
        .inTable('public.organizations')
        .onDelete('CASCADE')
      table
        .uuid('api_key_id')
        .nullable()
        .references('id')
        .inTable('geocoding.geocoding_api_keys')
        .onDelete('SET NULL')
      // forward, reverse, autocomplete, batch
      table.string('endpoint', 50).notNullable()
      table.smallint('status_code').notNullable()
      table.integer('response_ms').notNullable()
      table.smallint('result_count').notNullable().defaultTo(0)
      table.boolean('billable').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.index(['organization_id', 'created_at'])
      table.index(['api_key_id', 'created_at'])
    })
  }

  async down() {
    this.schema.withSchema('geocoding').dropTable('geocoding_api_usage')
  }
}
