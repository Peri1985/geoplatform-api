/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['show']>>>
    }
  }
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'files.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/files'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/file').listFilesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/files_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/files_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'files.store': {
    methods: ["POST"]
    pattern: '/v1/files'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/file').uploadFileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/file').uploadFileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/files_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/files_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'files.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/files/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/files_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/files_controller').default['show']>>>
    }
  }
  'files.destroy': {
    methods: ["DELETE"]
    pattern: '/v1/files/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/files_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/files_controller').default['destroy']>>>
    }
  }
  'organizations.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/organizations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/organization').listOrganizationsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizations.store': {
    methods: ["POST"]
    pattern: '/v1/organizations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/organization').createOrganizationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/organization').createOrganizationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizations.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/organizations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['show']>>>
    }
  }
  'organizations.update': {
    methods: ["PUT","PATCH"]
    pattern: '/v1/organizations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/organization').updateOrganizationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/organization').updateOrganizationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizations.destroy': {
    methods: ["DELETE"]
    pattern: '/v1/organizations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['destroy']>>>
    }
  }
  'organizations.members.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/organizations/:organizationId/members'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { organizationId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/organization_member').listMembersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizations.members.store': {
    methods: ["POST"]
    pattern: '/v1/organizations/:organizationId/members'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/organization_member').addMemberValidator)>>
      paramsTuple: [ParamValue]
      params: { organizationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/organization_member').addMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizations.members.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/organizations/:organizationId/members/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organizationId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['show']>>>
    }
  }
  'organizations.members.update': {
    methods: ["PUT","PATCH"]
    pattern: '/v1/organizations/:organizationId/members/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/organization_member').updateMemberValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { organizationId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/organization_member').updateMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'organizations.members.destroy': {
    methods: ["DELETE"]
    pattern: '/v1/organizations/:organizationId/members/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organizationId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organization_members_controller').default['destroy']>>>
    }
  }
  'geocoding.plans.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/plans'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_plan').listGeocodingPlansValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.plans.store': {
    methods: ["POST"]
    pattern: '/v1/geocoding/plans'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/geocoding_plan').createGeocodingPlanValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/geocoding_plan').createGeocodingPlanValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.plans.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/plans/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['show']>>>
    }
  }
  'geocoding.plans.update': {
    methods: ["PUT","PATCH"]
    pattern: '/v1/geocoding/plans/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/geocoding_plan').updateGeocodingPlanValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/geocoding_plan').updateGeocodingPlanValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.plans.destroy': {
    methods: ["DELETE"]
    pattern: '/v1/geocoding/plans/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/plans_controller').default['destroy']>>>
    }
  }
  'geocoding.organization.subscriptions.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { organization_id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_subscription').listValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.organization.subscriptions.store': {
    methods: ["POST"]
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/geocoding_subscription').createValidator)>>
      paramsTuple: [ParamValue]
      params: { organization_id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/geocoding_subscription').createValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.organization.subscriptions.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organization_id: ParamValue; id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_subscription').showValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.organization.subscriptions.destroy': {
    methods: ["DELETE"]
    pattern: '/v1/geocoding/organization/:organization_id/subscriptions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { organization_id: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/subscriptions_controller').default['destroy']>>>
    }
  }
  'geocoding.api_keys.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/api-keys'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_api_key').listGeocodingApiKeysValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.api_keys.store': {
    methods: ["POST"]
    pattern: '/v1/geocoding/api-keys'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/geocoding_api_key').createGeocodingApiKeyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/geocoding_api_key').createGeocodingApiKeyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.api_keys.show': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/api-keys/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['show']>>>
    }
  }
  'geocoding.api_keys.update': {
    methods: ["PUT","PATCH"]
    pattern: '/v1/geocoding/api-keys/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/geocoding_api_key').updateGeocodingApiKeyValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/geocoding_api_key').updateGeocodingApiKeyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.api_keys.destroy': {
    methods: ["DELETE"]
    pattern: '/v1/geocoding/api-keys/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/api_keys_controller').default['destroy']>>>
    }
  }
  'geocoding.usage.index': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/usage'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_usage').listUsageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/usage_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/usage_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.usage.daily': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/usage/daily'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_usage').dailyUsageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/usage_controller').default['daily']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/usage_controller').default['daily']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'geocoding.usage.monthly': {
    methods: ["GET","HEAD"]
    pattern: '/v1/geocoding/usage/monthly'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocoding_usage').monthlyUsageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/geocoding/usage_controller').default['monthly']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/geocoding/usage_controller').default['monthly']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'docs.show': {
    methods: ["GET","HEAD"]
    pattern: '/docs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/docs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/docs_controller').default['show']>>>
    }
  }
  'docs.json': {
    methods: ["GET","HEAD"]
    pattern: '/docs.json'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/docs_controller').default['json']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/docs_controller').default['json']>>>
    }
  }
}
