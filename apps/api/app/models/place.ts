import { PlaceSchema } from '#database/schema'
import { pointColumn } from '#columns/point'
import User from '#models/user'
import { belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { Point } from 'geojson'

const POINT = 'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography'

export default class Place extends PlaceSchema {
  /**
   * WGS84 point, as GeoJSON: { type: 'Point', coordinates: [lon, lat] }
   */
  @pointColumn()
  declare location: Point

  /**
   * The owner; only they (or an admin) can change the place
   */
  @belongsTo(() => User, { foreignKey: 'createdById' })
  declare createdBy: BelongsTo<typeof User>

  /**
   * Places within `radius` metres of the point, nearest first.
   * `::geography` makes the distances metres instead of degrees.
   */
  static withinRadius = scope(
    (query, { lat, lon, radius }: { lat: number; lon: number; radius: number }) => {
      query
        .whereRaw(`ST_DWithin(location::geography, ${POINT}, ?)`, [lon, lat, radius])
        .orderByRaw(`ST_Distance(location::geography, ${POINT})`, [lon, lat])
    }
  )
}
