import AuditLog from '#models/audit_log'
import env from '#start/env'
import { HttpContext } from '@adonisjs/core/http'
import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

/**
 * Fields never written to the audit log, in any model
 */
export const REDACTED_FIELDS = [
  'password',
  'rememberMeToken',
  'twoFactorSecret',
  'twoFactorRecoveryCodes',
  'tokenHash',
  'keyHash',
  'secret',
]

export interface AuditEntry {
  /**
   * What happened, as "<table>.<event>": "files.created", "files.url_issued"
   */
  action: string
  /**
   * The record it happened to
   */
  subject?: LucidRow
  changes?: Record<string, unknown> | null
  /**
   * Who did it, when there is no logged-in user in the request (e.g. signup)
   */
  userId?: string | null
  /**
   * Write inside this transaction, so the entry is kept only if the change is
   */
  client?: TransactionClientContract
}

/**
 * Writes an audit log entry. The user, IP, user agent and request id come from the
 * current HTTP request, when there is one (HttpContext uses AsyncLocalStorage).
 */
export async function audit({ action, subject, changes = null, userId, client }: AuditEntry) {
  const ctx = HttpContext.get()

  await AuditLog.create(
    {
      action,
      userId: ctx?.auth?.user?.id ?? userId ?? null,
      subjectType: subject ? (subject.constructor as LucidModel).table : null,
      subjectId: subject ? String(subject.$primaryKeyValue) : null,
      changes,
      ip: ctx?.request.ip() ?? null,
      userAgent: ctx?.request.header('user-agent') ?? null,
      requestId: ctx?.request.id() ?? null,
    },
    { client }
  )
}

/**
 * How many days audit entries are kept (AUDIT_RETENTION_DAYS, default 365)
 */
export function retentionDays() {
  return env.get('AUDIT_RETENTION_DAYS') ?? 365
}

/**
 * Deletes the entries older than the retention period; returns how many
 */
export async function pruneAuditLog(days = retentionDays()) {
  const cutoff = DateTime.now().minus({ days }).toSQL()!
  const deleted = await AuditLog.query().where('created_at', '<', cutoff).delete()
  return Number(deleted[0] ?? 0)
}
