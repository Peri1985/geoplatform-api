import GeocodingPlan from '#models/geocoding_plan'
import GeocodingPlanTransformer from '#transformers/geocoding_plan_transformer'
import {
  createGeocodingPlanValidator,
  listGeocodingPlansValidator,
  updateGeocodingPlanValidator,
} from '#validators/geocoding_plan'
import type { HttpContext } from '@adonisjs/core/http'

export default class GeocodingPlansController {
  // Cheapest first
  private orderBy = ['price_monthly', 'asc'] as const

  /**
   * GET /geocoding/plans?search=pro&isActive=true
   */
  async index({ request, serialize }: HttpContext) {
    const filters = await request.validateUsing(listGeocodingPlansValidator)
    const plans = await GeocodingPlan.filter(filters).orderBy(...this.orderBy)
    return serialize(GeocodingPlanTransformer.transform(plans))
  }

  async store({ request, response, serialize }: HttpContext) {
    const { priceMonthly, ...data } = await request.validateUsing(createGeocodingPlanValidator)
    // decimal(10,2) columns are strings, so the price is not rounded by JavaScript
    const plan = await GeocodingPlan.create({ ...data, priceMonthly: priceMonthly.toFixed(2) })
    response.status(201)
    return serialize(GeocodingPlanTransformer.transform(plan))
  }

  async show({ params, serialize }: HttpContext) {
    const plan = await GeocodingPlan.findOrFail(params.id)
    return serialize(GeocodingPlanTransformer.transform(plan))
  }

  async update({ params, request, serialize }: HttpContext) {
    const plan = await GeocodingPlan.findOrFail(params.id)
    const { priceMonthly, ...data } = await request.validateUsing(updateGeocodingPlanValidator)

    plan.merge(data)
    if (priceMonthly !== undefined) plan.priceMonthly = priceMonthly.toFixed(2)
    await plan.save()

    return serialize(GeocodingPlanTransformer.transform(plan))
  }

  /**
   * Only a plan that nobody has subscribed to; otherwise set isActive to false
   */
  async destroy({ params, response }: HttpContext) {
    const plan = await GeocodingPlan.findOrFail(params.id)

    const subscription = await plan.related('subscriptions').query().first()
    if (subscription) {
      return response.conflict({
        errors: [{ message: 'The plan has subscriptions. Deactivate it instead.' }],
      })
    }

    await plan.delete()
    return response.noContent()
  }
}
