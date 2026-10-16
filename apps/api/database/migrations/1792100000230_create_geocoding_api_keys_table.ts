import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.withSchema('geocoding').createTable('geocoding_api_keys', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('organization_id')
        .notNullable()
        .references('id')
        .inTable('public.organizations')
        .onDelete('CASCADE')
        .index()
      table.string('name', 100).notNullable()
      table
        .enu('environment', ['production', 'test'], {
          useNative: true,
          enumName: 'api_key_environment',
          schemaName: 'geocoding',
        })
        .notNullable()
        .defaultTo('production')
      // The visible start of the key (e.g. gk_live_ab12), to tell keys apart
      table.string('prefix', 20).notNullable()
      // SHA-256 of the key; the key itself is shown once and never stored
      table.string('key_hash', 64).notNullable().unique()
      // Empty = no restriction
      table.jsonb('allowed_domains').notNullable().defaultTo('[]')
      table.jsonb('allowed_ips').notNullable().defaultTo('[]')
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table
        .uuid('created_by_id')
        .nullable()
        .references('id')
        .inTable('public.users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.withSchema('geocoding').dropTable('geocoding_api_keys')
    this.schema.raw('DROP TYPE IF EXISTS geocoding.api_key_environment')
  }
}
