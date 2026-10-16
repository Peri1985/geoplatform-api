import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health.show': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'files.index': { paramsTuple?: []; params?: {} }
    'files.store': { paramsTuple?: []; params?: {} }
    'files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'files.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index': { paramsTuple?: []; params?: {} }
    'organizations.store': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.index': { paramsTuple: [ParamValue]; params: {'organizationId': ParamValue} }
    'organizations.members.store': { paramsTuple: [ParamValue]; params: {'organizationId': ParamValue} }
    'organizations.members.show': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'organizations.members.update': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'organizations.members.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'geocoding.plans.index': { paramsTuple?: []; params?: {} }
    'geocoding.plans.store': { paramsTuple?: []; params?: {} }
    'geocoding.plans.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.plans.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.organization.subscriptions.index': { paramsTuple: [ParamValue]; params: {'organization_id': ParamValue} }
    'geocoding.organization.subscriptions.store': { paramsTuple: [ParamValue]; params: {'organization_id': ParamValue} }
    'geocoding.organization.subscriptions.show': { paramsTuple: [ParamValue,ParamValue]; params: {'organization_id': ParamValue,'id': ParamValue} }
    'geocoding.organization.subscriptions.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'organization_id': ParamValue,'id': ParamValue} }
    'geocoding.api_keys.index': { paramsTuple?: []; params?: {} }
    'geocoding.api_keys.store': { paramsTuple?: []; params?: {} }
    'geocoding.api_keys.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.api_keys.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.api_keys.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.usage.index': { paramsTuple?: []; params?: {} }
    'geocoding.usage.daily': { paramsTuple?: []; params?: {} }
    'geocoding.usage.monthly': { paramsTuple?: []; params?: {} }
    'docs.show': { paramsTuple?: []; params?: {} }
    'docs.json': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health.show': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'files.index': { paramsTuple?: []; params?: {} }
    'files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.index': { paramsTuple: [ParamValue]; params: {'organizationId': ParamValue} }
    'organizations.members.show': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'geocoding.plans.index': { paramsTuple?: []; params?: {} }
    'geocoding.plans.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.organization.subscriptions.index': { paramsTuple: [ParamValue]; params: {'organization_id': ParamValue} }
    'geocoding.organization.subscriptions.show': { paramsTuple: [ParamValue,ParamValue]; params: {'organization_id': ParamValue,'id': ParamValue} }
    'geocoding.api_keys.index': { paramsTuple?: []; params?: {} }
    'geocoding.api_keys.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.usage.index': { paramsTuple?: []; params?: {} }
    'geocoding.usage.daily': { paramsTuple?: []; params?: {} }
    'geocoding.usage.monthly': { paramsTuple?: []; params?: {} }
    'docs.show': { paramsTuple?: []; params?: {} }
    'docs.json': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health.show': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'files.index': { paramsTuple?: []; params?: {} }
    'files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.index': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.index': { paramsTuple: [ParamValue]; params: {'organizationId': ParamValue} }
    'organizations.members.show': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'geocoding.plans.index': { paramsTuple?: []; params?: {} }
    'geocoding.plans.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.organization.subscriptions.index': { paramsTuple: [ParamValue]; params: {'organization_id': ParamValue} }
    'geocoding.organization.subscriptions.show': { paramsTuple: [ParamValue,ParamValue]; params: {'organization_id': ParamValue,'id': ParamValue} }
    'geocoding.api_keys.index': { paramsTuple?: []; params?: {} }
    'geocoding.api_keys.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.usage.index': { paramsTuple?: []; params?: {} }
    'geocoding.usage.daily': { paramsTuple?: []; params?: {} }
    'geocoding.usage.monthly': { paramsTuple?: []; params?: {} }
    'docs.show': { paramsTuple?: []; params?: {} }
    'docs.json': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'files.store': { paramsTuple?: []; params?: {} }
    'organizations.store': { paramsTuple?: []; params?: {} }
    'organizations.members.store': { paramsTuple: [ParamValue]; params: {'organizationId': ParamValue} }
    'geocoding.plans.store': { paramsTuple?: []; params?: {} }
    'geocoding.organization.subscriptions.store': { paramsTuple: [ParamValue]; params: {'organization_id': ParamValue} }
    'geocoding.api_keys.store': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'files.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'geocoding.plans.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.organization.subscriptions.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'organization_id': ParamValue,'id': ParamValue} }
    'geocoding.api_keys.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'organizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.update': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'geocoding.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.api_keys.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'organizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.update': { paramsTuple: [ParamValue,ParamValue]; params: {'organizationId': ParamValue,'id': ParamValue} }
    'geocoding.plans.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'geocoding.api_keys.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}