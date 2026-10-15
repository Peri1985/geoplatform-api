import vine from '@vinejs/vine'

/**
 * GeoJSON Point. The order is [longitude, latitude].
 */
const point = () =>
  vine.object({
    type: vine.literal('Point'),
    coordinates: vine.tuple([vine.number().min(-180).max(180), vine.number().min(-90).max(90)]),
  })

const name = () => vine.string().trim().minLength(1).maxLength(200)

export const createPlaceValidator = vine.create({
  name: name(),
  location: point(),
})

export const updatePlaceValidator = vine.create({
  name: name().optional(),
  location: point().optional(),
})

/**
 * Query string of GET /places/nearby: radius in metres
 */
export const nearbyPlacesValidator = vine.create({
  lat: vine.number().min(-90).max(90),
  lon: vine.number().min(-180).max(180),
  radius: vine.number().positive().max(100_000).optional(),
})
