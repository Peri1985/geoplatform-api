import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken

  get isAdmin() {
    return this.role === 'admin'
  }

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  /**
   * Deletes every access token of the user, logging them out on all devices
   */
  static async revokeAllTokens(user: User) {
    for (const token of await User.accessTokens.all(user)) {
      await User.accessTokens.delete(user, token.identifier)
    }
  }
}
