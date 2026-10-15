# Backend (API)

Το backend είναι εφαρμογή [AdonisJS](https://docs.adonisjs.com) 7 στο `apps/api`. Είναι γραμμένο σε TypeScript 6 ως ESM, και όλα τα routes είναι κάτω από το `/api/v1`. Ξεκίνησε από το επίσημο API starter kit, προσαρμοσμένο σε PostgreSQL, χωρίς sessions και cookies.

- Βάση και migrations: [DB.md](DB.md)
- Login και tokens: [AUTH.md](AUTH.md)
- Αρχεία (S3): [STORAGE.md](../infrastructure/STORAGE.md)

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
docker compose up -d postgres redis rustfs-init   # βάση, Redis, S3 (βλ. infrastructure/DOCKER.md)
cp apps/api/.env.example apps/api/.env            # μία φορά
npm run ace -w api -- generate:key                # μία φορά: γεμίζει το APP_KEY
npm run ace -w api -- migration:run               # μία φορά, και μετά από κάθε νέο migration
npm run dev -w api                                # http://localhost:3333/api/v1/health
```

Ή `npm run dev` από το root, για να σηκωθούν μαζί και τα frontends.

Το `npm run ace -w api -- <εντολή>` τρέχει το `node ace <εντολή>` μέσα στο `apps/api`. Το `--` χρειάζεται για να φτάσουν οι σημαίες της εντολής στο Adonis (π.χ. `-- migration:fresh --drop-types`). Αν είσαι ήδη μέσα στον φάκελο, γράψε απευθείας `node ace <εντολή>`. Το `node ace list` δείχνει όλες τις εντολές.

| Εντολή (`npm run <script> -w api`) | Τι κάνει |
| --- | --- |
| `dev` | Dev server με hot reload (`node ace serve --hmr`) |
| `build` | Production build στο `build/` |
| `start` | Τρέχει το build (`node bin/server.js`, μέσα στο `build/`) |
| `lint` | ESLint (κανόνες του Adonis) |
| `format` | Prettier |
| `typecheck` | `tsc --noEmit` |
| `test` | Όλα τα tests (Japa). Χρειάζονται βάση και Redis (όχι RustFS: τα αρχεία πάνε σε fake disk) |
| `ace -- <εντολή>` | Οποιαδήποτε εντολή `node ace` (migrations, `make:*`) |

## Δομή

```
apps/api/
├── .env.example            # μεταβλητές περιβάλλοντος (αντιγράφεται σε .env)
├── adonisrc.ts             # providers, εντολές, test suites
├── app/
│   ├── controllers/        # HTTP handlers, ένας ανά πόρο (auth, profile, files, health)
│   ├── exceptions/         # μετατροπή σφαλμάτων σε απαντήσεις
│   ├── middleware/         # auth, JSON
│   ├── models/             # Lucid models (user, file)
│   ├── transformers/       # τι επιστρέφεται από κάθε model
│   └── validators/         # VineJS: έλεγχος body και query
├── config/                 # ρυθμίσεις: auth, database, drive (S3), redis, limiter, cors...
├── database/
│   ├── migrations/         # migrations της βάσης
│   ├── schema.ts           # ΠΑΡΑΓΕΤΑΙ αυτόματα από τη βάση, μην το αλλάζεις
│   └── schema_rules.ts     # κανόνες για το schema.ts (τύποι στηλών)
├── providers/              # το api_provider τυλίγει τις απαντήσεις σε { data }
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

Για κάθε πόρο υπάρχουν τα εξής αρχεία (παράδειγμα με `categories`):

| Αρχείο | Ρόλος |
| --- | --- |
| `app/models/category.ts` | Ο πίνακας της βάσης (Lucid). Επεκτείνει το παραγόμενο `CategorySchema` |
| `app/validators/category.ts` | Τι δεχόμαστε στο body και στο query |
| `app/controllers/categories_controller.ts` | Τα endpoints: έλεγχος input, κλήση στο model, απάντηση |
| `app/transformers/category_transformer.ts` | Ποια πεδία επιστρέφονται |
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
| `DRIVE_DISK`, `AWS_*`, `S3_BUCKET`, `S3_ENDPOINT` | βλ. [STORAGE.md](../infrastructure/STORAGE.md#ρυθμίσεις) | Αποθήκευση αρχείων (S3) |
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
| `GET` | `/api/v1/files` | Συνδεδεμένοι | Τα αρχεία μου, σε σελίδες (`?page=&perPage=`) |
| `POST` | `/api/v1/files` | Συνδεδεμένοι | Ανέβασμα αρχείου (multipart, πεδίο `file`, έως 20 MB) |
| `GET` | `/api/v1/files/:id` | Ιδιοκτήτης | Ένα αρχείο, με προσωρινό URL λήψης |
| `DELETE` | `/api/v1/files/:id` | Ιδιοκτήτης | Διαγραφή από S3 και βάση |

Λεπτομέρειες και παραδείγματα: [AUTH.md](AUTH.md) για το auth, [STORAGE.md](../infrastructure/STORAGE.md#πώς-χρησιμοποιείται-στο-api) για τα αρχεία.

## Μορφή απαντήσεων

Οι επιτυχημένες απαντήσεις είναι τυλιγμένες σε `data`. Αυτό το κάνει το `ctx.serialize(...)` (`providers/api_provider.ts`):

```json
{ "data": { "id": "19753223-0a9f-471c-a0c9-e7d3648ae5e3", "fullName": "Maria P", "email": "maria@example.com", "createdAt": "2026-10-15T11:10:46.354+00:00", "updatedAt": "2026-10-15T11:10:46.354+00:00", "initials": "MP" } }
```

Τα σφάλματα έρχονται ως λίστα `errors`:

| Κωδικός | Πότε | Παράδειγμα |
| --- | --- | --- |
| `400` | Λάθος email ή κωδικός | `{"errors":[{"message":"Invalid user credentials"}]}` |
| `401` | Λείπει ή είναι άκυρο το token | `{"errors":[{"message":"Unauthorized access"}]}` |
| `404` | Δεν υπάρχει η εγγραφή | |
| `422` | Λάθος δεδομένα, ένα στοιχείο ανά πεδίο | `{"errors":[{"message":"The email field must be a valid email address","rule":"email","field":"email"}]}` |
| `429` | Πάρα πολλά requests στα `/auth/*` | |

## Νέα λειτουργία, βήμα-βήμα

Παράδειγμα: κατηγορίες (`categories`).

1. **Migration** για τον πίνακα (βλ. [DB.md](DB.md#ροή-νέος-πίνακας)):

   ```bash
   npm run ace -w api -- make:migration categories
   # γράψε το createTable στο αρχείο, μετά:
   npm run ace -w api -- migration:run
   ```

   Το `migration:run` ξαναπαράγει το `database/schema.ts` με την κλάση `CategorySchema`.

2. **Model**, που επεκτείνει το παραγόμενο schema:

   ```bash
   npm run ace -w api -- make:model category
   ```

   ```ts
   import { CategorySchema } from '#database/schema'

   export default class Category extends CategorySchema {}
   ```

3. **Validator, transformer, controller:**

   ```bash
   npm run ace -w api -- make:validator category
   npm run ace -w api -- make:transformer category
   npm run ace -w api -- make:controller categories
   ```

   Παράδειγμα controller:

   ```ts
   export default class CategoriesController {
     async index({ serialize }: HttpContext) {
       const categories = await Category.query().orderBy('name')
       return serialize(CategoryTransformer.transform(categories))
     }

     async store({ request, response, serialize }: HttpContext) {
       const data = await request.validateUsing(createCategoryValidator)
       const category = await Category.create(data)
       response.status(201)
       return serialize(CategoryTransformer.transform(category))
     }
   }
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

5. **Tests** στο `tests/functional/categories.spec.ts`.

> [!IMPORTANT]
> Στο Adonis ένα route είναι **ανοιχτό**, εκτός αν μπει σε group με `middleware.auth()`. Βάζε κάθε νέο route που θέλει login μέσα στο υπάρχον group του `start/routes.ts`.

Μετά από νέο controller, το `#generated/controllers` ενημερώνεται μόνο του όταν τρέχει το `dev` ή το `build`. Αν κάποια εντολή `ace` σκάσει με `Cannot read properties of undefined (reading 'name')` στο `start/routes.ts`, τρέξε μία φορά `npm run build -w api`.

## Validation

Το input ελέγχεται με [VineJS](https://vinejs.dev), τον validator του Adonis, στο `app/validators/`:

```ts
// app/validators/user.ts
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

// στον controller
const { email, password } = await request.validateUsing(loginValidator)
```

- Αν τα δεδομένα είναι σωστά, το `validateUsing` επιστρέφει τα **καθαρισμένα** δεδομένα (`trim`, πεζά email, αριθμοί από το query string), με σωστούς TypeScript τύπους.
- Αν δεν είναι, απαντάει `422` με ένα σφάλμα ανά πεδίο.

Τα frontends μπορούν να ελέγχουν τις φόρμες με Zod schemas στο `@repo/shared` (βλ. [SHARED.md](../shared/SHARED.md)). Αν αλλάξεις έναν κανόνα (π.χ. μέγιστο μήκος), άλλαξέ τον και στα δύο σημεία.

## Tests

Τα tests είναι γραμμένα με [Japa](https://japa.dev), το test framework του Adonis:

| Suite | Πού | Τι ελέγχει |
| --- | --- | --- |
| `functional` | `tests/functional/*.spec.ts` | Το HTTP API, με αληθινή βάση |
| `unit` | `tests/unit/*.spec.ts` | Μεμονωμένες συναρτήσεις (δεν υπάρχουν ακόμα) |

```bash
npm run test -w api                           # όλα
npm run ace -w api -- test functional         # ένα suite
npm run ace -w api -- test --files=auth       # ένα αρχείο
```

Χρειάζονται τη βάση (`docker compose up -d postgres`). Κάθε test τρέχει μέσα σε transaction που αναιρείται στο τέλος (`isolate(group)` στο `tests/helpers.ts`), οπότε τα δεδομένα των tests δεν μένουν στη βάση.

Στα tests, το `.loginAs(user)` στέλνει αυτόματα token για τον χρήστη:

```ts
const user = await createUser()
const response = await client.get('/api/v1/account/profile').loginAs(user)
response.assertStatus(200)
```

## Κανόνες κώδικα

- **Imports με aliases**, όχι με σχετικά paths: `#models/user`, `#validators/user` (ορίζονται στο `imports` του `package.json`).
- **Μην αλλάζεις τα παραγόμενα αρχεία:** `database/schema.ts` και `.adonisjs/`. Αλλαγές στους τύπους του schema γίνονται στο `database/schema_rules.ts`.
- **Ο controller μένει λεπτός:** έλεγχος input, κλήση στο model, απάντηση. Σύνθετα queries μπαίνουν σε scopes του model.
- **Σε εντολές ace** (`commands/`), τα models φορτώνονται μέσα στο `run()` (`await import('#models/user')`), γιατί τα services (hash, db) είναι έτοιμα μόνο αφού ξεκινήσει η εφαρμογή.
- **Πριν από commit:** `npm run lint`, `npm run typecheck -w api` και `npm test` από το root.
