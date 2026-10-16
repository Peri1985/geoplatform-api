import GeocodingApiKey from '#models/geocoding_api_key'
import Organization from '#models/organization'
import GeocodingApiKeyTransformer from '#transformers/geocoding_api_key_transformer'
import {
  createGeocodingApiKeyValidator,
  listGeocodingApiKeysValidator,
  updateGeocodingApiKeyValidator,
} from '#validators/geocoding_api_key'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

/**
 * The API keys of an organization: /geocoding/organizations/:organizationId/api-keys
 */
export default class GeocodingApiKeysController {
  // Newest first
  private orderBy = ['created_at', 'desc'] as const

  /**
   * GET /api-keys?search=web&environment=test&revoked=false
   */
  async index({ params, request, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const filters = await request.validateUsing(listGeocodingApiKeysValidator)
    const keys = await GeocodingApiKey.filter(filters)
      .where('organization_id', organization.id)
      .orderBy(...this.orderBy)
    return serialize(GeocodingApiKeyTransformer.transform(keys))
  }

  /**
   * The response has the key itself; it is never shown again
   */
  async store({ params, request, response, auth, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const {
      expiresAt,
      environment = 'production',
      ...data
    } = await request.validateUsing(createGeocodingApiKeyValidator)
    const { key, prefix, keyHash } = GeocodingApiKey.generate(environment)

    const apiKey = await organization.related('apiKeys').create({
      ...data,
      environment,
      prefix,
      keyHash,
      expiresAt: expiresAt ?? null,
      createdById: auth.getUserOrFail().id,
    })

    response.status(201)
    return serialize({ apiKey: GeocodingApiKeyTransformer.transform(apiKey), key })
  }

  async show({ params, serialize }: HttpContext) {
    const apiKey = await this.find(params)
    return serialize(GeocodingApiKeyTransformer.transform(apiKey))
  }

  async update({ params, request, serialize }: HttpContext) {
    const apiKey = await this.find(params)
    const data = await request.validateUsing(updateGeocodingApiKeyValidator)
    await apiKey.merge(data).save()

    return serialize(GeocodingApiKeyTransformer.transform(apiKey))
  }

  /**
   * Revokes the key: it stops working at once. The row stays, so its usage
   * still shows which key made each call.
   */
  async destroy({ params, response }: HttpContext) {
    const apiKey = await this.find(params)
    if (!apiKey.revokedAt) {
      apiKey.revokedAt = DateTime.now()
      await apiKey.save()
    }
    return response.noContent()
  }

  private find(params: Record<string, string>) {
    return GeocodingApiKey.query()
      .where('organization_id', params.organizationId)
      .where('id', params.id)
      .firstOrFail()
  }
}
