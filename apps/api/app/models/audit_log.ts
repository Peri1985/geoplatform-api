import { AuditLogSchema } from '#database/schema'

/**
 * One entry of the audit log. Append-only: a database trigger rejects updates,
 * and rows are removed only by the retention prune (see app/services/audit.ts).
 */
export default class AuditLog extends AuditLogSchema {}
