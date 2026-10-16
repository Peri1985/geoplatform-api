import Organization from '#models/organization'
import OrganizationMember from '#models/organization_member'
import OrganizationMemberTransformer from '#transformers/organization_member_transformer'
import {
  addMemberValidator,
  listMembersValidator,
  updateMemberValidator,
} from '#validators/organization_member'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The members of an organization: /organizations/:organizationId/members
 */
export default class OrganizationMembersController {
  // Oldest member first
  private orderBy = ['created_at', 'asc'] as const

  /**
   * GET /members?search=maria&role=admin&status=active
   */
  async index({ params, request, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const filters = await request.validateUsing(listMembersValidator)
    const members = await OrganizationMember.filter(filters)
      .where('organization_id', organization.id)
      .preload('user')
      .orderBy(...this.orderBy)
    return serialize(OrganizationMemberTransformer.transform(members))
  }

  async store({ params, request, response, serialize }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)
    const data = await request.validateUsing(addMemberValidator, {
      meta: { organizationId: organization.id },
    })

    const member = await organization.related('members').create(data)
    await member.load('user')

    response.status(201)
    return serialize(OrganizationMemberTransformer.transform(member))
  }

  async show({ params, serialize }: HttpContext) {
    const member = await this.find(params)
    return serialize(OrganizationMemberTransformer.transform(member))
  }

  async update({ params, request, serialize }: HttpContext) {
    const member = await this.find(params)
    const data = await request.validateUsing(updateMemberValidator)
    await member.merge(data).save()
    return serialize(OrganizationMemberTransformer.transform(member))
  }

  /**
   * Removes the user from the organization; the user account stays
   */
  async destroy({ params, response }: HttpContext) {
    const member = await this.find(params)
    await member.delete()
    return response.noContent()
  }

  private find(params: Record<string, string>) {
    return OrganizationMember.query()
      .where('organization_id', params.organizationId)
      .where('id', params.id)
      .preload('user')
      .firstOrFail()
  }
}
