import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Subscriptions of organizations to the geocoding API.
 * ends_at NULL = still active. At most one active subscription per organization:
 * to change plan, set ends_at on the current one and create a new one.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.withSchema('geocoding').createTable('geocoding_subscriptions', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('organization_id')
        .notNullable()
        .references('id')
        .inTable('public.organizations')
        .onDelete('CASCADE')
        .index()
      // RESTRICT: a plan with subscribers cannot be deleted
      table
        .uuid('plan_id')
        .notNullable()
        .references('id')
        .inTable('geocoding.geocoding_plans')
        .onDelete('RESTRICT')
      table.timestamp('starts_at', { useTz: true }).notNullable()
      table.timestamp('ends_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX geocoding_subscriptions_one_active ON geocoding.geocoding_subscriptions (organization_id) WHERE ends_at IS NULL'
    )
  }

  async down() {
    this.schema.withSchema('geocoding').dropTable('geocoding_subscriptions')
  }
}
