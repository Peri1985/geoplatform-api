/*
|--------------------------------------------------------------------------
| Audit log retention
|--------------------------------------------------------------------------
|
| Prunes audit log entries older than AUDIT_RETENTION_DAYS when the server
| starts and then once a day. Loaded only by the HTTP server (adonisrc.ts).
| The same can be run by hand: node ace audit:prune
|
*/

import { pruneAuditLog } from '#services/audit'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'

const ONE_DAY = 24 * 60 * 60 * 1000

async function prune() {
  try {
    const deleted = await pruneAuditLog()
    if (deleted > 0) logger.info({ deleted }, 'pruned old audit log entries')
  } catch (error) {
    logger.error({ err: error }, 'audit log prune failed')
  }
}

app.ready(() => {
  void prune()
  // unref: the timer does not keep the process alive on shutdown
  setInterval(prune, ONE_DAY).unref()
})
