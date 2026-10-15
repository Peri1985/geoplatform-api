import { column } from '@adonisjs/lucid/orm'
import type { Point } from 'geojson'

/**
 * Lucid column for a PostGIS `geometry(Point, 4326)`, exposed as a GeoJSON Point.
 *
 * - Writes it as EWKT (`SRID=4326;POINT(lon lat)`), which PostGIS parses on insert.
 * - Reads the hex EWKB that the pg driver returns for geometry columns.
 */
export function pointColumn(options: Parameters<typeof column>[0] = {}) {
  return column({ ...options, prepare: toEwkt, consume: fromEwkb })
}

function toEwkt(point: Point | null | undefined) {
  if (!point) return point
  const [lon, lat] = point.coordinates
  return `SRID=4326;POINT(${lon} ${lat})`
}

function fromEwkb(hex: string | null): Point | null {
  if (!hex) return null
  const buffer = Buffer.from(hex, 'hex')
  const littleEndian = buffer.readUInt8(0) === 1
  const readUInt32 = (offset: number) =>
    littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset)
  const readDouble = (offset: number) =>
    littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset)

  const type = readUInt32(1)
  if ((type & 0xff) !== 1) {
    throw new Error(`Expected a PostGIS Point, got geometry type ${type & 0xff}`)
  }
  // EWKB carries the SRID right after the type when this flag is set
  const offset = type & 0x20000000 ? 9 : 5
  return { type: 'Point', coordinates: [readDouble(offset), readDouble(offset + 8)] }
}
