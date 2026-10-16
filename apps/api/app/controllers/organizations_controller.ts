import Organization from '#models/organization'
import paginationConfig from '#config/pagination'
import OrganizationMember from '#models/organization_member'
import OrganizationTransformer from '#transformers/organization_transformer'
import {
  createOrganizationValidator,
  listOrganizationsValidator,
  updateOrganizationValidator,
} from '#validators/organization'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class OrganizationsController {
  private orderBy = ['name', 'asc'] as const

  /**
   * GET /organizations?page=1&search=acme&status=active
   */
  async index({ request, serialize }: HttpContext) {
    const { page = 1, ...filters } = await request.validateUsing(listOrganizationsValidator)
    const organizations = await Organization.filter(filters)
      .orderBy(...this.orderBy)
      .paginate(page, paginationConfig.perPage)
    return serialize(OrganizationTransformer.paginate(organizations.all(), organizations.getMeta()))
  }

  /**
   * The caller becomes the admin of the new organization
   */
  async store({ request, response, auth, serialize }: HttpContext) {
    const data = await request.validateUsing(createOrganizationValidator)
    const user = auth.getUserOrFail()

    const organization = await db.transaction(async (trx) => {
      const created = await Organization.create(data, { client: trx })
      await OrganizationMember.create(
        { organizationId: created.id, userId: user.id, role: 'admin' },
        { client: trx }
      )
      return created
    })

    response.status(201)
    return serialize(OrganizationTransformer.transform(organization))
  }

  async show({ params, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.id)
    return serialize(OrganizationTransformer.transform(organization))
  }

  async update({ params, request, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.id)
    const { status, ...data } = await request.validateUsing(updateOrganizationValidator)

    organization.merge(data)
    if (status && status !== organization.status) {
      organization.status = status
      organization.suspendedAt = status === 'suspended' ? DateTime.now() : null
    }
    await organization.save()

    return serialize(OrganizationTransformer.transform(organization))
  }

  /**
   * Deletes its members, subscriptions, API keys and usage too (CASCADE)
   */
  async destroy({ params, response }: HttpContext) {
    const organization = await Organization.findOrFail(params.id)
    await organization.delete()
    return response.noContent()
  }
}
