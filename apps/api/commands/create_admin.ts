import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { randomBytes } from 'node:crypto'

/**
 * node ace create:admin <email>
 */
export default class CreateAdmin extends BaseCommand {
  static commandName = 'create:admin'
  static description = 'Create the first admin, or make an existing user admin'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email of the admin' })
  declare email: string

  async run() {
    const email = this.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      this.logger.error(`"${this.email}" is not an email address`)
      this.exitCode = 1
      return
    }

    // Imported here: services (hash, db) are ready only once the app has started
    const { default: User } = await import('#models/user')

    const existing = await User.findBy('email', email)
    if (existing) {
      existing.merge({ role: 'admin', isActive: true })
      await existing.save()
      // Their next login gets them in as admin
      await User.revokeAllTokens(existing)
      this.logger.success(`${email} is now an admin. They must log in again.`)
      return
    }

    const password = randomBytes(18).toString('base64url')
    await User.create({ email, password, role: 'admin', isActive: true })
    this.logger.success(`Created admin ${email}`)
    this.logger.info(`Password: ${password}`)
    this.logger.warning('Shown only once: store it somewhere safe.')
  }
}
