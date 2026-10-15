# Backend (API)

Το backend είναι εφαρμογή [AdonisJS](https://docs.adonisjs.com) 7 στο `apps/api`. Είναι γραμμένο σε TypeScript 6 ως ESM, και όλα τα routes είναι κάτω από το `/api/v1`.

- Βάση και migrations: [DB.md](DB.md)
- Login, tokens και δικαιώματα: [AUTH.md](AUTH.md)

> [!IMPORTANT]
> Χρειάζεται **Node 24.22 ή νεότερο** (`.nvmrc` στο root). Με το Node 24.0.0 το Adonis σκάει με `addQueryContext is not a function` μόλις ανοίξει σύνδεση με τη βάση.

## Περιεχόμενα

- [Εκκίνηση](#εκκίνηση)
- [Δομή](#δομή)
- [Ρυθμίσεις (.env)](#ρυθμίσεις-env)
- [Endpoints](#endpoints)
- [Μορφή απαντήσεων](#μορφή-απαντήσεων)
- [Νέα λειτουργία, βήμα-βήμα](#νέα-λειτουργία-βήμα-βήμα)
- [Validation](#validation)
- [Tests](#tests)
- [Κανόνες κώδικα](#κανόνες-κώδικα)

## Εκκίνηση

Από το root του repo:

```bash
docker compose up -d postgres redis                  # βάση και Redis (βλ. infrastructure/DOCKER.md)
cp apps/api/.env.example apps/api/.env               # μία φορά
pnpm --filter api ace generate:key                   # μία φορά: γεμίζει το APP_KEY
pnpm --filter api ace migration:run                  # μία φορά, και μετά από κάθε νέο migration
pnpm --filter api ace create:admin <email>           # ο πρώτος admin
pnpm --filter api dev                                # http://localhost:3333/api/v1/health
```

Ή `pnpm dev` από το root, για να σηκωθούν μαζί και τα frontends.

Το `pnpm --filter api ace <εντολή>` τρέχει το `node ace <εντολή>` μέσα στο `apps/api`. Αν είσαι ήδη μέσα στον φάκελο, γράψε απευθείας `node ace <εντολή>`. Το `node ace list` δείχνει όλες τις εντολές.

| Εντολή (`pnpm --filter api ...`) | Τι κάνει |
| --- | --- |
| `dev` | Dev server με hot reload (`node ace serve --hmr`) |
| `build` | Production build στο `build/` |
| `start` | Τρέχει το build (`node bin/server.js`, μέσα στο `build/`) |
| `lint` | ESLint (κανόνες του Adonis) |
| `format` | Prettier |
| `typecheck` | `tsc --noEmit` |
| `test` | Όλα τα tests (Japa). Χρειάζονται βάση και Redis |
| `ace <εντολή>` | Οποιαδήποτε εντολή `node ace` (migrations, `make:*`, `create:admin`) |

## Δομή

```
apps/api/
├── .env.example            # μεταβλητές περιβάλλοντος (αντιγράφεται σε .env)
├── adonisrc.ts             # providers, εντολές, test suites
├── app/
│   ├── abilities/main.ts   # δικαιώματα που δεν αφορούν συγκεκριμένη εγγραφή (π.χ. manageUsers)
│   ├── columns/point.ts    # στήλη Lucid για PostGIS Point ↔ GeoJSON
│   ├── controllers/        # HTTP handlers, ένας ανά πόρο
│   ├── exceptions/         # μετατροπή σφαλμάτων σε απαντήσεις
│   ├── middleware/         # auth, bouncer, JSON
│   ├── models/             # Lucid models (user, place)
│   ├── policies/           # δικαιώματα πάνω σε εγγραφή (π.χ. PlacePolicy)
│   ├── transformers/       # τι επιστρέφεται από κάθε model
│   └── validators/         # VineJS: έλεγχος body και query
├── commands/               # δικές μας εντολές ace (create:admin)
├── config/                 # ρυθμίσεις: auth, database, redis, limiter, cors...
├── database/
│   ├── migrations/         # migrations της βάσης
│   ├── schema.ts           # ΠΑΡΑΓΕΤΑΙ αυτόματα από τη βάση, μην το αλλάζεις
│   └── schema_rules.ts     # κανόνες για το schema.ts (π.χ. τύπος του role)
├── start/
│   ├── env.ts              # έλεγχος των μεταβλητών του .env
│   ├── kernel.ts           # middleware
│   ├── limiter.ts          # όρια requests
│   └── routes.ts           # όλα τα routes
├── tests/
│   ├── functional/         # tests πάνω στο HTTP API
│   └── helpers.ts
└── .adonisjs/              # ΠΑΡΑΓΕΤΑΙ αυτόματα (indexes, typed routes)
```

Για κάθε πόρο (π.χ. places) υπάρχουν τα εξής αρχεία:

| Αρχείο | Ρόλος |
| --- | --- |
| `app/models/place.ts` | Ο πίνακας της βάσης (Lucid). Επεκτείνει το παραγόμενο `PlaceSchema` |
| `app/validators/place.ts` | Τι δεχόμαστε στο body και στο query |
| `app/controllers/places_controller.ts` | Τα endpoints: έλεγχος input, δικαιωμάτων, κλήση στο model |
| `app/policies/place_policy.ts` | Ποιος μπορεί να κάνει τι πάνω σε ένα place |
| `app/transformers/place_transformer.ts` | Ποια πεδία επιστρέφονται |
| `start/routes.ts` | Σε ποιο URL απαντάει κάθε μέθοδος του controller |

## Ρυθμίσεις (.env)

Το `apps/api/.env` διαβάζεται όταν ξεκινάει η εφαρμογή. Το `start/env.ts` ελέγχει κάθε μεταβλητή, και αν λείπει μία η εφαρμογή δεν ξεκινάει.

| Μεταβλητή | Default | Τι ορίζει |
| --- | --- | --- |
| `PORT`, `HOST` | `3333`, `localhost` | Πού ακούει το api |
| `APP_KEY` | — (υποχρεωτικό) | Κλειδί κρυπτογράφησης. Το φτιάχνει το `ace generate:key` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | βλ. [DB.md](DB.md#σύνδεση) | Σύνδεση με τη βάση |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | `127.0.0.1`, `6379` | Σύνδεση με το Redis |
| `LIMITER_STORE` | `redis` | Πού κρατιούνται τα όρια requests (`redis` ή `memory`) |
| `LOG_LEVEL` | `info` | Επίπεδο logs |

- Το `.env.test` υπερισχύει όταν τρέχουν τα tests (`LIMITER_STORE=memory`).
- Νέα μεταβλητή: πρόσθεσέ τη στο `start/env.ts` **και** στο `.env.example`.
- Τα `DB_PORT` και `REDIS_PORT` πρέπει να είναι ίδια με τα `POSTGRES_PORT` και `REDIS_PORT` του root `.env`.

## Endpoints

| Method | Path | Ποιος | Τι κάνει |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Δημόσιο | `{ "status": "ok" }` |
| `POST` | `/api/v1/auth/signup` | Δημόσιο | Εγγραφή, επιστρέφει χρήστη και token |
| `POST` | `/api/v1/auth/login` | Δημόσιο | Login, επιστρέφει χρήστη και token |
| `GET` | `/api/v1/account/profile` | Συνδεδεμένοι | Ο συνδεδεμένος χρήστης |
| `POST` | `/api/v1/account/logout` | Συνδεδεμένοι | Ακυρώνει το token |
| `GET` | `/api/v1/places` | Συνδεδεμένοι | Όλα τα σημεία, νεότερα πρώτα |
| `GET` | `/api/v1/places/nearby?lat=&lon=&radius=` | Συνδεδεμένοι | Σημεία σε ακτίνα `radius` μέτρων (default 1000, max 100000), πιο κοντινά πρώτα |
| `POST` | `/api/v1/places` | Συνδεδεμένοι | Νέο σημείο, με ιδιοκτήτη τον χρήστη (`201`) |
| `PATCH` | `/api/v1/places/:id` | Ιδιοκτήτης ή admin | Αλλαγή ονόματος ή θέσης |
| `DELETE` | `/api/v1/places/:id` | Ιδιοκτήτης ή admin | Διαγραφή (`204`) |
| `GET` | `/api/v1/users` | Admin | Όλοι οι χρήστες |
| `PATCH` | `/api/v1/users/:id` | Admin | Αλλαγή ρόλου ή απενεργοποίηση |

Λεπτομέρειες για auth και δικαιώματα: [AUTH.md](AUTH.md). Παραδείγματα (το `$TOKEN` είναι το `token` από το login):

```bash
curl -X POST http://localhost:3333/api/v1/places \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Λιμάνι Πειραιά","location":{"type":"Point","coordinates":[23.64,37.942]}}'

curl "http://localhost:3333/api/v1/places/nearby?lat=37.943&lon=23.647&radius=2000" \
  -H "Authorization: Bearer $TOKEN"
```

Οι θέσεις είναι GeoJSON με σειρά `[longitude, latitude]` (βλ. [DB.md](DB.md#γεωχωρικά-δεδομένα-postgis)).

## Μορφή απαντήσεων

Οι επιτυχημένες απαντήσεις είναι τυλιγμένες σε `data`. Αυτό το κάνει το `ctx.serialize(...)` (`providers/api_provider.ts`):

```json
{ "data": { "id": 20, "name": "Λιμάνι", "location": { "type": "Point", "coordinates": [23.64, 37.942] }, "createdById": 96, "createdAt": "2026-10-15T11:10:46.354+00:00", "updatedAt": "2026-10-15T11:10:46.354+00:00" } }
```

Τα σφάλματα έρχονται ως λίστα `errors`:

| Κωδικός | Πότε | Παράδειγμα |
| --- | --- | --- |
| `400` | Λάθος email ή κωδικός, ή μη επιτρεπτή ενέργεια | `{"errors":[{"message":"Invalid user credentials"}]}` |
| `401` | Λείπει ή είναι άκυρο το token | `{"errors":[{"message":"Unauthorized access"}]}` |
| `403` | Το token είναι έγκυρο, αλλά δεν υπάρχει δικαίωμα | `{"errors":[{"message":"Access denied"}]}` |
| `404` | Δεν υπάρχει η εγγραφή | |
| `422` | Λάθος δεδομένα, ένα στοιχείο ανά πεδίο | `{"errors":[{"message":"The email field must be a valid email address","rule":"email","field":"email"}]}` |
| `429` | Πάρα πολλά requests στα `/auth/*` | |

## Νέα λειτουργία, βήμα-βήμα

Παράδειγμα: κατηγορίες (`categories`). Τα places είναι το πρότυπο που αντιγράφεις.

1. **Migration** για τον πίνακα (βλ. [DB.md](DB.md#ροή-αλλαγή-στο-schema)):

   ```bash
   pnpm --filter api ace make:migration categories
   # γράψε το createTable στο αρχείο, μετά:
   pnpm --filter api ace migration:run
   ```

   Το `migration:run` ξαναπαράγει το `database/schema.ts` με την κλάση `CategorySchema`.

2. **Model**, που επεκτείνει το παραγόμενο schema:

   ```bash
   pnpm --filter api ace make:model category
   ```

   ```ts
   import { CategorySchema } from '#database/schema'

   export default class Category extends CategorySchema {}
   ```

3. **Validator, transformer, controller:**

   ```bash
   pnpm --filter api ace make:validator category
   pnpm --filter api ace make:transformer category
   pnpm --filter api ace make:controller categories
   ```

4. **Routes** στο `start/routes.ts`. Αν τα endpoints θέλουν login, μπαίνουν **μέσα** στο group με `middleware.auth()`:

   ```ts
   router
     .group(() => {
       router.get('/', [controllers.Categories, 'index']).as('index')
       router.post('/', [controllers.Categories, 'store']).as('store')
     })
     .prefix('categories')
     .as('categories')
   ```

5. **Δικαιώματα**, αν χρειάζονται: policy (`ace make:policy category`) ή ability στο `app/abilities/main.ts` (βλ. [AUTH.md](AUTH.md#δικαιώματα-στον-κώδικα)).

6. **Tests** στο `tests/functional/categories.spec.ts`.

> [!IMPORTANT]
> Στο Adonis ένα route είναι **ανοιχτό**, εκτός αν μπει σε group με `middleware.auth()`. Βάζε κάθε νέο route που θέλει login μέσα στο υπάρχον group του `start/routes.ts`.

Μετά από νέο controller, το `#generated/controllers` ενημερώνεται μόνο του όταν τρέχει το `dev` ή το `build`.

## Validation

Το input ελέγχεται με [VineJS](https://vinejs.dev), τον validator του Adonis, στο `app/validators/`:

```ts
// app/validators/place.ts
export const createPlaceValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(200),
  location: point(),
})

// app/controllers/places_controller.ts
const data = await request.validateUsing(createPlaceValidator)
```

- Αν τα δεδομένα είναι σωστά, το `validateUsing` επιστρέφει τα **καθαρισμένα** δεδομένα (`trim`, πεζά email, αριθμοί από το query string), με σωστούς TypeScript τύπους.
- Αν δεν είναι, απαντάει `422` με ένα σφάλμα ανά πεδίο.

Τα frontends μπορούν να ελέγχουν τις φόρμες με τα Zod schemas του `@repo/shared` (βλ. [SHARED.md](../shared/SHARED.md)). Αν αλλάξεις έναν κανόνα (π.χ. μέγιστο μήκος), άλλαξέ τον και στα δύο σημεία.

## Tests

Τα tests είναι γραμμένα με [Japa](https://japa.dev), το test framework του Adonis:

| Suite | Πού | Τι ελέγχει |
| --- | --- | --- |
| `functional` | `tests/functional/*.spec.ts` | Το HTTP API, με αληθινή βάση |
| `unit` | `tests/unit/*.spec.ts` | Μεμονωμένες συναρτήσεις (δεν υπάρχουν ακόμα) |

```bash
pnpm --filter api test                        # όλα
pnpm --filter api ace test functional         # ένα suite
pnpm --filter api ace test --files=places     # ένα αρχείο
```

Χρειάζονται τη βάση (`docker compose up -d postgres`). Κάθε test τρέχει μέσα σε transaction που αναιρείται στο τέλος (`isolate(group)` στο `tests/helpers.ts`), οπότε τα δεδομένα των tests δεν μένουν στη βάση.

Στα tests, το `.loginAs(user)` στέλνει αυτόματα token για τον χρήστη:

```ts
const user = await createUser()
const response = await client.get('/api/v1/places').loginAs(user)
response.assertStatus(200)
```

## Κανόνες κώδικα

- **Imports με aliases**, όχι με σχετικά paths: `#models/user`, `#validators/place`, `#columns/point` (ορίζονται στο `imports` του `package.json`).
- **Μην αλλάζεις τα παραγόμενα αρχεία:** `database/schema.ts` και `.adonisjs/`. Αλλαγές στους τύπους του schema γίνονται στο `database/schema_rules.ts`.
- **Ο controller μένει λεπτός:** έλεγχος input, έλεγχος δικαιωμάτων, κλήση στο model, απάντηση. Σύνθετα queries μπαίνουν σε scopes του model (όπως το `withinRadius`).
- **Σε εντολές ace,** τα models φορτώνονται μέσα στο `run()` (`await import('#models/user')`), γιατί τα services (hash, db) είναι έτοιμα μόνο αφού ξεκινήσει η εφαρμογή.
- **Πριν από commit:** `pnpm lint`, `pnpm --filter api typecheck` και `pnpm test` από το root.
