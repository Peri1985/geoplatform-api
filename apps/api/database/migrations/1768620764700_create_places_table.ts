import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'places'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 200).notNullable()
      // WGS84 point (lon/lat). Lucid has no geometry type, hence specificType
      table.specificType('location', 'geometry(Point, 4326)').notNullable()
      // The owner; only they (or an admin) can change the place
      table
        .integer('created_by_id')
        .nullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .index()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
    // Spatial index for ST_DWithin and friends
    this.schema.raw('CREATE INDEX places_location_gist ON places USING gist (location)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
