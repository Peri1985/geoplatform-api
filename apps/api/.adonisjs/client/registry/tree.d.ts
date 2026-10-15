/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: {
    show: typeof routes['health.show']
  }
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  places: {
    index: typeof routes['places.index']
    nearby: typeof routes['places.nearby']
    store: typeof routes['places.store']
    update: typeof routes['places.update']
    destroy: typeof routes['places.destroy']
  }
  users: {
    index: typeof routes['users.index']
    update: typeof routes['users.update']
  }
}
