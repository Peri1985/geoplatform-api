/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| Abilities are checks that do not depend on a specific record. Checks on a
| record (e.g. "can edit this place") live in policies (app/policies).
|
*/

import type User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

/**
 * List users, change their role, deactivate them
 */
export const manageUsers = Bouncer.ability((user: User) => {
  return user.isAdmin
})
