
import type { ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Transformer from '#transformers/geocoding_subscription_transformer'
import {
  listValidator,
  createValidator,
  showValidator,
} from '#validators/geocoding_subscription'
import Model from '#models/geocoding_subscription'

type Relation = ExtractModelRelations<InstanceType<typeof Model>>

const DEFAULT_PER_PAGE = 30
export default class GeocodingSubscriptionsController {
  /**
   * Display a list of resource
   */
  async index({ request, serialize }: HttpContext) {
    const {
      preloads = [],
      pagination = false,
      page = 1,
      orderBy = [{
        column: 'starts_at',
        order: 'desc'
      }],
      ...filters
    } = await request.validateUsing(listValidator)
    let query = Model.filter(filters).orderBy(orderBy)
    for (const preload of preloads as Relation[]) {
      query = query.preloadOnce(preload)
    }
    if (pagination) {
      const paginator = await query.paginate(page, DEFAULT_PER_PAGE)
      return serialize(Transformer.paginate(paginator.all(), paginator.getMeta()))
    }
    const models = await query
    return serialize(Transformer.transform(models))
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, serialize }: HttpContext) {
    const { planId, organizationId } = await request.validateUsing(createValidator)
    const model = await db.transaction(async (trx) => {
      const now = DateTime.now()
      const active = await Model.query({ client: trx })
        .where('organization_id', organizationId)
        .whereNull('ends_at')
        .first()
      if (active) {
        active.endsAt = now
        await active.save()
      }
      return Model.create(
        { organizationId: organizationId, planId, startsAt: now },
        { client: trx }
      )
    })
    return serialize(Transformer.transform(model))
  }

  /**
   * Show individual record
   */
  async show({ params, request, serialize }: HttpContext) {
    const model = await Model.findOrFail(params.id)
    const {
      preloads = [],
    } = await request.validateUsing(showValidator)
    for (const preload of preloads as Relation[]) {
      await model.load(preload)
    }
    return serialize(Transformer.transform(model))
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const model = await Model.findOrFail(params.id)
    if (!model.endsAt) {
      model.endsAt = DateTime.now()
      await model.save()
    }
    return response.noContent()
  }
}
