# Authentication και authorization

Το api χρησιμοποιεί **Bearer tokens**: κάθε client στέλνει το header `Authorization: Bearer <token>`. Δεν χρησιμοποιούνται cookies, οπότε η ίδια ροή δουλεύει για web, mobile και scripts.

- **Authentication** (ποιος είσαι): email και κωδικός, με τα access tokens του [`@adonisjs/auth`](https://docs.adonisjs.com/guides/authentication/access-tokens-guard).
- **Authorization** (τι επιτρέπεται): ρόλοι `admin` και `user`, και ιδιοκτησία πάνω στα δεδομένα, με το [`@adonisjs/bouncer`](https://docs.adonisjs.com/guides/security/authorization).

## Περιεχόμενα

- [Tokens](#tokens)
- [Endpoints](#endpoints)
- [Ροή για έναν client](#ροή-για-έναν-client)
- [Ρόλοι και δικαιώματα](#ρόλοι-και-δικαιώματα)
- [Δικαιώματα στον κώδικα](#δικαιώματα-στον-κώδικα)
- [Ο πρώτος admin](#ο-πρώτος-admin)
- [Ασφάλεια](#ασφάλεια)
- [Αρχεία](#αρχεία)
- [Προσθήκη Google login](#προσθήκη-google-login)

## Tokens

| | |
| --- | --- |
| Μορφή | Τυχαίο token που ξεκινάει με `oat_` (opaque access token) |
| Αποθήκευση | Στη βάση, στον πίνακα `auth_access_tokens`, **μόνο το hash** του |
| Διάρκεια | 30 μέρες (`expiresIn` στο `app/models/user.ts`) |
| Έλεγχος | Σε κάθε request: αναζήτηση στη βάση και φόρτωση του χρήστη |
| Ακύρωση | **Αμέσως:** logout, απενεργοποίηση χρήστη, αλλαγή ρόλου |

Επειδή σε κάθε request το token ελέγχεται στη βάση και ο χρήστης φορτώνεται ξανά:

- Ένα token που ακυρώθηκε σταματάει να δουλεύει αμέσως, χωρίς να περιμένουμε να λήξει.
- Μια αλλαγή ρόλου ή μια απενεργοποίηση ισχύει **από το επόμενο request**.
- Δεν χρειάζεται refresh token: ένα token ισχύει 30 μέρες, και μετά ο χρήστης κάνει ξανά login.

## Endpoints

| Method | Path | Ποιος | Body | Επιστρέφει |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/signup` | Όλοι | `{ fullName, email, password, passwordConfirmation }` | Χρήστη και token. Ρόλος πάντα `user` |
| `POST` | `/api/v1/auth/login` | Όλοι | `{ email, password }` | Χρήστη και token |
| `GET` | `/api/v1/account/profile` | Συνδεδεμένοι | — | Τον συνδεδεμένο χρήστη |
| `POST` | `/api/v1/account/logout` | Συνδεδεμένοι | — | Ακυρώνει το token του request |
| `GET` | `/api/v1/users` | Admin | — | Όλους τους χρήστες |
| `PATCH` | `/api/v1/users/:id` | Admin | `{ role?, isActive? }` | Τον χρήστη |

- `fullName` μπορεί να είναι `null`. Ο κωδικός έχει μήκος 8 έως 32 χαρακτήρες και το `passwordConfirmation` πρέπει να είναι ίδιο.
- Τα email αποθηκεύονται με πεζά, οπότε το `Maria@x.gr` και το `maria@x.gr` είναι ο ίδιος λογαριασμός.

Η απάντηση των `signup` και `login`:

```json
{
  "data": {
    "user": {
      "id": 96,
      "fullName": "Maria P",
      "email": "maria@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-10-15T11:10:46.354+00:00",
      "updatedAt": "2026-10-15T11:10:46.354+00:00",
      "initials": "MP"
    },
    "token": "oat_MTA4..."
  }
}
```

Ο χρήστης δεν περιέχει **ποτέ** τον κωδικό ή το hash του.

| Κωδικός | Πότε |
| --- | --- |
| `400` | Λάθος email ή κωδικός, ή ανενεργός χρήστης (`Invalid user credentials`). Επίσης όταν ένας admin πάει να αλλάξει τον εαυτό του |
| `401` | Λείπει ή είναι άκυρο το token, ή ο χρήστης απενεργοποιήθηκε |
| `403` | Το token είναι έγκυρο, αλλά δεν υπάρχει δικαίωμα (`Access denied`) |
| `422` | Λάθος δεδομένα, π.χ. μικρός κωδικός ή email που υπάρχει ήδη |
| `429` | Πάρα πολλά requests στα `/auth/*` |

## Ροή για έναν client

```bash
# 1. Εγγραφή (επιστρέφει ήδη token)
curl -X POST http://localhost:3333/api/v1/auth/signup \
  -H 'content-type: application/json' \
  -d '{"fullName":"Maria P","email":"maria@example.com","password":"correct-horse-battery","passwordConfirmation":"correct-horse-battery"}'

# 2. Login: κράτα το data.token
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"maria@example.com","password":"correct-horse-battery"}'

# 3. Κάθε request με το token
curl http://localhost:3333/api/v1/places -H 'Authorization: Bearer <token>'

# 4. Logout
curl -X POST http://localhost:3333/api/v1/account/logout -H 'Authorization: Bearer <token>'
```

Τι πρέπει να κάνει κάθε client:

- Όταν ένα request πάρει `401`, να στείλει τον χρήστη στο login: το token έληξε, ακυρώθηκε ή ο χρήστης απενεργοποιήθηκε.
- **Αποθήκευση του token:** mobile apps στο secure storage της συσκευής (Keychain / Keystore). Web apps στο `localStorage` ή στη μνήμη. Το `localStorage` το διαβάζει όποιο script τρέχει στη σελίδα, άρα η προστασία από XSS είναι απαραίτητη: καθόλου `dangerouslySetInnerHTML` με δεδομένα χρηστών, και προσοχή στα τρίτα scripts.

## Ρόλοι και δικαιώματα

| Ρόλος | Τι μπορεί |
| --- | --- |
| `user` | Βλέπει όλα τα places, δημιουργεί places, αλλάζει και σβήνει **μόνο τα δικά του** |
| `admin` | Ό,τι ο `user`, και επιπλέον αλλάζει και σβήνει **όλα** τα places, βλέπει τους χρήστες, αλλάζει ρόλους και απενεργοποιεί χρήστες |

| Endpoint | Δημόσιο | `user` | `admin` |
| --- | --- | --- | --- |
| `GET /api/v1/health` | ✓ | ✓ | ✓ |
| `POST /api/v1/auth/signup`, `login` | ✓ | ✓ | ✓ |
| `GET /api/v1/account/profile`, `POST /api/v1/account/logout` | | ✓ | ✓ |
| `GET /api/v1/places`, `GET /api/v1/places/nearby`, `POST /api/v1/places` | | ✓ | ✓ |
| `PATCH` / `DELETE /api/v1/places/:id` | | μόνο τα δικά του | όλα |
| `GET /api/v1/users`, `PATCH /api/v1/users/:id` | | | ✓ |

Κανόνες:

- Το `signup` δίνει **πάντα** ρόλο `user`. Admin γίνεται κάποιος μόνο από άλλον admin (`PATCH /api/v1/users/:id`) ή με την εντολή `create:admin`.
- Ένας admin **δεν** μπορεί να αλλάξει τον δικό του ρόλο ή να απενεργοποιήσει τον εαυτό του (`400`). Έτσι δεν μένει κατά λάθος το σύστημα χωρίς admin.
- Αλλαγή ρόλου ή απενεργοποίηση **σβήνει όλα τα tokens** του χρήστη, οπότε πρέπει να ξανακάνει login.
- Ένας ανενεργός χρήστης δεν μπορεί να κάνει login, και όσα tokens είχε σταματάνε να δουλεύουν αμέσως.
- Αν σβηστεί ένας χρήστης, τα places του μένουν με `createdById: null` και τα αλλάζει μόνο admin.

## Δικαιώματα στον κώδικα

### Login: middleware στα routes

Στο Adonis ένα route είναι **ανοιχτό**, εκτός αν μπει σε group με `middleware.auth()`. Στο [start/routes.ts](../../apps/api/start/routes.ts) όλα τα routes που θέλουν login είναι σε ένα group:

```ts
router
  .group(() => {
    // ... account, places, users
  })
  .use(middleware.auth())
```

Το [auth_middleware.ts](../../apps/api/app/middleware/auth_middleware.ts) ελέγχει το token και απορρίπτει (`401`) τους ανενεργούς χρήστες. Μέσα στον controller, ο χρήστης είναι στο `auth.getUserOrFail()`.

> [!IMPORTANT]
> Ένα νέο route που θέλει login πρέπει να μπει **μέσα** σε αυτό το group. Ένα route έξω από αυτό είναι ανοιχτό σε οποιονδήποτε στο internet.

### Ρόλοι: abilities

Για δικαιώματα που δεν αφορούν συγκεκριμένη εγγραφή, όπως «διαχειρίζεται χρήστες», υπάρχουν τα abilities στο [app/abilities/main.ts](../../apps/api/app/abilities/main.ts):

```ts
export const manageUsers = Bouncer.ability((user: User) => {
  return user.isAdmin
})

// στον controller: 403 αν δεν επιτρέπεται
await bouncer.authorize(manageUsers)
```

### Ιδιοκτησία: policies

Για δικαιώματα πάνω σε **μία εγγραφή** («μόνο τα δικά του»), υπάρχουν τα policies στο `app/policies/`. Παράδειγμα, το [place_policy.ts](../../apps/api/app/policies/place_policy.ts):

```ts
export default class PlacePolicy extends BasePolicy {
  edit(user: User, place: Place): AuthorizerResponse {
    return user.isAdmin || place.createdById === user.id
  }

  delete(user: User, place: Place): AuthorizerResponse {
    return this.edit(user, place)
  }
}

// στον controller: 403 αν δεν επιτρέπεται
const place = await Place.findOrFail(params.id)
await bouncer.with(PlacePolicy).authorize('edit', place)
```

Για έλεγχο χωρίς σφάλμα (π.χ. για να δείξεις ή να κρύψεις ένα κουμπί), χρησιμοποίησε `await bouncer.allows(manageUsers)` ή `await bouncer.with(PlacePolicy).allows('edit', place)`, που επιστρέφουν `true` / `false`.

Νέο policy: `pnpm --filter api ace make:policy <όνομα>`.

## Ο πρώτος admin

```bash
pnpm --filter api ace create:admin admin@example.com
```

- Αν ο χρήστης **δεν υπάρχει**, δημιουργείται ως admin με τυχαίο κωδικό, που τυπώνεται **μία φορά**. Φύλαξέ τον.
- Αν **υπάρχει**, γίνεται admin (και ενεργός) και κρατάει τον κωδικό του. Τα tokens του σβήνονται, οπότε κάνει ξανά login.

Η εντολή χρησιμοποιεί τη βάση του `apps/api/.env`. Σε production την τρέχεις με τα στοιχεία της production βάσης στο environment.

## Ασφάλεια

| Μέτρο | Πού |
| --- | --- |
| Κωδικοί με **scrypt** (ενσωματωμένο στο Node), ποτέ σε καθαρό κείμενο | [config/hash.ts](../../apps/api/config/hash.ts) |
| Τα tokens αποθηκεύονται μόνο ως hash: μια διαρροή της βάσης δεν δίνει έγκυρα tokens | `@adonisjs/auth` |
| Ίδια απάντηση για λάθος κωδικό, άγνωστο email και ανενεργό χρήστη, ώστε να μη φαίνεται ποια email υπάρχουν | [access_tokens_controller.ts](../../apps/api/app/controllers/access_tokens_controller.ts) |
| **Όριο 10 requests το λεπτό ανά IP** στα `/api/v1/auth/*` (signup, login), αποθηκευμένο στο Redis | [start/limiter.ts](../../apps/api/start/limiter.ts) |
| Security headers (X-Frame-Options, HSTS, nosniff) | [config/shield.ts](../../apps/api/config/shield.ts) |

Γνωστά όρια:

- **Το signup δείχνει αν ένα email υπάρχει** (`422`, «The email has already been taken»). Είναι συνηθισμένο για φόρμες εγγραφής, και το όριο requests δυσκολεύει τη μαζική δοκιμή.
- **Πίσω από reverse proxy** (nginx, load balancer), όλα τα requests φαίνονται να έρχονται από την IP του proxy, άρα το όριο μοιράζεται σε όλους. Πρέπει να οριστεί το `trustProxy` στο `http` του `config/app.ts`, ώστε να διαβάζεται η πραγματική IP από το `X-Forwarded-For`.
- **Τα ληγμένα tokens δεν σβήνονται αυτόματα** από τον πίνακα `auth_access_tokens`. Απορρίπτονται κανονικά, αλλά ο πίνακας μεγαλώνει. Λύση: περιοδικό `DELETE FROM auth_access_tokens WHERE expires_at < now()`.

## Αρχεία

| Αρχείο | Τι κάνει |
| --- | --- |
| [config/auth.ts](../../apps/api/config/auth.ts) | Ο guard `api` με access tokens |
| [app/models/user.ts](../../apps/api/app/models/user.ts) | Ο χρήστης: tokens (`expiresIn`), `isAdmin`, `revokeAllTokens` |
| [app/controllers/new_account_controller.ts](../../apps/api/app/controllers/new_account_controller.ts) | Signup |
| [app/controllers/access_tokens_controller.ts](../../apps/api/app/controllers/access_tokens_controller.ts) | Login και logout |
| [app/controllers/profile_controller.ts](../../apps/api/app/controllers/profile_controller.ts) | Profile |
| [app/controllers/users_controller.ts](../../apps/api/app/controllers/users_controller.ts) | Διαχείριση χρηστών (admin) |
| [app/middleware/auth_middleware.ts](../../apps/api/app/middleware/auth_middleware.ts) | Έλεγχος token και ενεργού χρήστη |
| [app/abilities/main.ts](../../apps/api/app/abilities/main.ts) | Abilities (`manageUsers`) |
| [app/policies/place_policy.ts](../../apps/api/app/policies/place_policy.ts) | Ιδιοκτησία των places |
| [app/validators/user.ts](../../apps/api/app/validators/user.ts) | Έλεγχος signup, login, αλλαγής χρήστη |
| [start/limiter.ts](../../apps/api/start/limiter.ts) | Όριο requests στα auth endpoints |
| [commands/create_admin.ts](../../apps/api/commands/create_admin.ts) | Η εντολή `create:admin` |
| [tests/functional/](../../apps/api/tests/functional/) | Tests για auth, places και users |

## Προσθήκη Google login

Δεν είναι ενεργό ακόμα. Προστίθεται χωρίς αλλαγές στα υπόλοιπα: ένα Google login καταλήγει σε `User.accessTokens.create(user)`, όπως και το login με κωδικό, άρα ρόλοι, policies και middleware μένουν ίδια.

Για API με Bearer tokens, ο απλούστερος τρόπος είναι αυτός που προτείνει η Google για backends ([Verify the Google ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)), χωρίς redirects και cookies:

1. Ο client κάνει «Sign in with Google» (Google Identity Services στο web, Google SDK στο mobile) και παίρνει ένα **Google ID token**.
2. Το στέλνει στο `POST /api/v1/auth/google` με body `{ "idToken": "..." }`.
3. Το api ελέγχει το token, βρίσκει ή δημιουργεί τον χρήστη, και επιστρέφει δικό μας access token.

Βήματα υλοποίησης:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID*, τύπος *Web application*. Στα *Authorized JavaScript origins* βάλε τα URLs των frontends (π.χ. `http://localhost:5173`). Για mobile χρειάζεται ξεχωριστό client ID ανά πλατφόρμα.
2. **Env:** `GOOGLE_CLIENT_IDS=<web client id>,<android client id>,...` στο `.env`, στο `.env.example` και στο `start/env.ts`.
3. **Πακέτο:** `pnpm --filter api add google-auth-library`
4. **Migration** (`ace make:migration users --alter`):
   - νέα στήλη `google_id` (`string`, `nullable`, `unique`)
   - το `password` γίνεται `nullable`, για χρήστες που μπαίνουν μόνο με Google
5. **Validator:** `googleLoginValidator = vine.create({ idToken: vine.string() })`.
6. **Controller** `GoogleLoginController.store`, με route `post('google', ...)` στο group `auth` (μαζί με το όριο requests):
   - `new OAuth2Client().verifyIdToken({ idToken, audience: GOOGLE_CLIENT_IDS })`, που ελέγχει υπογραφή, λήξη και ότι το token είναι για τη δική μας εφαρμογή
   - απόρριψη αν το `email_verified` δεν είναι `true`
   - αναζήτηση χρήστη με `googleId = payload.sub`. Αν δεν βρεθεί, με το email: αν υπάρχει λογαριασμός με το ίδιο email, συνδέεται ο `googleId` σε αυτόν. Αλλιώς δημιουργείται νέος χρήστης με ρόλο `user` και `isActive: true`
   - απόρριψη αν ο χρήστης είναι ανενεργός, και μετά `User.accessTokens.create(user)`
7. **Login με κωδικό:** ένας χρήστης χωρίς κωδικό (μόνο Google) δεν πρέπει να περνάει το `verifyCredentials`. Έλεγξέ το στο `AccessTokensController`.
8. **Tests:** το `verifyIdToken` αντικαθίσταται με mock, ώστε να μη χρειάζεται αληθινός λογαριασμός Google.

Εναλλακτικά, το Adonis έχει το [`@adonisjs/ally`](https://docs.adonisjs.com/guides/authentication/social-authentication) για social login με redirects. Ταιριάζει καλύτερα σε εφαρμογές με sessions και cookies, όχι σε καθαρό API με Bearer tokens.
