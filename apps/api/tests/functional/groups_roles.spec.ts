import Group from '#models/group'
import Role from '#models/role'
import { test } from '@japa/runner'
import { createUser, isolate } from '#tests/helpers'

test.group('Groups and roles', (group) => {
  isolate(group)

  test('users join groups through group_user', async ({ assert }) => {
    const user = await createUser()
    const editors = await Group.create({ name: 'Editors' })
    const viewers = await Group.create({ name: 'Viewers' })

    await user.related('groups').attach([editors.id, viewers.id])

    await user.load('groups')
    assert.sameMembers(
      user.groups.map((g) => g.name),
      ['Editors', 'Viewers']
    )

    await editors.load('users')
    assert.deepEqual(
      editors.users.map((u) => u.id),
      [user.id]
    )
  })

  test('a group needs a name, but two groups can share one', async ({ assert }) => {
    const first = await Group.create({ name: 'Team' })
    const second = await Group.create({ name: 'Team' })
    assert.notEqual(first.id, second.id)

    await assert.rejects(() => Group.create({}))
  })

  test('a user cannot be in the same group twice', async ({ assert }) => {
    const user = await createUser()
    const editors = await Group.create({ name: 'Editors' })
    await user.related('groups').attach([editors.id])

    await assert.rejects(() => user.related('groups').attach([editors.id]))
  })

  test('a role needs a name, a sector and a role', async ({ assert }) => {
    await assert.rejects(() => Role.create({ name: 'Admin', sector: 'GIS' }))
    await assert.rejects(() => Role.create({ name: 'Admin', role: 'admin' }))
    await assert.rejects(() => Role.create({ sector: 'GIS', role: 'admin' }))
  })

  test('users get roles through role_user, and lose them with detach', async ({ assert }) => {
    const user = await createUser()
    const admin = await Role.create({ name: 'Admin', sector: 'GIS', role: 'admin' })

    await user.related('roles').attach([admin.id])
    await user.load('roles')
    assert.deepEqual(
      user.roles.map((r) => r.role),
      ['admin']
    )

    await user.related('roles').detach([admin.id])
    await user.load('roles')
    assert.lengthOf(user.roles, 0)
  })

  test('deleting a user removes their memberships, not the groups and roles', async ({
    assert,
  }) => {
    const user = await createUser()
    const editors = await Group.create({ name: 'Editors' })
    const admin = await Role.create({ name: 'Admin', sector: 'GIS', role: 'admin' })
    await user.related('groups').attach([editors.id])
    await user.related('roles').attach([admin.id])

    await user.delete()

    await editors.load('users')
    assert.lengthOf(editors.users, 0)
    assert.isNotNull(await Group.find(editors.id))
    assert.isNotNull(await Role.find(admin.id))
  })
})
