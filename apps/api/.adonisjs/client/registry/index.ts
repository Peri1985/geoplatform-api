/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'health.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/health',
    tokens: [{"old":"/api/v1/health","type":0,"val":"api","end":""},{"old":"/api/v1/health","type":0,"val":"v1","end":""},{"old":"/api/v1/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health.show']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'places.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/places',
    tokens: [{"old":"/api/v1/places","type":0,"val":"api","end":""},{"old":"/api/v1/places","type":0,"val":"v1","end":""},{"old":"/api/v1/places","type":0,"val":"places","end":""}],
    types: placeholder as Registry['places.index']['types'],
  },
  'places.nearby': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/places/nearby',
    tokens: [{"old":"/api/v1/places/nearby","type":0,"val":"api","end":""},{"old":"/api/v1/places/nearby","type":0,"val":"v1","end":""},{"old":"/api/v1/places/nearby","type":0,"val":"places","end":""},{"old":"/api/v1/places/nearby","type":0,"val":"nearby","end":""}],
    types: placeholder as Registry['places.nearby']['types'],
  },
  'places.store': {
    methods: ["POST"],
    pattern: '/api/v1/places',
    tokens: [{"old":"/api/v1/places","type":0,"val":"api","end":""},{"old":"/api/v1/places","type":0,"val":"v1","end":""},{"old":"/api/v1/places","type":0,"val":"places","end":""}],
    types: placeholder as Registry['places.store']['types'],
  },
  'places.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/places/:id',
    tokens: [{"old":"/api/v1/places/:id","type":0,"val":"api","end":""},{"old":"/api/v1/places/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/places/:id","type":0,"val":"places","end":""},{"old":"/api/v1/places/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['places.update']['types'],
  },
  'places.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/places/:id',
    tokens: [{"old":"/api/v1/places/:id","type":0,"val":"api","end":""},{"old":"/api/v1/places/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/places/:id","type":0,"val":"places","end":""},{"old":"/api/v1/places/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['places.destroy']['types'],
  },
  'users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users',
    tokens: [{"old":"/api/v1/users","type":0,"val":"api","end":""},{"old":"/api/v1/users","type":0,"val":"v1","end":""},{"old":"/api/v1/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.index']['types'],
  },
  'users.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/users/:id',
    tokens: [{"old":"/api/v1/users/:id","type":0,"val":"api","end":""},{"old":"/api/v1/users/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/users/:id","type":0,"val":"users","end":""},{"old":"/api/v1/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.update']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
