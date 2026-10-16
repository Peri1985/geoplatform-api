import GeocodingApiUsage from '#models/geocoding_api_usage'
import paginationConfig from '#config/pagination'
import GeocodingApiUsageDaily from '#models/geocoding_api_usage_daily'
import GeocodingApiUsageMonthly from '#models/geocoding_api_usage_monthly'
import Organization from '#models/organization'
import GeocodingApiUsageDailyTransformer from '#transformers/geocoding_api_usage_daily_transformer'
import GeocodingApiUsageMonthlyTransformer from '#transformers/geocoding_api_usage_monthly_transformer'
import GeocodingApiUsageTransformer from '#transformers/geocoding_api_usage_transformer'
import {
  dailyUsageValidator,
  listUsageValidator,
  monthlyUsageValidator,
} from '#validators/geocoding_usage'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The API usage of an organization, read only: /geocoding/organizations/:organizationId/usage
 */
export default class GeocodingUsageController {
  private orderBy = {
    calls: ['created_at', 'desc'],
    daily: ['date', 'asc'],
    monthly: ['period', 'desc'],
  } as const

  /**
   * GET /usage?page=1&apiKeyId=&endpoint=&statusCode=&billable=&from=&to=:
   * one row per call
   */
  async index({ params, request, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const { page = 1, ...filters } = await request.validateUsing(listUsageValidator)

    const calls = await GeocodingApiUsage.filter(filters)
      .where('organization_id', organization.id)
      .orderBy(...this.orderBy.calls)
      .paginate(page, paginationConfig.perPage)
    return serialize(GeocodingApiUsageTransformer.paginate(calls.all(), calls.getMeta()))
  }

  /**
   * GET /usage/daily?from=2026-10-01&to=2026-10-31: calls per day, for charts
   */
  async daily({ params, request, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const filters = await request.validateUsing(dailyUsageValidator)

    const days = await GeocodingApiUsageDaily.filter(filters)
      .where('organization_id', organization.id)
      .orderBy(...this.orderBy.daily)
    return serialize(GeocodingApiUsageDailyTransformer.transform(days))
  }

  /**
   * GET /usage/monthly?from=2026-01&to=2026-12: calls per month
   */
  async monthly({ params, request, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const filters = await request.validateUsing(monthlyUsageValidator)

    const months = await GeocodingApiUsageMonthly.filter(filters)
      .where('organization_id', organization.id)
      .orderBy(...this.orderBy.monthly)
    return serialize(GeocodingApiUsageMonthlyTransformer.transform(months))
  }
}
