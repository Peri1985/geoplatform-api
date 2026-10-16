import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('organizations', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name', 200).notNullable()
      table
        .enu('status', ['active', 'suspended'], {
          useNative: true,
          enumName: 'organization_status',
        })
        .notNullable()
        .defaultTo('active')
      table.timestamp('suspended_at', { useTz: true }).nullable()
      table.string('locale', 5).notNullable().defaultTo('el')
      table.string('timezone', 64).notNullable().defaultTo('Europe/Athens')

      // Billing details (ΑΦΜ, ΔΟΥ) for invoices
      table.string('legal_name', 255).nullable()
      table.string('vat_number', 20).nullable()
      table.string('tax_office', 100).nullable()
      table.text('billing_address').nullable()
      table.string('billing_email', 254).nullable()
      table.string('stripe_customer_id', 100).nullable().unique()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable('organizations')
    this.schema.raw('DROP TYPE IF EXISTS organization_status')
  }
}
