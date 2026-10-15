import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health.show': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'places.index': { paramsTuple?: []; params?: {} }
    'places.nearby': { paramsTuple?: []; params?: {} }
    'places.store': { paramsTuple?: []; params?: {} }
    'places.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'places.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'health.show': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'places.index': { paramsTuple?: []; params?: {} }
    'places.nearby': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health.show': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'places.index': { paramsTuple?: []; params?: {} }
    'places.nearby': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'places.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'places.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'places.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}