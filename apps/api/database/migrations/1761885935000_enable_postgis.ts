import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS postgis')
  }

  async down() {
    // Intentionally empty: the PostGIS docker image also installs postgis_topology and
    // postgis_tiger_geocoder, which depend on postgis, so it cannot be dropped here.
  }
}
