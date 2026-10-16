import vine from '@vinejs/vine'
import { pagination, search } from '#validators/pagination'

/**
 * File types accepted for upload (images, documents, common geodata formats),
 * with the MIME type stored for each. The MIME type comes from the extension,
 * not from what the client claims.
 */
export const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  csv: 'text/csv',
  json: 'application/json',
  geojson: 'application/geo+json',
  kml: 'application/vnd.google-earth.kml+xml',
  gpx: 'application/gpx+xml',
  zip: 'application/zip',
  tif: 'image/tiff',
  tiff: 'image/tiff',
}

export const ALLOWED_EXTENSIONS = Object.keys(MIME_TYPES)

export const uploadFileValidator = vine.create({
  file: vine.file({ size: '20mb', extnames: ALLOWED_EXTENSIONS }),
})

/**
 * Query string of GET /files
 */
export const listFilesValidator = vine.create({
  ...pagination,
  search: search(),
  mimeType: vine.string().trim().maxLength(255).optional(),
})
