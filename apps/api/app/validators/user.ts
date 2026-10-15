import vine from '@vinejs/vine'

/**
 * Shared rules for email and password. Emails are stored in lowercase,
 * so "Maria@x.gr" and "maria@x.gr" are the same account.
 */
const email = () => vine.string().trim().email().toLowerCase().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

/**
 * Changes an admin can make to another user
 */
export const updateUserValidator = vine.create({
  role: vine.enum(['admin', 'user'] as const).optional(),
  isActive: vine.boolean().optional(),
})
