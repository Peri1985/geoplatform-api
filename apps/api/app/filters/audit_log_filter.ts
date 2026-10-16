import { BaseFilter } from '#mixins/with_filters'
import type { DateTime } from 'luxon'

export default class AuditLogFilter extends BaseFilter {
  userId(value: string) {
    this.query.where('user_id', value)
  }

  /**
   * e.g. "organizations.updated"
   */
  action(value: string) {
    this.query.where('action', value)
  }

  subjectType(value: string) {
    this.query.where('subject_type', value)
  }

  subjectId(value: string) {
    this.query.where('subject_id', value)
  }

  from(value: DateTime) {
    this.query.where('created_at', '>=', value.toISO()!)
  }

  to(value: DateTime) {
    this.query.where('created_at', '<=', value.toISO()!)
  }
}
