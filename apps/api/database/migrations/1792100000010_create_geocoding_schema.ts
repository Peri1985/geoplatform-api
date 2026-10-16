import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // The tables of the geocoding product; shared tables stay in public
    this.schema.raw('CREATE SCHEMA IF NOT EXISTS geocoding')
  }

  async down() {
    this.schema.raw('DROP SCHEMA IF EXISTS geocoding CASCADE')
  }
}
