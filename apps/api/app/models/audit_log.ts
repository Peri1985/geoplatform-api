import { AuditLogSchema } from '#database/schema'
import { compose } from '@adonisjs/core/helpers'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'

/**
 * One entry of the audit log. Append-only: a database trigger rejects updates,
 * and rows are removed only by the retention prune (see app/services/audit.ts).
 */
export default class AuditLog extends compose(AuditLogSchema, withFilters(filters.AuditLog)) {}
