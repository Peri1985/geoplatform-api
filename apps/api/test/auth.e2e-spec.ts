import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Tokens } from '@repo/shared';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { UsersService } from './../src/users/users.service.js';

// Runs against the development database (apps/api/.env); every user it creates
// has an e2e-*@test.local email and is deleted at the end.
const email = () => `e2e-${randomUUID()}@test.local`;
const password = 'correct-horse-battery';
const point = { type: 'Point', coordinates: [23.64, 37.942] };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let http: () => ReturnType<typeof request>;

  const register = (address: string) =>
    http().post('/auth/register').send({ email: address, password });

  const login = async (address: string): Promise<Tokens> => {
    const res = await http()
      .post('/auth/login')
      .send({ email: address, password })
      .expect(200);
    return res.body as Tokens;
  };

  const bearer = (tokens: Tokens) => `Bearer ${tokens.accessToken}`;

  const createAdmin = async (): Promise<Tokens> => {
    const address = email();
    await app
      .get(UsersService)
      .create({ email: address, password, role: 'admin' });
    return login(address);
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // Rate limiting has its own test below
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    http = () => request(app.getHttpServer());
  });

  afterAll(async () => {
    const db = app.get(DataSource);
    await db.query(
      `DELETE FROM places WHERE "createdById" IN (SELECT id FROM users WHERE email LIKE 'e2e-%@test.local')`,
    );
    await db.query(`DELETE FROM users WHERE email LIKE 'e2e-%@test.local'`);
    await app.close();
  });

  describe('register', () => {
    it('creates a plain user without exposing the password hash', async () => {
      const address = email();
      const res = await register(address).expect(201);
      expect(res.body).toMatchObject({
        email: address,
        role: 'user',
        isActive: true,
      });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('rejects an email that is already registered', async () => {
      const address = email();
      await register(address).expect(201);
      await register(address.toUpperCase()).expect(409);
    });

    it('rejects a short password', () =>
      http()
        .post('/auth/register')
        .send({ email: email(), password: 'short' })
        .expect(400));
  });

  describe('login', () => {
    it('returns Bearer tokens', async () => {
      const address = email();
      await register(address).expect(201);
      const tokens = await login(address);
      expect(tokens).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const address = email();
      await register(address).expect(201);
      const wrongPassword = await http()
        .post('/auth/login')
        .send({ email: address, password: 'wrong-password' })
        .expect(401);
      const unknownEmail = await http()
        .post('/auth/login')
        .send({ email: email(), password })
        .expect(401);
      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });
  });

  describe('access token', () => {
    it('is required on endpoints that are not public', async () => {
      await http().get('/places').expect(401);
      await http()
        .get('/places')
        .set('Authorization', 'Bearer not-a-token')
        .expect(401);
      await http().get('/health').expect(200);
    });

    it('identifies the caller on /auth/me', async () => {
      const address = email();
      await register(address).expect(201);
      const tokens = await login(address);
      const res = await http()
        .get('/auth/me')
        .set('Authorization', bearer(tokens))
        .expect(200);
      expect(res.body).toMatchObject({ email: address, role: 'user' });
    });
  });

  describe('refresh token', () => {
    it('is rotated: the old one stops working', async () => {
      const address = email();
      await register(address).expect(201);
      const first = await login(address);

      const res = await http()
        .post('/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(200);
      const second = res.body as Tokens;
      expect(second.refreshToken).not.toBe(first.refreshToken);

      await http()
        .get('/auth/me')
        .set('Authorization', bearer(second))
        .expect(200);
    });

    it('revokes every session when a used token is presented again', async () => {
      const address = email();
      await register(address).expect(201);
      const first = await login(address);
      const second = (
        await http()
          .post('/auth/refresh')
          .send({ refreshToken: first.refreshToken })
          .expect(200)
      ).body as Tokens;

      // Reuse of the old token, as an attacker who stole it would do
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(401);
      // The legitimate client's newer token is revoked too
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: second.refreshToken })
        .expect(401);
    });

    it('stops working after logout', async () => {
      const address = email();
      await register(address).expect(201);
      const tokens = await login(address);
      await http()
        .post('/auth/logout')
        .send({ refreshToken: tokens.refreshToken })
        .expect(204);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);
    });
  });

  describe('roles', () => {
    it('keeps /users for admins', async () => {
      const address = email();
      await register(address).expect(201);
      const user = await login(address);
      const admin = await createAdmin();

      await http().get('/users').set('Authorization', bearer(user)).expect(403);
      await http()
        .get('/users')
        .set('Authorization', bearer(admin))
        .expect(200);
    });

    it('lets an admin deactivate a user, who can then no longer log in or refresh', async () => {
      const address = email();
      const { id } = (await register(address).expect(201)).body as {
        id: string;
      };
      const user = await login(address);
      const admin = await createAdmin();

      await http()
        .patch(`/users/${id}`)
        .set('Authorization', bearer(admin))
        .send({ isActive: false })
        .expect(200);

      await http()
        .post('/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
      await http()
        .post('/auth/login')
        .send({ email: address, password })
        .expect(401);
    });

    it('does not let an admin change their own role', async () => {
      const admin = await createAdmin();
      const me = await http()
        .get('/auth/me')
        .set('Authorization', bearer(admin))
        .expect(200);
      await http()
        .patch(`/users/${(me.body as { id: string }).id}`)
        .set('Authorization', bearer(admin))
        .send({ role: 'user' })
        .expect(400);
    });
  });

  describe('place ownership', () => {
    it('lets only the owner or an admin change a place', async () => {
      const ownerEmail = email();
      const otherEmail = email();
      await register(ownerEmail).expect(201);
      await register(otherEmail).expect(201);
      const owner = await login(ownerEmail);
      const other = await login(otherEmail);
      const admin = await createAdmin();

      const created = await http()
        .post('/places')
        .set('Authorization', bearer(owner))
        .send({ name: 'Λιμάνι', location: point })
        .expect(201);
      const { id } = created.body as { id: string };

      await http()
        .patch(`/places/${id}`)
        .set('Authorization', bearer(other))
        .send({ name: 'Δικό μου' })
        .expect(403);
      await http()
        .patch(`/places/${id}`)
        .set('Authorization', bearer(owner))
        .send({ name: 'Λιμάνι Πειραιά' })
        .expect(200);
      await http()
        .patch(`/places/${id}`)
        .set('Authorization', bearer(admin))
        .send({ name: 'Λιμάνι του Πειραιά' })
        .expect(200);
      await http()
        .delete(`/places/${id}`)
        .set('Authorization', bearer(other))
        .expect(403);
      await http()
        .delete(`/places/${id}`)
        .set('Authorization', bearer(owner))
        .expect(204);
    });
  });
});

describe('Auth rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('blocks an IP after 10 login attempts in a minute', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.local', password: 'wrong-password' });

    for (let i = 0; i < 10; i++) await attempt().expect(401);
    await attempt().expect(429);
  });
});
