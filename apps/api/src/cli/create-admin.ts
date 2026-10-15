// Creates the first admin, or makes an existing user admin:
//   pnpm --filter api create-admin <email>
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { AppModule } from '../app.module.js';
import { UsersService } from '../users/users.service.js';

const email = z.email().safeParse(process.argv[2]?.trim().toLowerCase());
if (!email.success) {
  console.error('Usage: pnpm --filter api create-admin <email>');
  process.exit(1);
}

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});
const users = app.get(UsersService);
const existing = await users.findByEmail(email.data);

if (existing) {
  // Done directly, not through users.update(), which forbids changing yourself
  existing.role = 'admin';
  existing.isActive = true;
  await users.save(existing);
  await users.revokeRefreshTokens(existing.id);
  console.log(`${email.data} is now an admin. They must log in again.`);
} else {
  const password = randomBytes(18).toString('base64url');
  await users.create({ email: email.data, password, role: 'admin' });
  console.log(`Created admin ${email.data}`);
  console.log(`Password: ${password}`);
  console.log('Shown only once: store it somewhere safe.');
}

await app.close();
