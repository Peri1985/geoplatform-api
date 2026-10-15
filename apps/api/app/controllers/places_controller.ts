import Place from '#models/place'
import PlacePolicy from '#policies/place_policy'
import PlaceTransformer from '#transformers/place_transformer'
import {
  createPlaceValidator,
  nearbyPlacesValidator,
  updatePlaceValidator,
} from '#validators/place'
import type { HttpContext } from '@adonisjs/core/http'

export default class PlacesController {
  /**
   * All places, newest first
   */
  async index({ serialize }: HttpContext) {
    const places = await Place.query().orderBy('created_at', 'desc')
    return serialize(PlaceTransformer.transform(places))
  }

  /**
   * GET /places/nearby?lat=37.94&lon=23.64&radius=500
   */
  async nearby({ request, serialize }: HttpContext) {
    const { lat, lon, radius = 1000 } = await request.validateUsing(nearbyPlacesValidator)
    const places = await Place.query().withScopes((scopes) =>
      scopes.withinRadius({ lat, lon, radius })
    )
    return serialize(PlaceTransformer.transform(places))
  }

  /**
   * New place, owned by the caller
   */
  async store({ request, response, auth, serialize }: HttpContext) {
    const data = await request.validateUsing(createPlaceValidator)
    const place = await Place.create({ ...data, createdById: auth.getUserOrFail().id })
    response.status(201)
    return serialize(PlaceTransformer.transform(place))
  }

  async update({ params, request, bouncer, serialize }: HttpContext) {
    const place = await Place.findOrFail(params.id)
    await bouncer.with(PlacePolicy).authorize('edit', place)

    place.merge(await request.validateUsing(updatePlaceValidator))
    await place.save()
    return serialize(PlaceTransformer.transform(place))
  }

  async destroy({ params, response, bouncer }: HttpContext) {
    const place = await Place.findOrFail(params.id)
    await bouncer.with(PlacePolicy).authorize('delete', place)

    await place.delete()
    return response.noContent()
  }
}
