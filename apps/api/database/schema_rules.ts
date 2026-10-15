import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    users: {
      columns: {
        role: { tsType: `'admin' | 'user'`, decorators: [{ name: '@column' }] },
      },
    },
    places: {
      // Declared by hand in app/models/place.ts with the point column decorator,
      // which converts between GeoJSON and PostGIS
      skipColumns: ['location'],
    },
  },
} satisfies SchemaRules
