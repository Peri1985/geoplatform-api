import AuditLog from '#models/audit_log'
import Organization from '#models/organization'
import OrganizationMember from '#models/organization_member'
import User from '#models/user'
import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'
import { createOrganization } from '#tests/models_helpers'

test.group('Models: tenancy', (group) => {
  isolate(group)

  test('a user joins organizations with a role in each', async ({ assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    const other = await createOrganization()

    await user.related('organizations').attach({
      [acme.id]: { role: 'admin' },
      [other.id]: { role: 'guest' },
    })

    const memberships = await OrganizationMember.query().where('user_id', user.id)
    const roles = Object.fromEntries(memberships.map((m) => [m.organizationId, m.role]))
    assert.deepEqual(roles, { [acme.id]: 'admin', [other.id]: 'guest' })

    await acme.load('users')
    assert.deepEqual(
      acme.users.map((u) => u.id),
      [user.id]
    )
  })

  test('a user is a member of an organization only once', async ({ assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    await OrganizationMember.create({ organizationId: acme.id, userId: user.id, role: 'member' })

    await assert.rejects(() =>
      OrganizationMember.create({ organizationId: acme.id, userId: user.id, role: 'admin' })
    )
  })

  test('deleting an organization removes its data but keeps its users', async ({ assert }) => {
    const user = await createUser()
    const acme = await createOrganization()
    await user.related('organizations').attach({ [acme.id]: { role: 'admin' } })

    await acme.delete()

    assert.isNotNull(await User.find(user.id))
    assert.lengthOf(await OrganizationMember.query().where('organization_id', acme.id), 0)
    assert.isNull(await Organization.find(acme.id))
  })

  test('organization changes are recorded in the audit log', async ({ assert }) => {
    const acme = await createOrganization()
    acme.status = 'suspended'
    await acme.save()

    const [entry] = await AuditLog.query()
      .where('action', 'organizations.updated')
      .where('subject_id', acme.id)
    assert.deepEqual(entry.changes, { status: { from: 'active', to: 'suspended' } })
  })
})
