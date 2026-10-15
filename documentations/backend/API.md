# Backend (API)

Το backend είναι εφαρμογή [NestJS](https://nestjs.com) 12 στο `apps/api`. Είναι γραμμένο σε TypeScript 6 ως ESM (`"type": "module"`), και όλα τα routes είναι κάτω από το `/api`.

Για τη βάση και τα migrations δες το [DB.md](DB.md).

## Περιεχόμενα

- [Εκκίνηση](#εκκίνηση)
- [Δομή](#δομή)
- [Ρυθμίσεις (.env)](#ρυθμίσεις-env)
- [Endpoints](#endpoints)
- [Νέο module, βήμα-βήμα](#νέο-module-βήμα-βήμα)
- [Validation με Zod](#validation-με-zod)
- [Tests](#tests)
- [Κανόνες κώδικα](#κανόνες-κώδικα)

## Εκκίνηση

Από το root του repo:

```bash
docker compose up -d postgres redis      # η βάση (βλ. infrastructure/DOCKER.md)
cp apps/api/.env.example apps/api/.env   # μία φορά
pnpm --filter api migration:run          # μία φορά, και μετά από κάθε νέο migration
pnpm --filter api dev                    # http://localhost:3000/api/health
```

Ή `pnpm dev` για να σηκωθούν μαζί και τα frontends.

| Εντολή (`pnpm --filter api ...`) | Τι κάνει |
| --- | --- |
| `dev` | Τρέχει με watch: ξαναξεκινάει σε κάθε αλλαγή |
| `build` | Compile στο `dist/` |
| `start:prod` | Τρέχει το `dist/main.js` (μετά από `build`) |
| `lint` | oxlint (με type-aware κανόνες) |
| `format` | prettier στα `src/` και `test/` |
| `test` | Unit tests (vitest) |
| `test:e2e` | E2E tests, χρειάζονται τη βάση |
| `migration:*` | Βλ. [DB.md](DB.md#migrations) |

## Δομή

```
apps/api/
├── .env.example            # μεταβλητές περιβάλλοντος (αντιγράφεται σε .env)
├── src/
│   ├── main.ts             # εκκίνηση: global prefix /api, port
│   ├── app.module.ts       # root module: config, βάση, όλα τα modules
│   ├── app.controller.ts   # /api και /api/health
│   ├── data-source.ts      # για το TypeORM CLI (migrations)
│   ├── common/             # κοινά κομμάτια (pipes, guards, filters)
│   │   └── zod-validation.pipe.ts
│   ├── database/
│   │   └── database.config.ts
│   ├── migrations/         # migrations της βάσης
│   └── places/             # ένα module ανά λειτουργία
│       ├── place.entity.ts
│       ├── places.controller.ts
│       ├── places.module.ts
│       └── places.service.ts
└── test/                   # e2e tests
```

Κάθε λειτουργία είναι ένα **module** σε δικό του φάκελο, με τα εξής αρχεία:

| Αρχείο | Ρόλος |
| --- | --- |
| `*.entity.ts` | Ο πίνακας της βάσης (TypeORM) |
| `*.service.ts` | Η λογική: queries, κανόνες. Δεν ξέρει τίποτα για HTTP |
| `*.controller.ts` | Τα HTTP endpoints. Ελέγχει το input και καλεί το service. Χωρίς λογική |
| `*.module.ts` | Δένει τα παραπάνω και δηλώνει τι χρειάζεται (π.χ. `TypeOrmModule.forFeature`) |

## Ρυθμίσεις (.env)

Το `@nestjs/config` (`ConfigModule.forRoot` στο `app.module.ts`) διαβάζει το `apps/api/.env` στο `process.env` όταν ξεκινάει η εφαρμογή.

| Μεταβλητή | Default | Τι ορίζει |
| --- | --- | --- |
| `PORT` | `3000` | Port του api |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | βλ. [DB.md](DB.md#σύνδεση) | Σύνδεση με τη βάση |

Νέα μεταβλητή: πρόσθεσέ τη **και** στο `.env.example`, με τιμή που δουλεύει τοπικά ή με σχόλιο για το τι βάζεις.

Μην αλλάξεις το `PORT`, εκτός αν αλλάξεις και τον proxy στα `vite.config.ts` των frontends (βλ. [FRONTEND.md](../frontend/FRONTEND.md)).

## Endpoints

| Method | Path | Τι κάνει |
| --- | --- | --- |
| `GET` | `/api` | `Hello World!` |
| `GET` | `/api/health` | `{ "status": "ok" }`, για έλεγχο ότι τρέχει |
| `GET` | `/api/places` | Όλα τα σημεία, νεότερα πρώτα |
| `POST` | `/api/places` | Νέο σημείο |
| `GET` | `/api/places/nearby?lat=&lon=&radius=` | Σημεία σε ακτίνα `radius` μέτρων (default 1000, max 100000), πιο κοντινά πρώτα |

Παραδείγματα:

```bash
curl -X POST http://localhost:3000/api/places \
  -H 'content-type: application/json' \
  -d '{"name":"Λιμάνι Πειραιά","location":{"type":"Point","coordinates":[23.64,37.942]}}'

curl "http://localhost:3000/api/places/nearby?lat=37.943&lon=23.647&radius=2000"
```

Οι θέσεις είναι GeoJSON με σειρά `[longitude, latitude]` (βλ. [DB.md](DB.md#γεωχωρικά-δεδομένα-postgis)).

## Νέο module, βήμα-βήμα

Παράδειγμα: module `categories`. Το `places` είναι το πρότυπο που αντιγράφεις.

1. **Schemas στο shared:** τα σχήματα του input και του output μπαίνουν στο `packages/shared/src/category.ts` (βλ. [SHARED.md](../shared/SHARED.md)), για να τα χρησιμοποιούν και τα frontends.

2. **Entity:** `apps/api/src/categories/category.entity.ts`. Πρόσθεσέ το και στη λίστα `entities` του `database.config.ts`.

3. **Service:**

   ```ts
   @Injectable()
   export class CategoriesService {
     constructor(@InjectRepository(Category) private readonly categories: Repository<Category>) {}

     findAll(): Promise<Category[]> {
       return this.categories.find();
     }
   }
   ```

4. **Controller:**

   ```ts
   @Controller('categories')
   export class CategoriesController {
     constructor(private readonly categoriesService: CategoriesService) {}

     @Get()
     findAll(): Promise<Category[]> {
       return this.categoriesService.findAll();
     }
   }
   ```

5. **Module:**

   ```ts
   @Module({
     imports: [TypeOrmModule.forFeature([Category])],
     controllers: [CategoriesController],
     providers: [CategoriesService],
   })
   export class CategoriesModule {}
   ```

6. **Δήλωσέ το** στα `imports` του `app.module.ts`.

7. **Migration** για τον νέο πίνακα (βλ. [DB.md](DB.md#ροή-αλλαγή-στο-schema)):

   ```bash
   pnpm --filter api migration:generate src/migrations/CreateCategories
   pnpm --filter api migration:run
   ```

Μπορείς να φτιάξεις τα αρχεία και με το CLI του Nest: `pnpm --filter api exec nest g resource categories`. Αν το κάνεις, έλεγξε ότι τα imports έχουν κατάληξη `.js` (βλ. [Κανόνες κώδικα](#κανόνες-κώδικα)).

## Validation με Zod

Το input (body, query) ελέγχεται με τα Zod schemas του `@repo/shared`, μέσω του [ZodValidationPipe](../../apps/api/src/common/zod-validation.pipe.ts):

```ts
@Post()
create(@Body(new ZodValidationPipe(CreatePlaceSchema)) body: CreatePlace): Promise<Place> {
  return this.placesService.create(body);
}

@Get('nearby')
findNearby(@Query(new ZodValidationPipe(NearbyQuerySchema)) query: NearbyQuery): Promise<Place[]> {
  return this.placesService.findNearby(query);
}
```

- Αν τα δεδομένα είναι σωστά, το pipe επιστρέφει τα **καθαρισμένα** δεδομένα: εφαρμόζονται `trim`, defaults και μετατροπές τύπων. Για παράδειγμα, τα query parameters έρχονται ως string και γίνονται number με `z.coerce.number()`.
- Αν δεν είναι σωστά, επιστρέφει `400` με τα σφάλματα ανά πεδίο:

  ```json
  {
    "formErrors": [],
    "fieldErrors": {
      "name": ["Too small: expected string to have >=1 characters"],
      "location": ["Too big: expected number to be <=180"]
    }
  }
  ```

Επειδή το ίδιο schema ελέγχει και τις φόρμες στα frontends, οι κανόνες (π.χ. μέγιστο μήκος ονόματος) ορίζονται **μία φορά**.

## Tests

| Είδος | Πού | Εντολή | Χρειάζεται βάση |
| --- | --- | --- | --- |
| Unit | `src/**/*.spec.ts`, δίπλα στον κώδικα | `pnpm --filter api test` | Όχι |
| E2E | `test/*.e2e-spec.ts` | `pnpm --filter api test:e2e` | Ναι (`docker compose up -d postgres`) |

Και τα δύο τρέχουν με [vitest](https://vitest.dev). Το `pnpm test` από το root τρέχει μόνο τα unit tests όλων των πακέτων.

Τα e2e tests χρησιμοποιούν την ίδια βάση με το development (`apps/api/.env`). Αν ένα test γράφει δεδομένα, πρέπει να τα σβήνει στο τέλος.

## Κανόνες κώδικα

- **Imports με `.js`:** το api είναι ESM με `moduleResolution: nodenext`, οπότε τα σχετικά imports γράφονται με κατάληξη `.js`, ακόμα κι αν το αρχείο είναι `.ts`:

  ```ts
  import { PlacesService } from './places.service.js'; // σωστό
  import { PlacesService } from './places.service';    // σφάλμα στο build
  ```

- **Τύποι από το shared με `import type`**, όταν χρειάζεσαι μόνο τον τύπο: `import type { Place } from '@repo/shared'`.
- **Ο controller δεν έχει λογική.** Ελέγχει το input και καλεί το service. Τα queries και οι κανόνες μένουν στο service.
- **Πριν από commit:** `pnpm lint` και `pnpm test` από το root. Για formatting: `pnpm --filter api format`.
