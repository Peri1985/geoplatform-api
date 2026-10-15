import { audit, REDACTED_FIELDS } from '#services/audit'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { afterCreate, afterDelete, afterUpdate, beforeUpdate } from '@adonisjs/lucid/orm'
import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'

/**
 * Records every create, update and delete of a model in the audit log, as
 * "<table>.created" / ".updated" / ".deleted". Use it with compose():
 *
 *   export default class File extends compose(FileSchema, withAudit()) {}
 *
 * Updates record only the changed fields, as { field: { from, to } }.
 * Fields in REDACTED_FIELDS (passwords) and in `exclude` are never recorded.
 */
export function withAudit(options: { exclude?: string[] } = {}) {
  const excluded = new Set([...REDACTED_FIELDS, ...(options.exclude ?? [])])

  const snapshot = (row: LucidRow) =>
    Object.fromEntries(Object.entries(row.$attributes).filter(([key]) => !excluded.has(key)))

  const diff = (row: LucidRow) =>
    Object.fromEntries(
      Object.entries(row.$dirty)
        .filter(([key]) => !excluded.has(key))
        .map(([key, to]) => [key, { from: row.$original[key] ?? null, to }])
    )

  const record = (row: LucidRow, event: string, changes: Record<string, unknown>) => {
    const table = (row.constructor as LucidModel).table
    return audit({
      action: `${table}.${event}`,
      subject: row,
      changes,
      // A user who signs up is the author of their own record
      userId: table === 'users' && event === 'created' ? String(row.$primaryKeyValue) : null,
      client: row.$trx,
    })
  }

  return <T extends NormalizeConstructor<LucidModel>>(superclass: T) => {
    class Audited extends superclass {
      declare $auditChanges?: Record<string, unknown>

      @afterCreate()
      static async auditCreate(row: Audited) {
        await record(row, 'created', snapshot(row))
      }

      // $dirty is cleared after saving, so the diff is taken before
      @beforeUpdate()
      static auditCaptureChanges(row: Audited) {
        row.$auditChanges = diff(row)
      }

      @afterUpdate()
      static async auditUpdate(row: Audited) {
        const changes = row.$auditChanges ?? {}
        row.$auditChanges = undefined
        if (Object.keys(changes).length > 0) await record(row, 'updated', changes)
      }

      @afterDelete()
      static async auditDelete(row: Audited) {
        await record(row, 'deleted', snapshot(row))
      }
    }
    return Audited
  }
}
