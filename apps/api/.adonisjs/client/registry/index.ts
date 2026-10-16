/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'health.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/health',
    tokens: [{"old":"/v1/health","type":0,"val":"v1","end":""},{"old":"/v1/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health.show']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/v1/auth/signup',
    tokens: [{"old":"/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/v1/auth/login',
    tokens: [{"old":"/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/account/profile',
    tokens: [{"old":"/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/v1/account/profile","type":0,"val":"account","end":""},{"old":"/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/v1/account/logout',
    tokens: [{"old":"/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/v1/account/logout","type":0,"val":"account","end":""},{"old":"/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'files.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/files',
    tokens: [{"old":"/v1/files","type":0,"val":"v1","end":""},{"old":"/v1/files","type":0,"val":"files","end":""}],
    types: placeholder as Registry['files.index']['types'],
  },
  'files.store': {
    methods: ["POST"],
    pattern: '/v1/files',
    tokens: [{"old":"/v1/files","type":0,"val":"v1","end":""},{"old":"/v1/files","type":0,"val":"files","end":""}],
    types: placeholder as Registry['files.store']['types'],
  },
  'files.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/files/:id',
    tokens: [{"old":"/v1/files/:id","type":0,"val":"v1","end":""},{"old":"/v1/files/:id","type":0,"val":"files","end":""},{"old":"/v1/files/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['files.show']['types'],
  },
  'files.destroy': {
    methods: ["DELETE"],
    pattern: '/v1/files/:id',
    tokens: [{"old":"/v1/files/:id","type":0,"val":"v1","end":""},{"old":"/v1/files/:id","type":0,"val":"files","end":""},{"old":"/v1/files/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['files.destroy']['types'],
  },
  'organizations.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/organizations',
    tokens: [{"old":"/v1/organizations","type":0,"val":"v1","end":""},{"old":"/v1/organizations","type":0,"val":"organizations","end":""}],
    types: placeholder as Registry['organizations.index']['types'],
  },
  'organizations.store': {
    methods: ["POST"],
    pattern: '/v1/organizations',
    tokens: [{"old":"/v1/organizations","type":0,"val":"v1","end":""},{"old":"/v1/organizations","type":0,"val":"organizations","end":""}],
    types: placeholder as Registry['organizations.store']['types'],
  },
  'organizations.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/organizations/:id',
    tokens: [{"old":"/v1/organizations/:id","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:id","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['organizations.show']['types'],
  },
  'organizations.update': {
    methods: ["PUT","PATCH"],
    pattern: '/v1/organizations/:id',
    tokens: [{"old":"/v1/organizations/:id","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:id","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['organizations.update']['types'],
  },
  'organizations.destroy': {
    methods: ["DELETE"],
    pattern: '/v1/organizations/:id',
    tokens: [{"old":"/v1/organizations/:id","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:id","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['organizations.destroy']['types'],
  },
  'organizations.members.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/organizations/:organizationId/members',
    tokens: [{"old":"/v1/organizations/:organizationId/members","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:organizationId/members","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:organizationId/members","type":1,"val":"organizationId","end":""},{"old":"/v1/organizations/:organizationId/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['organizations.members.index']['types'],
  },
  'organizations.members.store': {
    methods: ["POST"],
    pattern: '/v1/organizations/:organizationId/members',
    tokens: [{"old":"/v1/organizations/:organizationId/members","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:organizationId/members","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:organizationId/members","type":1,"val":"organizationId","end":""},{"old":"/v1/organizations/:organizationId/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['organizations.members.store']['types'],
  },
  'organizations.members.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/organizations/:organizationId/members/:id',
    tokens: [{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":1,"val":"organizationId","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"members","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['organizations.members.show']['types'],
  },
  'organizations.members.update': {
    methods: ["PUT","PATCH"],
    pattern: '/v1/organizations/:organizationId/members/:id',
    tokens: [{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":1,"val":"organizationId","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"members","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['organizations.members.update']['types'],
  },
  'organizations.members.destroy': {
    methods: ["DELETE"],
    pattern: '/v1/organizations/:organizationId/members/:id',
    tokens: [{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"v1","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"organizations","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":1,"val":"organizationId","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":0,"val":"members","end":""},{"old":"/v1/organizations/:organizationId/members/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['organizations.members.destroy']['types'],
  },
  'geocoding.plans.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/plans',
    tokens: [{"old":"/v1/geocoding/plans","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/plans","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/plans","type":0,"val":"plans","end":""}],
    types: placeholder as Registry['geocoding.plans.index']['types'],
  },
  'geocoding.plans.store': {
    methods: ["POST"],
    pattern: '/v1/geocoding/plans',
    tokens: [{"old":"/v1/geocoding/plans","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/plans","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/plans","type":0,"val":"plans","end":""}],
    types: placeholder as Registry['geocoding.plans.store']['types'],
  },
  'geocoding.plans.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/plans/:id',
    tokens: [{"old":"/v1/geocoding/plans/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/plans/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/plans/:id","type":0,"val":"plans","end":""},{"old":"/v1/geocoding/plans/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.plans.show']['types'],
  },
  'geocoding.plans.update': {
    methods: ["PUT","PATCH"],
    pattern: '/v1/geocoding/plans/:id',
    tokens: [{"old":"/v1/geocoding/plans/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/plans/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/plans/:id","type":0,"val":"plans","end":""},{"old":"/v1/geocoding/plans/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.plans.update']['types'],
  },
  'geocoding.plans.destroy': {
    methods: ["DELETE"],
    pattern: '/v1/geocoding/plans/:id',
    tokens: [{"old":"/v1/geocoding/plans/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/plans/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/plans/:id","type":0,"val":"plans","end":""},{"old":"/v1/geocoding/plans/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.plans.destroy']['types'],
  },
  'geocoding.organization.subscriptions.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions',
    tokens: [{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"organization","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":1,"val":"organization_id","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"subscriptions","end":""}],
    types: placeholder as Registry['geocoding.organization.subscriptions.index']['types'],
  },
  'geocoding.organization.subscriptions.store': {
    methods: ["POST"],
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions',
    tokens: [{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"organization","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":1,"val":"organization_id","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions","type":0,"val":"subscriptions","end":""}],
    types: placeholder as Registry['geocoding.organization.subscriptions.store']['types'],
  },
  'geocoding.organization.subscriptions.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions/:id',
    tokens: [{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"organization","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":1,"val":"organization_id","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"subscriptions","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.organization.subscriptions.show']['types'],
  },
  'geocoding.organization.subscriptions.destroy': {
    methods: ["DELETE"],
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions/:id',
    tokens: [{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"organization","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":1,"val":"organization_id","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":0,"val":"subscriptions","end":""},{"old":"/v1/geocoding/organization/:organization_id/subscriptions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.organization.subscriptions.destroy']['types'],
  },
  'geocoding.api_keys.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/api-keys',
    tokens: [{"old":"/v1/geocoding/api-keys","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/api-keys","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/api-keys","type":0,"val":"api-keys","end":""}],
    types: placeholder as Registry['geocoding.api_keys.index']['types'],
  },
  'geocoding.api_keys.store': {
    methods: ["POST"],
    pattern: '/v1/geocoding/api-keys',
    tokens: [{"old":"/v1/geocoding/api-keys","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/api-keys","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/api-keys","type":0,"val":"api-keys","end":""}],
    types: placeholder as Registry['geocoding.api_keys.store']['types'],
  },
  'geocoding.api_keys.show': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/api-keys/:id',
    tokens: [{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"api-keys","end":""},{"old":"/v1/geocoding/api-keys/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.api_keys.show']['types'],
  },
  'geocoding.api_keys.update': {
    methods: ["PUT","PATCH"],
    pattern: '/v1/geocoding/api-keys/:id',
    tokens: [{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"api-keys","end":""},{"old":"/v1/geocoding/api-keys/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.api_keys.update']['types'],
  },
  'geocoding.api_keys.destroy': {
    methods: ["DELETE"],
    pattern: '/v1/geocoding/api-keys/:id',
    tokens: [{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/api-keys/:id","type":0,"val":"api-keys","end":""},{"old":"/v1/geocoding/api-keys/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['geocoding.api_keys.destroy']['types'],
  },
  'geocoding.usage.index': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/usage',
    tokens: [{"old":"/v1/geocoding/usage","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/usage","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/usage","type":0,"val":"usage","end":""}],
    types: placeholder as Registry['geocoding.usage.index']['types'],
  },
  'geocoding.usage.daily': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/usage/daily',
    tokens: [{"old":"/v1/geocoding/usage/daily","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/usage/daily","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/usage/daily","type":0,"val":"usage","end":""},{"old":"/v1/geocoding/usage/daily","type":0,"val":"daily","end":""}],
    types: placeholder as Registry['geocoding.usage.daily']['types'],
  },
  'geocoding.usage.monthly': {
    methods: ["GET","HEAD"],
    pattern: '/v1/geocoding/usage/monthly',
    tokens: [{"old":"/v1/geocoding/usage/monthly","type":0,"val":"v1","end":""},{"old":"/v1/geocoding/usage/monthly","type":0,"val":"geocoding","end":""},{"old":"/v1/geocoding/usage/monthly","type":0,"val":"usage","end":""},{"old":"/v1/geocoding/usage/monthly","type":0,"val":"monthly","end":""}],
    types: placeholder as Registry['geocoding.usage.monthly']['types'],
  },
  'docs.show': {
    methods: ["GET","HEAD"],
    pattern: '/docs',
    tokens: [{"old":"/docs","type":0,"val":"docs","end":""}],
    types: placeholder as Registry['docs.show']['types'],
  },
  'docs.json': {
    methods: ["GET","HEAD"],
    pattern: '/docs.json',
    tokens: [{"old":"/docs.json","type":0,"val":"docs.json","end":""}],
    types: placeholder as Registry['docs.json']['types'],
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
