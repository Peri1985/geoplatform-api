import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    audit_logs: {
      columns: {
        // jsonb: the pg driver parses it into an object
        changes: {
          tsType: 'Record<string, unknown>',
          decorators: [{ name: '@column' }],
        },
      },
    },
  },
} satisfies SchemaRules
