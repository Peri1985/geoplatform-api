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
  files: {
    index: typeof routes['files.index']
    store: typeof routes['files.store']
    show: typeof routes['files.show']
    destroy: typeof routes['files.destroy']
  }
  organizations: {
    index: typeof routes['organizations.index']
    store: typeof routes['organizations.store']
    show: typeof routes['organizations.show']
    update: typeof routes['organizations.update']
    destroy: typeof routes['organizations.destroy']
    members: {
      index: typeof routes['organizations.members.index']
      store: typeof routes['organizations.members.store']
      show: typeof routes['organizations.members.show']
      update: typeof routes['organizations.members.update']
      destroy: typeof routes['organizations.members.destroy']
    }
  }
  geocoding: {
    plans: {
      index: typeof routes['geocoding.plans.index']
      store: typeof routes['geocoding.plans.store']
      show: typeof routes['geocoding.plans.show']
      update: typeof routes['geocoding.plans.update']
      destroy: typeof routes['geocoding.plans.destroy']
    }
    organization: {
      subscriptions: {
        index: typeof routes['geocoding.organization.subscriptions.index']
        store: typeof routes['geocoding.organization.subscriptions.store']
        show: typeof routes['geocoding.organization.subscriptions.show']
        destroy: typeof routes['geocoding.organization.subscriptions.destroy']
      }
    }
    apiKeys: {
      index: typeof routes['geocoding.api_keys.index']
      store: typeof routes['geocoding.api_keys.store']
      show: typeof routes['geocoding.api_keys.show']
      update: typeof routes['geocoding.api_keys.update']
      destroy: typeof routes['geocoding.api_keys.destroy']
    }
    usage: {
      index: typeof routes['geocoding.usage.index']
      daily: typeof routes['geocoding.usage.daily']
      monthly: typeof routes['geocoding.usage.monthly']
    }
  }
  docs: {
    show: typeof routes['docs.show']
    json: typeof routes['docs.json']
  }
}
