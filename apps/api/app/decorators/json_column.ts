import { column } from '@adonisjs/lucid/orm'

/**
 * Lucid column for jsonb. The pg driver would send a JavaScript array as a
 * PostgreSQL array (not JSON), so values are serialized here; reading needs
 * nothing, as pg already parses jsonb.
 */
export function jsonColumn(options: Parameters<typeof column>[0] = {}) {
  return column({
    ...options,
    prepare: (value: unknown) =>
      value === null || value === undefined ? value : JSON.stringify(value),
  })
}
