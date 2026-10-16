import type OrganizationMember from '#models/organization_member'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrganizationMemberTransformer extends BaseTransformer<OrganizationMember> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'organizationId',
        'userId',
        'role',
        'status',
        'createdAt',
        'updatedAt',
        'isAdmin',
        'isActive',
      ]),
      // Only when the controller has preloaded it
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
