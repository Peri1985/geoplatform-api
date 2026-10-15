import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * node ace audit:prune [--days=365]
 */
export default class AuditPrune extends BaseCommand {
  static commandName = 'audit:prune'
  static description = 'Delete audit log entries older than the retention period'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({ description: 'Keep this many days (default: AUDIT_RETENTION_DAYS or 365)' })
  declare days?: number

  async run() {
    // Imported here: services (db) are ready only once the app has started
    const { pruneAuditLog, retentionDays } = await import('#services/audit')
    const days = this.days ?? retentionDays()
    const deleted = await pruneAuditLog(days)
    this.logger.success(`Deleted ${deleted} audit log entries older than ${days} days`)
  }
}
