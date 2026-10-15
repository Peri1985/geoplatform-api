# Authentication

Το api χρησιμοποιεί **Bearer tokens**: κάθε client στέλνει το header `Authorization: Bearer <token>`. Δεν χρησιμοποιούνται cookies, οπότε η ίδια ροή δουλεύει για web, mobile και scripts. Ο μηχανισμός είναι ο guard με access tokens του [`@adonisjs/auth`](https://docs.adonisjs.com/guides/auth/access-tokens-guard), όπως έρχεται στο API starter kit.

## Περιεχόμενα

- [Tokens](#tokens)
- [Endpoints](#endpoints)
- [Ροή για έναν client](#ροή-για-έναν-client)
- [Προστασία routes](#προστασία-routes)
- [Ασφάλεια](#ασφάλεια)
- [Αρχεία](#αρχεία)
- [Επόμενα βήματα](#επόμενα-βήματα)

## Tokens

| | |
| --- | --- |
| Μορφή | Τυχαίο token που ξεκινάει με `oat_` (opaque access token), όχι JWT |
| Αποθήκευση | Στη βάση, στον πίνακα `auth_access_tokens`, **μόνο το hash** του |
| Διάρκεια | 30 μέρες (`expiresIn` στο `app/models/user.ts`) |
| Έλεγχος | Σε κάθε request: αναζήτηση στη βάση και φόρτωση του χρήστη |
| Ακύρωση | **Αμέσως**, με το logout (σβήνεται από τη βάση) |

Δεν υπάρχουν refresh tokens: το Adonis 7 δεν έχει τέτοιο μηχανισμό. Ένα token ισχύει 30 μέρες, και μετά ο χρήστης κάνει ξανά login.

## Endpoints

| Method | Path | Ποιος | Body | Επιστρέφει |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/signup` | Όλοι | `{ fullName, email, password, passwordConfirmation }` | Χρήστη και token |
| `POST` | `/api/v1/auth/login` | Όλοι | `{ email, password }` | Χρήστη και token |
| `GET` | `/api/v1/account/profile` | Συνδεδεμένοι | — | Τον συνδεδεμένο χρήστη |
| `POST` | `/api/v1/account/logout` | Συνδεδεμένοι | — | Ακυρώνει το token του request |

- Το `fullName` μπορεί να είναι `null`. Ο κωδικός έχει μήκος 8 έως 32 χαρακτήρες και το `passwordConfirmation` πρέπει να είναι ίδιο.
- Τα email αποθηκεύονται με πεζά, οπότε το `Maria@x.gr` και το `maria@x.gr` είναι ο ίδιος λογαριασμός.

Η απάντηση των `signup` και `login`:

```json
{
  "data": {
    "user": {
      "id": "19753223-0a9f-471c-a0c9-e7d3648ae5e3",
      "fullName": "Maria P",
      "email": "maria@example.com",
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
| `400` | Λάθος email ή κωδικός (`Invalid user credentials`) |
| `401` | Λείπει ή είναι άκυρο το token (`Unauthorized access`) |
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
curl http://localhost:3333/api/v1/account/profile -H 'Authorization: Bearer <token>'

# 4. Logout
curl -X POST http://localhost:3333/api/v1/account/logout -H 'Authorization: Bearer <token>'
```

Τι πρέπει να κάνει κάθε client:

- Όταν ένα request πάρει `401`, να στείλει τον χρήστη στο login: το token έληξε ή ακυρώθηκε.
- **Αποθήκευση του token:** mobile apps στο secure storage της συσκευής (Keychain / Keystore). Web apps στο `localStorage` ή στη μνήμη. Το `localStorage` το διαβάζει όποιο script τρέχει στη σελίδα, άρα η προστασία από XSS είναι απαραίτητη: καθόλου `dangerouslySetInnerHTML` με δεδομένα χρηστών, και προσοχή στα τρίτα scripts.

## Προστασία routes

Στο Adonis ένα route είναι **ανοιχτό**, εκτός αν μπει σε group με `middleware.auth()`. Στο [start/routes.ts](../../apps/api/start/routes.ts) όλα τα routes που θέλουν login είναι σε ένα group:

```ts
router
  .group(() => {
    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
  })
  .use(middleware.auth())
```

Μέσα στον controller, ο συνδεδεμένος χρήστης είναι στο `auth.getUserOrFail()`:

```ts
async show({ auth, serialize }: HttpContext) {
  return serialize(UserTransformer.transform(auth.getUserOrFail()))
}
```

> [!IMPORTANT]
> Ένα νέο route που θέλει login πρέπει να μπει **μέσα** σε αυτό το group. Ένα route έξω από αυτό είναι ανοιχτό σε οποιονδήποτε στο internet.

## Ασφάλεια

| Μέτρο | Πού |
| --- | --- |
| Κωδικοί με **scrypt** (ενσωματωμένο στο Node), ποτέ σε καθαρό κείμενο | [config/hash.ts](../../apps/api/config/hash.ts) |
| Τα tokens αποθηκεύονται μόνο ως hash: μια διαρροή της βάσης δεν δίνει έγκυρα tokens | `@adonisjs/auth` |
| Ίδια απάντηση για λάθος κωδικό και άγνωστο email, ώστε να μη φαίνεται ποια email υπάρχουν | `User.verifyCredentials` |
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
| [app/models/user.ts](../../apps/api/app/models/user.ts) | Ο χρήστης και η διάρκεια των tokens (`expiresIn`) |
| [app/controllers/new_account_controller.ts](../../apps/api/app/controllers/new_account_controller.ts) | Signup |
| [app/controllers/access_tokens_controller.ts](../../apps/api/app/controllers/access_tokens_controller.ts) | Login και logout |
| [app/controllers/profile_controller.ts](../../apps/api/app/controllers/profile_controller.ts) | Profile |
| [app/middleware/auth_middleware.ts](../../apps/api/app/middleware/auth_middleware.ts) | Έλεγχος του token |
| [app/validators/user.ts](../../apps/api/app/validators/user.ts) | Έλεγχος signup και login |
| [start/limiter.ts](../../apps/api/start/limiter.ts) | Όριο requests στα auth endpoints |
| [tests/functional/auth.spec.ts](../../apps/api/tests/functional/auth.spec.ts) | Tests για όλη τη ροή |

## Επόμενα βήματα

Δεν υπάρχουν ακόμα, και προστίθενται χωρίς αλλαγές στα παραπάνω:

- **Ρόλοι και δικαιώματα:** με το [`@adonisjs/bouncer`](https://docs.adonisjs.com/guides/security/authorization) (`npm run ace -w api -- add @adonisjs/bouncer`). Abilities για γενικά δικαιώματα (π.χ. «διαχειρίζεται χρήστες») και policies για δικαιώματα πάνω σε μία εγγραφή (π.χ. «αλλάζει μόνο τα δικά του»). Μια πλήρης υλοποίηση, με ρόλους `admin`/`user`, απενεργοποίηση χρηστών και εντολή `create:admin`, υπάρχει στο ιστορικό του git (commit `50cedd4`).
- **Google login:** ο client κάνει «Sign in with Google» και στέλνει το Google ID token στο `POST /api/v1/auth/google`. Το api το ελέγχει με το `google-auth-library` ([Verify the Google ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)), βρίσκει ή δημιουργεί τον χρήστη, και επιστρέφει `User.accessTokens.create(user)`, όπως το login. Χρειάζεται migration για στήλη `google_id`, και το `password` να γίνει `nullable`.
- **Refresh tokens**, αν χρειαστούν πιο σύντομα access tokens (π.χ. για mobile app): δεύτερος provider στο model, `DbAccessTokensProvider.forModel(User, { type: 'refresh_token', prefix: 'ort_', expiresIn: '30 days' })`, και endpoint `POST /api/v1/auth/refresh` που ελέγχει το refresh token, το σβήνει και δίνει νέο ζευγάρι.
