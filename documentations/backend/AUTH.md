# Authentication και authorization

Το api χρησιμοποιεί **Bearer tokens**: κάθε client στέλνει το header `Authorization: Bearer <accessToken>`. Δεν χρησιμοποιούνται cookies, οπότε η ίδια ροή δουλεύει για web, mobile και scripts.

- **Authentication** (ποιος είσαι): email και κωδικός, με JWT access token και refresh token.
- **Authorization** (τι επιτρέπεται): ρόλοι `admin` και `user`, και ιδιοκτησία πάνω στα δεδομένα.
- **Όλα τα endpoints είναι κλειστά εξ ορισμού.** Χωρίς έγκυρο token επιστρέφουν `401`, εκτός από όσα έχουν ρητά `@Public()`.

## Περιεχόμενα

- [Tokens](#tokens)
- [Endpoints](#endpoints)
- [Ροή για έναν client](#ροή-για-έναν-client)
- [Ρόλοι και δικαιώματα](#ρόλοι-και-δικαιώματα)
- [Προστασία endpoints στον κώδικα](#προστασία-endpoints-στον-κώδικα)
- [Ο πρώτος admin](#ο-πρώτος-admin)
- [Ρυθμίσεις (.env)](#ρυθμίσεις-env)
- [Ασφάλεια](#ασφάλεια)
- [Αρχεία](#αρχεία)
- [Προσθήκη Google login](#προσθήκη-google-login)

## Tokens

| Token | Τι είναι | Διάρκεια | Πώς ελέγχεται |
| --- | --- | --- | --- |
| **Access token** | JWT (HS256) με το id και τον ρόλο του χρήστη | 15 λεπτά | Από την υπογραφή του, χωρίς query στη βάση |
| **Refresh token** | Τυχαία 32 bytes. Στη βάση αποθηκεύεται μόνο το SHA-256 hash του | 30 μέρες | Με αναζήτηση στον πίνακα `refresh_tokens` |

Το access token δεν ακυρώνεται πριν λήξει. Γι' αυτό είναι σύντομο: μια αλλαγή ρόλου ή μια απενεργοποίηση ισχύει το αργότερο σε 15 λεπτά. Το refresh token ακυρώνεται αμέσως (logout, απενεργοποίηση, αλλαγή ρόλου).

**Rotation:** κάθε `refresh` ακυρώνει το refresh token που χρησιμοποιήθηκε και δίνει νέο. Αν ένα ήδη χρησιμοποιημένο refresh token σταλεί ξανά, το api υποθέτει ότι κλάπηκε και ακυρώνει **όλα** τα refresh tokens του χρήστη. Τότε ο χρήστης πρέπει να κάνει ξανά login σε όλες τις συσκευές.

## Endpoints

| Method | Path | Ποιος | Body | Επιστρέφει |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Όλοι | `{ email, password }` | `201`, ο χρήστης (ρόλος πάντα `user`) |
| `POST` | `/api/auth/login` | Όλοι | `{ email, password }` | `200`, tokens |
| `POST` | `/api/auth/refresh` | Όλοι | `{ refreshToken }` | `200`, **νέα** tokens |
| `POST` | `/api/auth/logout` | Όλοι | `{ refreshToken }` | `204` |
| `GET` | `/api/auth/me` | Συνδεδεμένοι | — | Ο συνδεδεμένος χρήστης |
| `GET` | `/api/users` | Admin | — | Όλοι οι χρήστες |
| `PATCH` | `/api/users/:id` | Admin | `{ role?, isActive? }` | Ο χρήστης |

Οι κωδικοί έχουν μήκος 8 έως 128 χαρακτήρες. Τα email αποθηκεύονται με πεζά, οπότε το `Maria@x.gr` και το `maria@x.gr` είναι ο ίδιος λογαριασμός.

Η απάντηση των `login` και `refresh`:

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "refreshToken": "q3Jx0lW1..."
}
```

Ο χρήστης στις απαντήσεις δεν περιέχει **ποτέ** τον κωδικό ή το hash του:

```json
{ "id": "a141...", "email": "maria@example.com", "role": "user", "isActive": true, "createdAt": "2026-10-15T10:45:22.902Z" }
```

| Κωδικός | Πότε |
| --- | --- |
| `400` | Λάθος δεδομένα (π.χ. μικρός κωδικός), με τα σφάλματα ανά πεδίο |
| `401` | Λείπει ή είναι άκυρο το token, ή λάθος email/κωδικός |
| `403` | Το token είναι έγκυρο, αλλά ο χρήστης δεν έχει δικαίωμα |
| `409` | Το email είναι ήδη καταχωρημένο |
| `429` | Πάρα πολλά requests στα `/api/auth/*` (βλ. [Ασφάλεια](#ασφάλεια)) |

## Ροή για έναν client

```bash
# 1. Εγγραφή
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"maria@example.com","password":"correct-horse-battery"}'

# 2. Login: κράτα accessToken και refreshToken
curl -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"maria@example.com","password":"correct-horse-battery"}'

# 3. Κάθε request με το access token
curl http://localhost:3000/api/places -H 'Authorization: Bearer <accessToken>'

# 4. Όταν πάρεις 401 (έληξε το access token): νέα tokens
curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'

# 5. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

Τι πρέπει να κάνει κάθε client:

- Μετά από κάθε `refresh` να κρατάει το **νέο** refresh token. Το παλιό δεν ξαναδουλεύει, και αν σταλεί ξανά κάνει logout τον χρήστη παντού.
- Αν ένα request πάρει `401`, να κάνει **ένα** `refresh` και να ξαναστείλει το request. Αν αποτύχει και το `refresh`, να στείλει τον χρήστη στο login.
- Αν τρέχουν πολλά requests ταυτόχρονα, να κάνει ένα μόνο `refresh` και να περιμένουν όλα αυτό. Δύο ταυτόχρονα `refresh` με το ίδιο token μετράνε ως επαναχρησιμοποίηση.
- **Αποθήκευση:** mobile apps στο secure storage της συσκευής (Keychain / Keystore). Web apps: το access token μόνο στη μνήμη και το refresh token στο `localStorage`. Το `localStorage` το διαβάζει όποιο script τρέχει στη σελίδα, άρα η προστασία από XSS (καθόλου `dangerouslySetInnerHTML` με δεδομένα χρηστών, προσοχή στα τρίτα scripts) είναι απαραίτητη.

## Ρόλοι και δικαιώματα

| Ρόλος | Τι μπορεί |
| --- | --- |
| `user` | Βλέπει όλα τα places, δημιουργεί places, αλλάζει και σβήνει **μόνο τα δικά του** |
| `admin` | Ό,τι ο `user`, και επιπλέον αλλάζει ή σβήνει **όλα** τα places, βλέπει τους χρήστες, αλλάζει ρόλους, απενεργοποιεί χρήστες |

| Endpoint | Δημόσιο | `user` | `admin` |
| --- | --- | --- | --- |
| `GET /api`, `GET /api/health` | ✓ | ✓ | ✓ |
| `POST /api/auth/register`, `login`, `refresh`, `logout` | ✓ | ✓ | ✓ |
| `GET /api/auth/me` | | ✓ | ✓ |
| `GET /api/places`, `GET /api/places/nearby`, `POST /api/places` | | ✓ | ✓ |
| `PATCH` / `DELETE /api/places/:id` | | μόνο τα δικά του | όλα |
| `GET /api/users`, `PATCH /api/users/:id` | | | ✓ |

Κανόνες:

- Το `register` δίνει **πάντα** ρόλο `user`. Admin γίνεται κάποιος μόνο από άλλον admin (`PATCH /api/users/:id`) ή με την εντολή `create-admin`.
- Ένας admin **δεν** μπορεί να αλλάξει τον δικό του ρόλο ή να απενεργοποιήσει τον εαυτό του (`400`). Έτσι δεν μένει κατά λάθος το σύστημα χωρίς admin.
- Αλλαγή ρόλου ή απενεργοποίηση ακυρώνει τα refresh tokens του χρήστη, οπότε πρέπει να ξανακάνει login. Το access token που ήδη έχει λήγει μέσα σε 15 λεπτά.
- Ένας απενεργοποιημένος χρήστης δεν μπορεί ούτε login ούτε refresh.
- Αν σβηστεί ένας χρήστης, τα places του μένουν με `createdById: null` και τα αλλάζει μόνο admin.

## Προστασία endpoints στον κώδικα

Δύο guards είναι δηλωμένα **global** στο [auth.module.ts](../../apps/api/src/auth/auth.module.ts) και τρέχουν σε κάθε request:

1. **[AuthGuard](../../apps/api/src/auth/auth.guard.ts):** ελέγχει το Bearer token και βάζει τον χρήστη στο request (`{ id, role }`).
2. **[RolesGuard](../../apps/api/src/auth/roles.guard.ts):** ελέγχει το `@Roles(...)`, αν υπάρχει.

Οι decorators είναι στο [decorators.ts](../../apps/api/src/auth/decorators.ts):

| Decorator | Πού | Τι κάνει |
| --- | --- | --- |
| `@Public()` | Endpoint ή controller | Ανοιχτό χωρίς token |
| `@Roles('admin')` | Endpoint ή controller | Μόνο αυτοί οι ρόλοι, αλλιώς `403` |
| `@CurrentUser()` | Παράμετρος | Ο χρήστης του token: `{ id, role }` |

```ts
@Controller('reports')
export class ReportsController {
  @Public()
  @Get('summary')
  summary() { ... }                         // χωρίς token

  @Get()
  findMine(@CurrentUser() user: AuthUser) { ... }   // οποιοσδήποτε συνδεδεμένος

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) { ... }   // μόνο admin
}
```

**Ιδιοκτησία:** οι ρόλοι δεν αρκούν όταν το δικαίωμα εξαρτάται από τα δεδομένα («μόνο τα δικά του»). Ο έλεγχος γίνεται στο service, όπως στο [places.service.ts](../../apps/api/src/places/places.service.ts):

```ts
private async findEditable(id: string, actor: AuthUser): Promise<Place> {
  const place = await this.places.findOneBy({ id });
  if (!place) throw new NotFoundException('Place not found');
  if (actor.role !== 'admin' && place.createdById !== actor.id) {
    throw new ForbiddenException('You can only change your own places');
  }
  return place;
}
```

> [!IMPORTANT]
> Ένα νέο endpoint είναι **κλειστό** μέχρι να βάλεις `@Public()`. Πριν το βάλεις, σκέψου αν πρέπει πραγματικά να το βλέπει οποιοσδήποτε στο internet.

## Ο πρώτος admin

```bash
pnpm --filter api create-admin admin@example.com
```

- Αν ο χρήστης **δεν υπάρχει**, δημιουργείται ως admin με τυχαίο κωδικό, που τυπώνεται **μία φορά**. Φύλαξέ τον.
- Αν **υπάρχει**, γίνεται admin (και ενεργός) και κρατάει τον κωδικό του. Τα refresh tokens του ακυρώνονται, οπότε κάνει ξανά login για να πάρει token με τον νέο ρόλο.

Η εντολή χρησιμοποιεί τη βάση του `apps/api/.env`. Σε production την τρέχεις με τα στοιχεία της production βάσης στο environment.

## Ρυθμίσεις (.env)

Στο `apps/api/.env` (βλ. [.env.example](../../apps/api/.env.example)):

| Μεταβλητή | Default | Τι ορίζει |
| --- | --- | --- |
| `JWT_SECRET` | — (υποχρεωτικό) | Το κλειδί που υπογράφει τα access tokens. Τουλάχιστον 32 χαρακτήρες |
| `ACCESS_TOKEN_TTL` | `900` | Διάρκεια του access token σε δευτερόλεπτα |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Διάρκεια του refresh token σε μέρες |

Νέο secret:

```bash
openssl rand -base64 48
```

- Το api **δεν ξεκινάει** αν λείπει το `JWT_SECRET` ή είναι μικρότερο από 32 χαρακτήρες.
- Διαφορετικό secret σε κάθε περιβάλλον (local, staging, production). **Ποτέ** στο git.
- Αν αλλάξει το secret, όλα τα access tokens γίνονται άκυρα. Οι clients παίρνουν `401`, κάνουν refresh και συνεχίζουν, γιατί τα refresh tokens δεν εξαρτώνται από το secret.

## Ασφάλεια

| Μέτρο | Πού |
| --- | --- |
| Κωδικοί με **argon2id**, ποτέ σε καθαρό κείμενο | [users.service.ts](../../apps/api/src/users/users.service.ts) |
| Ίδιο μήνυμα και ίδιος χρόνος απάντησης για λάθος email, λάθος κωδικό και ανενεργό χρήστη, ώστε να μη φαίνεται ποια email υπάρχουν | [auth.service.ts](../../apps/api/src/auth/auth.service.ts) |
| **Όριο 10 requests το λεπτό ανά IP** στα `/api/auth/*` (εκτός `/me`), κατά της μαντεψιάς κωδικών | [auth.controller.ts](../../apps/api/src/auth/auth.controller.ts), `@nestjs/throttler` |
| Refresh tokens αποθηκευμένα μόνο ως SHA-256 hash: μια διαρροή της βάσης δεν δίνει έγκυρα tokens | [tokens.service.ts](../../apps/api/src/auth/tokens.service.ts) |
| Rotation και ανίχνευση επαναχρησιμοποίησης των refresh tokens | [tokens.service.ts](../../apps/api/src/auth/tokens.service.ts) |
| Μόνο ο αλγόριθμος HS256 γίνεται δεκτός στα JWT | [auth.guard.ts](../../apps/api/src/auth/auth.guard.ts) |

Γνωστά όρια:

- **Το όριο requests κρατιέται στη μνήμη** του process. Αν τρέξουν πολλά instances του api πίσω από load balancer, κάθε instance μετράει ξεχωριστά. Τότε χρειάζεται κοινή αποθήκευση στο Redis, π.χ. με storage του `@nestjs/throttler` για Redis.
- **Πίσω από reverse proxy** (nginx, load balancer), όλα τα requests φαίνονται να έρχονται από την IP του proxy, άρα το όριο μοιράζεται σε όλους τους χρήστες. Πρέπει να ρυθμιστεί το `trust proxy` του Express, ώστε να διαβάζεται η πραγματική IP από το `X-Forwarded-For`.
- **Τα ληγμένα refresh tokens δεν σβήνονται αυτόματα** από τον πίνακα `refresh_tokens`. Δεν είναι πρόβλημα ασφάλειας, γιατί απορρίπτονται, αλλά με τον καιρό ο πίνακας μεγαλώνει. Λύση: περιοδικό `DELETE FROM refresh_tokens WHERE "expiresAt" < now() - interval '7 days'`.

## Αρχεία

| Αρχείο | Τι κάνει |
| --- | --- |
| [auth/auth.controller.ts](../../apps/api/src/auth/auth.controller.ts) | Τα `/api/auth/*` endpoints |
| [auth/auth.service.ts](../../apps/api/src/auth/auth.service.ts) | Register και login με email/κωδικό |
| [auth/tokens.service.ts](../../apps/api/src/auth/tokens.service.ts) | Έκδοση, rotation και ακύρωση tokens, **ανεξάρτητα** από τον τρόπο login |
| [auth/auth.guard.ts](../../apps/api/src/auth/auth.guard.ts) | Έλεγχος Bearer token σε κάθε request |
| [auth/roles.guard.ts](../../apps/api/src/auth/roles.guard.ts) | Έλεγχος `@Roles` |
| [auth/decorators.ts](../../apps/api/src/auth/decorators.ts) | `@Public`, `@Roles`, `@CurrentUser` |
| [auth/refresh-token.entity.ts](../../apps/api/src/auth/refresh-token.entity.ts) | Ο πίνακας `refresh_tokens` |
| [users/user.entity.ts](../../apps/api/src/users/user.entity.ts) | Ο πίνακας `users` |
| [users/users.service.ts](../../apps/api/src/users/users.service.ts) | Χρήστες: δημιουργία, αλλαγές, ακύρωση sessions |
| [users/users.controller.ts](../../apps/api/src/users/users.controller.ts) | Τα `/api/users` endpoints (admin) |
| [config/auth.config.ts](../../apps/api/src/config/auth.config.ts) | Ανάγνωση και έλεγχος των μεταβλητών του `.env` |
| [cli/create-admin.ts](../../apps/api/src/cli/create-admin.ts) | Η εντολή `create-admin` |
| [test/auth.e2e-spec.ts](../../apps/api/test/auth.e2e-spec.ts) | E2E tests για όλη τη ροή |

Τα schemas (`RegisterSchema`, `LoginSchema`, `TokensSchema`, `UserSchema`, `Role` κ.λπ.) είναι στο [packages/shared/src/auth.ts](../../packages/shared/src/auth.ts), ώστε να τα χρησιμοποιούν και οι φόρμες των frontends.

## Προσθήκη Google login

Δεν είναι ενεργό ακόμα. Ο κώδικας είναι οργανωμένος ώστε να προστεθεί χωρίς αλλαγές στα υπόλοιπα: το `TokensService` βγάζει tokens για οποιονδήποτε χρήστη, όπως κι αν έκανε login. Ρόλοι, guards, refresh και ιδιοκτησία μένουν ίδια.

Η ροή που προτείνει η Google για backends ([Verify the Google ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)) δεν χρειάζεται redirects ή cookies:

1. Ο client κάνει «Sign in with Google» (Google Identity Services στο web, Google SDK στο mobile) και παίρνει ένα **Google ID token**.
2. Το στέλνει στο `POST /api/auth/google` με body `{ "idToken": "..." }`.
3. Το api ελέγχει το token, βρίσκει ή δημιουργεί τον χρήστη, και επιστρέφει τα δικά μας tokens.

Βήματα υλοποίησης:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID*, τύπος *Web application*. Στα *Authorized JavaScript origins* βάλε τα URLs των frontends (π.χ. `http://localhost:5173`). Για mobile χρειάζεται ξεχωριστό client ID ανά πλατφόρμα.
2. Στο `.env`: `GOOGLE_CLIENT_IDS=<web client id>,<android client id>,...`
3. Πακέτο: `pnpm --filter api add google-auth-library`
4. **Migration:**
   - Στο `User`: νέα στήλη `googleId` (`varchar`, `nullable`, `unique`), και το `passwordHash` γίνεται `nullable`, για χρήστες που μπαίνουν μόνο με Google.
   - `pnpm --filter api migration:generate src/migrations/AddGoogleLogin`
   - Στο `AuthService.login`: ένας χρήστης χωρίς `passwordHash` δεν μπορεί να κάνει login με κωδικό.
5. **Schema** στο shared: `GoogleLoginSchema = z.object({ idToken: z.string().min(1) })`.
6. **Endpoint** `@Public() @Post('google')` στο `AuthController`, που καλεί μια νέα `AuthService.loginWithGoogle(idToken)`:
   - `new OAuth2Client().verifyIdToken({ idToken, audience: GOOGLE_CLIENT_IDS })`, που ελέγχει υπογραφή, λήξη και ότι το token είναι για τη δική μας εφαρμογή.
   - Απόρριψη αν `email_verified` δεν είναι `true`.
   - Αναζήτηση χρήστη με `googleId = payload.sub`. Αν δεν βρεθεί, με το email: αν υπάρχει λογαριασμός με το ίδιο email, συνδέεται ο `googleId` σε αυτόν. Αλλιώς δημιουργείται νέος χρήστης με ρόλο `user`.
   - Απόρριψη αν ο χρήστης είναι ανενεργός, και μετά `tokensService.issue(user)`.
7. **Tests:** στα e2e, το `OAuth2Client.verifyIdToken` αντικαθίσταται με mock, ώστε να μη χρειάζεται αληθινός λογαριασμός Google.
