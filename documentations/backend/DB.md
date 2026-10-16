# Βάση δεδομένων

Το backend (`apps/api`) χρησιμοποιεί **PostgreSQL 18 με PostGIS 3.6**, μέσω του [Lucid](https://lucid.adonisjs.com), του ORM του AdonisJS. Η βάση τρέχει τοπικά στο Docker (βλ. [DOCKER.md](../infrastructure/DOCKER.md)).

Οι πίνακες είναι χωρισμένοι σε **PostgreSQL schemas**: `public` για τα κοινά, και ένα για κάθε προϊόν. Προς το παρόν υπάρχει μόνο το `geocoding`. Το task management (schema `tasks`) θα προστεθεί αργότερα. Βλ. [Schemas](#schemas).

Το schema αλλάζει **μόνο με migrations**. Μετά από κάθε migration, το Adonis ξαναπαράγει αυτόματα το `database/schema.ts`, δηλαδή τις κλάσεις με τις στήλες κάθε πίνακα, και τα models επεκτείνουν αυτές τις κλάσεις.

## Περιεχόμενα

- [Σύνδεση](#σύνδεση)
- [Schemas](#schemas)
- [Αρχεία](#αρχεία)
- [Models και το παραγόμενο schema](#models-και-το-παραγόμενο-schema)
- [Migrations](#migrations)
- [Γεωχωρικά δεδομένα (PostGIS)](#γεωχωρικά-δεδομένα-postgis)
- [Το τρέχον schema](#το-τρέχον-schema)
- [Συχνά προβλήματα](#συχνά-προβλήματα)

## Σύνδεση

Τα στοιχεία σύνδεσης είναι στο `apps/api/.env`, που φτιάχνεις από το [.env.example](../../apps/api/.env.example):

| Μεταβλητή     | Default       | Τι ορίζει      |
| ------------- | ------------- | -------------- |
| `DB_HOST`     | `localhost`   | Host της βάσης |
| `DB_PORT`     | `5432`        | Port της βάσης |
| `DB_USER`     | `geoplatform` | Χρήστης        |
| `DB_PASSWORD` | `geoplatform` | Κωδικός        |
| `DB_DATABASE` | `geoplatform` | Όνομα βάσης    |

> [!IMPORTANT]
> Το `DB_PORT` πρέπει να είναι ίδιο με το `POSTGRES_PORT` του root `.env` (αυτό που χρησιμοποιεί το Docker). Αν άλλαξες το port του Docker, π.χ. σε `5434` επειδή το `5432` ήταν πιασμένο, άλλαξέ το και εδώ.

Για να μπεις στη βάση με `psql`:

```bash
docker compose exec postgres psql -U geoplatform
```

Χρήσιμες εντολές μέσα στο `psql`: `\dt` (πίνακες του `public`), `\dt geocoding.*` (πίνακες ενός schema), `\d geocoding.geocoding_api_keys` (δομή ενός πίνακα), `\dn` (schemas), `\q` (έξοδος).

## Schemas

| Schema | Τι περιέχει | Models |
| --- | --- | --- |
| `public` | Τα κοινά: χρήστες, οργανισμοί (πελάτες) και μέλη, αρχεία, audit | `app/models/*.ts` |
| `geocoding` | Προϊόν 1: πακέτα, συνδρομές, API keys, χρήση | `app/models/geocoding_*.ts` |

Τα πακέτα και οι συνδρομές είναι στο schema κάθε προϊόντος.

Η σύνδεση έχει `searchPath: ['public', 'geocoding']` ([config/database.ts](../../apps/api/config/database.ts)). Αυτό λέει στα `migration:fresh`, `db:wipe` και `schema:generate` να καλύπτουν και τα δύο. **Νέο schema** θέλει migration με `CREATE SCHEMA` **και** προσθήκη στο `searchPath`.

**Migration σε άλλο schema:** `withSchema(...)`, και foreign keys με το schema του άλλου πίνακα:

```ts
this.schema.withSchema('geocoding').createTable('geocoding_api_keys', (table) => {
  table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
  table.uuid('organization_id').notNullable().references('id').inTable('public.organizations').onDelete('CASCADE')
  // enum μέσα στο schema
  table.enu('environment', ['production', 'test'], { useNative: true, enumName: 'api_key_environment', schemaName: 'geocoding' })
})

// down
this.schema.withSchema('geocoding').dropTable('geocoding_api_keys')
this.schema.raw('DROP TYPE IF EXISTS geocoding.api_key_environment')
```

> [!IMPORTANT]
> **Τα ονόματα πινάκων πρέπει να είναι μοναδικά σε όλη τη βάση**, όχι μόνο μέσα στο schema τους. Ο generator του `schema.ts` ονομάζει την κλάση μόνο από το όνομα του πίνακα (`plans` → `PlanSchema`), οπότε δύο πίνακες `plans` σε διαφορετικά schemas θα έβγαζαν την ίδια κλάση δύο φορές, και το build θα έσπαγε. Γι' αυτό **κάθε πίνακας ενός προϊόντος έχει πρόθεμα το schema του**: `geocoding.geocoding_plans` → `GeocodingPlanSchema`, `geocoding.geocoding_api_keys` → `GeocodingApiKeySchema`. Το ίδιο θα ισχύει για το `tasks` (`tasks.tasks_...`).
>
> Το ίδιο ισχύει για τα **enums**: το `migration:fresh --drop-types` τα σβήνει με το όνομά τους χωρίς το schema, οπότε από δύο enums με το ίδιο όνομα σβήνει μόνο το ένα, και το επόμενο migration αποτυγχάνει με `type "..." already exists`. Π.χ. `geocoding.api_key_environment`, όχι `geocoding.environment`.

**Model σε άλλο schema:** δηλώνεις ρητά τον πίνακα με το schema του. Το παραγόμενο schema δεν το κάνει μόνο του:

```ts
// app/models/geocoding_api_key.ts
export default class GeocodingApiKey extends compose(GeocodingApiKeySchema, withAudit()) {
  static table = 'geocoding.geocoding_api_keys'
}
```

Στο audit και στις πολυμορφικές σχέσεις (`files.attachable_type`), ο τύπος μιας εγγραφής είναι το `table` του model, π.χ. `geocoding.geocoding_api_keys`.

### Απομόνωση πελατών (multi-tenancy)

Κάθε πίνακας με δεδομένα πελάτη έχει **`organization_id`**, ακόμα κι όταν θα μπορούσε να το βρει μέσω σχέσης (π.χ. `geocoding.geocoding_api_usage` μέσω του API key). Έτσι κάθε query φιλτράρεται άμεσα με τον οργανισμό. **Κάθε query σε δεδομένα πελάτη πρέπει να περιορίζεται σε έναν οργανισμό.**

Τι γίνεται όταν σβήνεται ένας οργανισμός:
- **σβήνονται μαζί του** (`CASCADE`): μέλη, συνδρομές, API keys, χρήση
- **δεν σβήνονται αυτόματα:** τα αρχεία του (`files.owner_id` δεν είναι foreign key). Η διαγραφή οργανισμού πρέπει να τα σβήνει η ίδια, από το S3 και από τη βάση

## Αρχεία

| Αρχείο | Τι κάνει |
| --- | --- |
| [config/database.ts](../../apps/api/config/database.ts) | Η σύνδεση και πού βρίσκονται τα migrations |
| [database/migrations/](../../apps/api/database/migrations/) | Τα migrations, δηλαδή το ιστορικό αλλαγών του schema |
| [database/schema.ts](../../apps/api/database/schema.ts) | **Παράγεται αυτόματα** μετά από κάθε migration. Μην το αλλάζεις με το χέρι |
| [database/schema_rules.ts](../../apps/api/database/schema_rules.ts) | Κανόνες για το `schema.ts`: τύποι στηλών, στήλες που εξαιρούνται |
| [app/models/](../../apps/api/app/models/) | Τα models, ένα ανά πίνακα, με πρόθεμα το schema τους (`geocoding_*.ts`, κλάσεις `Geocoding*`) |
| [app/decorators/](../../apps/api/app/decorators/) | Decorators για ειδικές στήλες: `jsonColumn` (jsonb) και `pointColumn` (PostGIS Point ως GeoJSON) |

## Models και το παραγόμενο schema

Μετά από κάθε `migration:run`, το Adonis διαβάζει τη βάση και γράφει μια κλάση ανά πίνακα στο `database/schema.ts`, π.χ. `UserSchema` με όλες τις στήλες. Το model επεκτείνει αυτή την κλάση και προσθέτει μόνο ό,τι δεν παράγεται αυτόματα (σχέσεις, getters, μεθόδους):

```ts
// app/models/user.ts
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })

  get initials() { ... }
}
```

- Τα ονόματα των στηλών στη βάση είναι `snake_case` (`full_name`), και στον κώδικα `camelCase` (`fullName`). Η μετατροπή γίνεται αυτόματα.
- **Όλα τα ids είναι UUID** (`string` στον κώδικα), που τα παράγει η βάση με `gen_random_uuid()`. Δεν χρειάζεται να δώσεις id στο `create()`: το Lucid το διαβάζει πίσω από τη βάση.
- Όταν ο παραγόμενος τύπος μιας στήλης δεν είναι σωστός (π.χ. `any` για ένα enum), τον διορθώνεις στο `database/schema_rules.ts`, όχι στο `schema.ts`:

  ```ts
  export default {
    tables: {
      users: {
        columns: {
          // το name πρέπει να έχει και το @
          status: { tsType: `'active' | 'blocked'`, decorators: [{ name: '@column' }] },
        },
      },
    },
  } satisfies SchemaRules
  ```

- **jsonb:** ο κανόνας χρησιμοποιεί το `@jsonColumn`, που αποθηκεύει την τιμή με `JSON.stringify`. Με σκέτο `@column`, ο driver θα έστελνε μια λίστα της JavaScript ως πίνακα PostgreSQL και όχι ως JSON, και το insert θα αποτύγχανε. Για παράδειγμα:

  ```ts
  geocoding_api_keys: {
    columns: {
      allowed_domains: {
        tsType: 'string[]',
        decorators: [{ name: '@jsonColumn' }],
        imports: [{ source: '#decorators/json_column', namedImports: ['jsonColumn'] }],
      },
    },
  },
  ```

  Στο [schema_rules.ts](../../apps/api/database/schema_rules.ts) υπάρχουν έτοιμοι βοηθοί: `union('a', 'b')` για enums και `json('string[]')` για jsonb.
- **Οι κανόνες γράφονται με το όνομα του πίνακα χωρίς το schema** (`geocoding_api_keys`, όχι `geocoding.geocoding_api_keys`).
- **Τα δεκαδικά** (`decimal`, π.χ. τιμές) είναι `string` στον κώδικα, όχι `number`. Η PostgreSQL τα στέλνει ως κείμενο ώστε να μη χάνεται ακρίβεια σε χρηματικά ποσά. Για πράξεις χρησιμοποίησε βιβλιοθήκη δεκαδικών, όχι `Number()`.
- Για να ξαναπαραχθεί το `schema.ts` χωρίς migration: `npm run ace -w api -- schema:generate`.

> [!NOTE]
> Το Lucid **δεν** ξαναδιαβάζει την εγγραφή μετά από `create()`, οπότε οι default τιμές της βάσης (π.χ. `status = 'todo'`) δεν εμφανίζονται στο model. Στα models με `withAudit()` αυτό λύνεται αυτόματα: το mixin ξαναδιαβάζει την εγγραφή, ώστε και το audit να καταγράφει σωστά. Στα υπόλοιπα, δώσε την τιμή ρητά στο `create()` ή κάνε `await row.refresh()`.

## Migrations

Ένα migration είναι ένα αρχείο με δύο μεθόδους:

- **`up`**: εφαρμόζει την αλλαγή (π.χ. `createTable`).
- **`down`**: την αναιρεί (π.χ. `dropTable`).

Ο πίνακας `adonis_schema` κρατάει ποια έχουν τρέξει, οπότε το `migration:run` εφαρμόζει μόνο τα καινούργια, με τη σειρά του ονόματος αρχείου (ξεκινάει με timestamp). Όσα τρέχουν μαζί αποτελούν ένα **batch**, και το `migration:rollback` αναιρεί ολόκληρο το τελευταίο batch.

### Εντολές

Όλες τρέχουν από το root του repo. Μέσα στο `apps/api` γράφεις απευθείας `node ace ...`.

| Εντολή | Τι κάνει |
| --- | --- |
| `npm run ace -w api -- migration:run` | Εφαρμόζει όσα migrations δεν έχουν τρέξει ακόμα |
| `npm run ace -w api -- migration:status` | Λίστα όλων: `completed` ή `pending`, και σε ποιο batch |
| `npm run ace -w api -- migration:rollback` | Αναιρεί το **τελευταίο batch** |
| `npm run ace -w api -- migration:rollback --batch=0` | Αναιρεί **όλα** τα migrations |
| `npm run ace -w api -- make:migration <πίνακας>` | Νέο migration για νέο πίνακα, π.χ. `make:migration categories` → `..._create_categories_table.ts` |
| `npm run ace -w api -- make:migration <πίνακας> --alter` | Νέο migration για αλλαγή σε υπάρχοντα πίνακα → `..._alter_<πίνακας>_table.ts` |
| `npm run ace -w api -- migration:fresh --drop-types` | **Σβήνει όλους τους πίνακες** και τρέχει όλα τα migrations από την αρχή. Μόνο τοπικά |

Το `--drop-types` σβήνει και τα PostgreSQL enums. Χωρίς αυτό, αν υπάρχει enum, το `migration:fresh` αποτυγχάνει με `type "..." already exists`.

### Ροή: νέος πίνακας

Το Lucid **δεν** παράγει migrations από τα models: τα γράφεις εσύ, και το model ακολουθεί.

1. **Νέο migration:**

   ```bash
   npm run ace -w api -- make:migration categories
   ```

2. **Γράψε τον πίνακα** στο αρχείο που δημιουργήθηκε:

   ```ts
   async up() {
     this.schema.createTable(this.tableName, (table) => {
       table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
       table.string('name', 100).notNullable().unique()
       table.timestamp('created_at', { useTz: true }).notNullable()
       table.timestamp('updated_at', { useTz: true }).nullable()
     })
   }

   async down() {
     this.schema.dropTable(this.tableName)
   }
   ```

3. **Εφάρμοσέ το:** `npm run ace -w api -- migration:run`. Το `database/schema.ts` αποκτά την κλάση `CategorySchema`.

4. **Model:** `npm run ace -w api -- make:model category`, που επεκτείνει το `CategorySchema` (βλ. [API.md](API.md#νέα-λειτουργία-βήμα-βήμα)).

5. **Έλεγξε** ότι το `migration:rollback` και μετά ξανά το `migration:run` δουλεύουν. Έτσι επιβεβαιώνεις ότι το `down` είναι σωστό.

6. **Κάνε commit** το migration **μαζί** με το `database/schema.ts` και τον κώδικα, στο ίδιο commit.

### Ροή: αλλαγή σε υπάρχοντα πίνακα

Παράδειγμα: στήλη `phone` στους χρήστες.

```bash
npm run ace -w api -- make:migration users --alter
```

Φτιάχνει το `database/migrations/<timestamp>_alter_users_table.ts`, έτοιμο με `alterTable('users', ...)`:

```ts
async up() {
  this.schema.alterTable(this.tableName, (table) => {
    table.string('phone', 30).nullable()
  })
}

async down() {
  this.schema.alterTable(this.tableName, (table) => {
    table.dropColumn('phone')
  })
}
```

Μετά `migration:run`, και ενημερώνεις όπου χρειάζεται validators, transformers και tests.

### Χρήσιμες μέθοδοι

Μέσα στο `createTable` / `alterTable` (είναι του [Knex](https://knexjs.org/guide/schema-builder.html)):

| Μέθοδος | Τύπος PostgreSQL |
| --- | --- |
| `table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))` | `uuid` primary key. **Έτσι γράφονται όλα τα ids** |
| `table.string('name', 200)` | `varchar(200)` |
| `table.text('notes')` | `text` |
| `table.integer('count')` | `integer` |
| `table.boolean('is_active').defaultTo(true)` | `boolean` |
| `table.timestamp('created_at', { useTz: true })` | `timestamptz` (χρησιμοποίησε πάντα `useTz`) |
| `table.enu('status', ['a', 'b'], { useNative: true, enumName: 'x_status' })` | enum |
| `table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')` | foreign key (UUID, όπως τα ids) |
| `table.specificType('location', 'geometry(Point, 4326)')` | Ό,τι δεν έχει έτοιμη μέθοδο (π.χ. PostGIS) |
| `this.schema.raw('...')` | Οποιοδήποτε SQL (extensions, indexes, views) |

### Κανόνες

- **Μην αλλάζεις ποτέ migration που έχει ήδη τρέξει** σε άλλη βάση ή έχει γίνει push. Όποιος το έχει ήδη τρέξει δεν θα πάρει την αλλαγή. Για διόρθωση φτιάχνεις **νέο** migration.
  - Εξαίρεση: ένα migration που υπάρχει μόνο στο δικό σου μηχάνημα. Κάνε `migration:rollback`, διόρθωσέ το, και ξανά `migration:run`.
- **Ένα migration ανά λογική αλλαγή.**
- **Το `down` πρέπει να δουλεύει.** Αν κάτι δεν αναιρείται, γράψε το ρητά σε σχόλιο, όπως στο `enable_postgis`.
- **Μετονομασία στήλης:** `table.renameColumn('old', 'new')`, όχι drop και add, για να μη χαθούν δεδομένα.
- **Νέα υποχρεωτική στήλη σε πίνακα με δεδομένα:** δώσε `defaultTo(...)`, ή φτιάξ' τη πρώτα `nullable`, γέμισέ τη, και μετά κάν' τη `notNullable` σε επόμενο migration.
- **Μην κάνεις αλλαγές στο schema με το χέρι** (π.χ. από `psql` ή DBeaver). Το `schema.ts` παράγεται από τη βάση, οπότε θα πάρει τη χειροκίνητη αλλαγή, ενώ οι άλλοι δεν θα την έχουν.

### Σε production

Τα migrations δεν τρέχουν αυτόματα. Στο deploy τρέχεις, **πριν** ξεκινήσει η νέα έκδοση, με τα στοιχεία της production βάσης στο environment:

```bash
node ace migration:run --force
```

Το `--force` απαιτείται όταν `NODE_ENV=production`, ως προστασία από κατά λάθος εκτέλεση. Πάρε πάντα backup πριν από migration σε production.

## Γεωχωρικά δεδομένα (PostGIS)

Το PostGIS είναι ενεργό (migration `enable_postgis`), αλλά δεν υπάρχει ακόμα γεωχωρικός πίνακας. Το Lucid δεν έχει έτοιμο τύπο geometry, οπότε ένας τέτοιος πίνακας χρειάζεται τρία πράγματα.

### 1. Στο migration: η στήλη και το index

```ts
table.specificType('location', 'geometry(Point, 4326)').notNullable()
// ...μετά το createTable:
this.schema.raw('CREATE INDEX places_location_gist ON places USING gist (location)')
```

- **`geometry(Point, 4326)`**: μόνο σημεία, σε **SRID 4326** (WGS84, συντεταγμένες GPS σε μοίρες). Άλλα είδη: `LineString`, `Polygon`, `MultiPolygon`. Για ΕΓΣΑ87 το SRID είναι `2100`.
- **GiST index**: απαραίτητο για γρήγορα χωρικά queries.

### 2. Στο model: μετατροπή από και προς GeoJSON

Η PostgreSQL επιστρέφει τις στήλες geometry σε δυαδική μορφή (hex EWKB), όχι σε GeoJSON. Δύο τρόποι:

- **Ανάγνωση με `ST_AsGeoJSON`** στο query: `Place.query().select('*', db.raw('ST_AsGeoJSON(location)::json AS location'))`. Είναι ο πιο απλός τρόπος και δουλεύει για κάθε είδος γεωμετρίας.
- **Custom στήλη** με `prepare` / `consume` στο `@column(...)`, που μετατρέπει αυτόματα σε κάθε ανάγνωση και εγγραφή. Για την εγγραφή, το PostGIS δέχεται απευθείας κείμενο EWKT (`SRID=4326;POINT(23.64 37.94)`). Υλοποίηση για Point υπάρχει στο ιστορικό του git (commit `50cedd4`, `apps/api/app/decorators/point_column.ts`).

Εξαίρεσε τη στήλη από το παραγόμενο schema (`skipColumns: ['location']` στο `schema_rules.ts`) και δήλωσέ τη στο model.

> [!WARNING]
> Στο GeoJSON η σειρά είναι **πρώτα longitude, μετά latitude** (`[lon, lat]`). Είναι το πιο συνηθισμένο λάθος: αν τα αντιστρέψεις, ο Πειραιάς βρίσκεται στην Αιθιοπία.

### 3. Στα queries: συναρτήσεις PostGIS

Γράφονται με `whereRaw` / `orderByRaw`, καλύτερα μέσα σε **scope** του model:

```ts
const POINT = 'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography'

static withinRadius = scope((query, { lat, lon, radius }: { lat: number; lon: number; radius: number }) => {
  query
    .whereRaw(`ST_DWithin(location::geography, ${POINT}, ?)`, [lon, lat, radius])
    .orderByRaw(`ST_Distance(location::geography, ${POINT})`, [lon, lat])
})
```

- **`::geography`** κάνει τις αποστάσεις σε **μέτρα**. Χωρίς αυτό, σε SRID 4326 οι αποστάσεις είναι σε μοίρες.
- **Τιμές πάντα με `?`** και πίνακα τιμών, ποτέ με string concatenation, για προστασία από SQL injection.
- **`ST_DWithin`** χρησιμοποιεί το spatial index. Μην το αντικαθιστάς με `ST_Distance(...) < radius` στο `WHERE`, που δεν το χρησιμοποιεί.

| Συνάρτηση | Τι κάνει |
| --- | --- |
| `ST_DWithin(a, b, d)` | Είναι το `a` σε απόσταση έως `d` από το `b`; |
| `ST_Distance(a, b)` | Απόσταση μεταξύ `a` και `b` |
| `ST_Intersects(a, b)` | Τέμνονται; (π.χ. σημείο μέσα σε πολύγωνο δήμου) |
| `ST_Contains(a, b)` | Περιέχει το `a` ολόκληρο το `b`; |
| `ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)` | Ορθογώνιο από bounding box (π.χ. η περιοχή που φαίνεται στον χάρτη) |
| `ST_Transform(geom, srid)` | Μετατροπή σε άλλο σύστημα συντεταγμένων |
| `ST_AsGeoJSON(geom)` | Γεωμετρία σε GeoJSON |

## Το τρέχον schema

Όλα τα ids είναι UUID, με default `gen_random_uuid()`, και όλες οι ημερομηνίες `timestamptz`. Ενημέρωνε αυτούς τους πίνακες όταν προσθέτεις πίνακα.

### `public`

| Πίνακας | Model | Τι κρατάει |
| --- | --- | --- |
| `users` | `User` | Χρήστες: όνομα, email (μοναδικό), hash κωδικού (scrypt), `type`, γλώσσα, 2FA (κρυπτογραφημένο από την εφαρμογή) |
| `organizations` | `Organization` | Οι πελάτες (tenants): όνομα, κατάσταση (`active`/`suspended`), γλώσσα, ζώνη ώρας, στοιχεία τιμολόγησης (επωνυμία, ΑΦΜ, ΔΟΥ, διεύθυνση), Stripe customer |
| `organization_members` | `OrganizationMember` | Ποιος χρήστης ανήκει σε ποιον οργανισμό, με **ρόλο** (`admin` = Tenant Admin, `member`, `guest`) και κατάσταση. Μία φορά ανά οργανισμό. Σχέσεις `user.organizations` / `organization.users` (με `pivot_role`) |
| — | — | **Προσκλήσεις:** δεν έχουν πίνακα. Γίνονται με signed URL (`router.urlBuilder.signedUrlFor`, έλεγχος με `request.hasValidSignature()`), που περιέχει οργανισμό, email και ρόλο, με λήξη. Δεν μπορούν να ακυρωθούν πριν λήξουν, και δεν υπάρχει λίστα εκκρεμών προσκλήσεων |
| `auth_access_tokens` | — | Τα access tokens (μόνο το hash τους), με λήξη. Βλ. [AUTH.md](AUTH.md) |
| `files` | `File` | Τα αρχεία στο S3: ιδιοκτήτης (`owner_id`: χρήστης **ή** οργανισμός, χωρίς foreign key), ποιος το ανέβασε (`uploaded_by`), και πολυμορφική σύνδεση (`attachable_*`). Βλ. [STORAGE.md](../infrastructure/STORAGE.md#ο-πίνακας-files-πολυμορφικός) |
| `audit_logs` | `AuditLog` | Ποιος έκανε τι, σε ποια εγγραφή, πότε και από πού. Μόνο προσθήκες. Βλ. [AUDIT.md](AUDIT.md) |

### `geocoding`

| Πίνακας | Model | Τι κρατάει |
| --- | --- | --- |
| `geocoding_plans` | `GeocodingPlan` | Τα πακέτα του API: `code`, όνομα, μηνιαία τιμή (χωρίς ΦΠΑ), κλήσεις ανά μήνα και ανά δευτερόλεπτο (`NULL` = χωρίς όριο), αν μπορεί να το διαλέξει νέος πελάτης (`is_active`). Ένα πακέτο με συνδρομητές **δεν αλλάζει**: φτιάχνεις νέο και απενεργοποιείς το παλιό |
| `geocoding_subscriptions` | `GeocodingSubscription` | Η συνδρομή ενός οργανισμού στο API: πακέτο, `starts_at`, `ends_at` (`NULL` = ενεργή). **Το πολύ μία ενεργή ανά οργανισμό**: για αλλαγή πακέτου, η τρέχουσα παίρνει `ends_at` και φτιάχνεται νέα |
| `geocoding_api_keys` | `GeocodingApiKey` | Τα κλειδιά: όνομα, production/test, ορατό πρόθεμα, hash, περιορισμοί domain και IP, λήξη, ανάκληση |
| `geocoding_api_usage` | `GeocodingApiUsage` | Μία εγγραφή ανά κλήση: endpoint, status, χρόνος, αποτελέσματα, αν χρεώνεται. **Όχι** η διεύθυνση που αναζητήθηκε |
| `geocoding_api_usage_daily` | `GeocodingApiUsageDaily` | Πόσες κλήσεις έκανε κάθε οργανισμός κάθε μέρα. Μία γραμμή ανά οργανισμό και μέρα. Για γραφήματα και ποσόστωση χωρίς μέτρημα του `api_usage` |
| `geocoding_api_usage_monthly` | `GeocodingApiUsageMonthly` | Πόσες κλήσεις έκανε κάθε οργανισμός κάθε μήνα (`period` = `YYYY-MM`). Μία γραμμή ανά οργανισμό και μήνα. Συγκρίνεται με το `monthly_quota` του πακέτου για να δούμε αν ξεπεράστηκε το όριο |

Το `api_usage` θα μεγαλώνει γρήγορα (ένας πελάτης Pro: έως 500.000 εγγραφές τον μήνα). Όταν χρειαστεί, γίνεται **partitioned ανά μήνα** (PostgreSQL declarative partitioning), ώστε τα παλιά δεδομένα να σβήνονται ανά μήνα.

### Συστήματος

| Πίνακας | Τι κρατάει |
| --- | --- |
| `adonis_schema`, `adonis_schema_versions` | Ποια migrations έχουν τρέξει. Μην τα αλλάζεις με το χέρι |
| `spatial_ref_sys` | Τα συστήματα συντεταγμένων του PostGIS. Μην τον αλλάζεις |

Extensions: `postgis` (από το migration [enable_postgis](../../apps/api/database/migrations/1761885935000_enable_postgis.ts)). Το docker image προσθέτει επίσης `postgis_topology`, `postgis_tiger_geocoder` και `fuzzystrmatch`. Γι' αυτό το `down` του `enable_postgis` δεν σβήνει το PostGIS: τα άλλα extensions εξαρτώνται από αυτό.

## Συχνά προβλήματα

| Μήνυμα | Αιτία και λύση |
| --- | --- |
| `addQueryContext is not a function` | Παλιό Node (24.0.0). Αναβάθμισε σε Node 24.22 ή νεότερο (`nvm install 24`) |
| `ECONNREFUSED` ή `connect ... 5432` | Δεν τρέχει η βάση, ή το `DB_PORT` δεν ταιριάζει με το `POSTGRES_PORT`. Τρέξε `docker compose up -d postgres` και έλεγξε τα δύο `.env` |
| `password authentication failed` | Λάθος `DB_USER` ή `DB_PASSWORD`. Αν άλλαξες τον κωδικό στο root `.env` **αφού** είχε δημιουργηθεί η βάση, δεν εφαρμόζεται: ο κωδικός ορίζεται μόνο την πρώτη φορά |
| `type "..." already exists` | Το `migration:fresh` χωρίς `--drop-types`. Ξανατρέξ' το με `--drop-types` |
| `type "geometry" does not exist` | Δεν έχει τρέξει το `enable_postgis`. Τρέξε `migration:run` |
| `Cannot define "x" on "Y" model, since it is not defined as a model property` | Η στήλη λείπει από το `database/schema.ts`. Τρέξε `migration:run` ή `ace schema:generate`, και έλεγξε το `schema_rules.ts` |
| `Cannot read properties of undefined (reading 'name')` στο `start/routes.ts` | Νέος controller που δεν έχει μπει ακόμα στο παραγόμενο index. Τρέξε `npm run build -w api` |

### Reset τοπικής βάσης

Σβήνει **όλα** τα δεδομένα της εφαρμογής και ξαναφτιάχνει τους πίνακες από τα migrations. Δεν επηρεάζει Nominatim και Photon.

```bash
npm run ace -w api -- migration:fresh --drop-types
```
