# Βάση δεδομένων

Το backend (`apps/api`) χρησιμοποιεί **PostgreSQL 18 με PostGIS 3.6**, μέσω του [Lucid](https://lucid.adonisjs.com), του ORM του AdonisJS. Η βάση τρέχει τοπικά στο Docker (βλ. [DOCKER.md](../infrastructure/DOCKER.md)).

Το schema αλλάζει **μόνο με migrations**. Μετά από κάθε migration, το Adonis ξαναπαράγει αυτόματα το `database/schema.ts`, δηλαδή τις κλάσεις με τις στήλες κάθε πίνακα, και τα models επεκτείνουν αυτές τις κλάσεις.

## Περιεχόμενα

- [Σύνδεση](#σύνδεση)
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

Χρήσιμες εντολές μέσα στο `psql`: `\dt` (πίνακες), `\d places` (δομή ενός πίνακα), `\q` (έξοδος).

## Αρχεία

| Αρχείο | Τι κάνει |
| --- | --- |
| [config/database.ts](../../apps/api/config/database.ts) | Η σύνδεση και πού βρίσκονται τα migrations |
| [database/migrations/](../../apps/api/database/migrations/) | Τα migrations, δηλαδή το ιστορικό αλλαγών του schema |
| [database/schema.ts](../../apps/api/database/schema.ts) | **Παράγεται αυτόματα** μετά από κάθε migration. Μην το αλλάζεις με το χέρι |
| [database/schema_rules.ts](../../apps/api/database/schema_rules.ts) | Κανόνες για το `schema.ts`: τύποι στηλών, στήλες που εξαιρούνται |
| [app/models/](../../apps/api/app/models/) | Τα models, ένα ανά πίνακα |
| [app/columns/point.ts](../../apps/api/app/columns/point.ts) | Στήλη για PostGIS Point, εκτεθειμένη ως GeoJSON |

## Models και το παραγόμενο schema

Μετά από κάθε `migration:run`, το Adonis διαβάζει τη βάση και γράφει μια κλάση ανά πίνακα στο `database/schema.ts`, π.χ. `PlaceSchema` με όλες τις στήλες. Το model επεκτείνει αυτή την κλάση και προσθέτει μόνο ό,τι δεν παράγεται αυτόματα:

```ts
// app/models/place.ts
export default class Place extends PlaceSchema {
  @pointColumn()
  declare location: Point

  @belongsTo(() => User, { foreignKey: 'createdById' })
  declare createdBy: BelongsTo<typeof User>
}
```

- Τα ονόματα των στηλών στη βάση είναι `snake_case` (`created_by_id`), και στον κώδικα `camelCase` (`createdById`). Η μετατροπή γίνεται αυτόματα.
- Όταν ο παραγόμενος τύπος μιας στήλης δεν είναι σωστός, τον διορθώνεις στο `database/schema_rules.ts`, όχι στο `schema.ts`. Παράδειγμα: ο ρόλος, που είναι enum στη βάση:

  ```ts
  users: {
    columns: {
      role: { tsType: `'admin' | 'user'`, decorators: [{ name: '@column' }] },
    },
  },
  ```

- Για να ξαναπαραχθεί το `schema.ts` χωρίς migration: `pnpm --filter api ace schema:generate`.

> [!NOTE]
> Οι default τιμές της βάσης (π.χ. `role = 'user'`) **δεν** εμφανίζονται στο model μετά από `create()`, γιατί το Lucid δεν ξαναδιαβάζει την εγγραφή. Όπου χρειάζεσαι την τιμή αμέσως, δώσ' τη ρητά, όπως στο signup: `User.create({ ..., role: 'user', isActive: true })`.

## Migrations

Ένα migration είναι ένα αρχείο με δύο μεθόδους:

- **`up`**: εφαρμόζει την αλλαγή (π.χ. `createTable`).
- **`down`**: την αναιρεί (π.χ. `dropTable`).

Ο πίνακας `adonis_schema` κρατάει ποια έχουν τρέξει, οπότε το `migration:run` εφαρμόζει μόνο τα καινούργια, με τη σειρά του ονόματος αρχείου (ξεκινάει με timestamp). Όσα τρέχουν μαζί αποτελούν ένα **batch**, και το `migration:rollback` αναιρεί ολόκληρο το τελευταίο batch.

### Εντολές

Όλες τρέχουν από το root του repo. Μέσα στο `apps/api` γράφεις απευθείας `node ace ...`.

| Εντολή | Τι κάνει |
| --- | --- |
| `pnpm --filter api ace migration:run` | Εφαρμόζει όσα migrations δεν έχουν τρέξει ακόμα |
| `pnpm --filter api ace migration:status` | Λίστα όλων: `completed` ή `pending`, και σε ποιο batch |
| `pnpm --filter api ace migration:rollback` | Αναιρεί το **τελευταίο batch** |
| `pnpm --filter api ace migration:rollback --batch=0` | Αναιρεί **όλα** τα migrations |
| `pnpm --filter api ace make:migration <πίνακας>` | Νέο migration για νέο πίνακα, π.χ. `make:migration categories` → `..._create_categories_table.ts` |
| `pnpm --filter api ace make:migration <πίνακας> --alter` | Νέο migration για αλλαγή σε υπάρχοντα πίνακα → `..._alter_<πίνακας>_table.ts` |
| `pnpm --filter api ace migration:fresh --drop-types` | **Σβήνει όλους τους πίνακες** και τρέχει όλα τα migrations από την αρχή. Μόνο τοπικά |

Το `--drop-types` χρειάζεται επειδή υπάρχει PostgreSQL enum (`user_role`). Χωρίς αυτό, το `migration:fresh` αποτυγχάνει με `type "user_role" already exists`.

### Ροή: αλλαγή στο schema

Το Lucid **δεν** παράγει migrations από τα models: τα γράφεις εσύ, και το model ακολουθεί. Παράδειγμα: στήλη `category` στα places.

1. **Νέο migration:**

   ```bash
   pnpm --filter api ace make:migration places --alter
   ```

   Φτιάχνει το `database/migrations/<timestamp>_alter_places_table.ts`, έτοιμο με `alterTable('places', ...)`.

2. **Γράψε την αλλαγή** στο αρχείο που δημιουργήθηκε:

   ```ts
   async up() {
     this.schema.alterTable(this.tableName, (table) => {
       table.string('category', 50).nullable()
     })
   }

   async down() {
     this.schema.alterTable(this.tableName, (table) => {
       table.dropColumn('category')
     })
   }
   ```

3. **Εφάρμοσέ το:**

   ```bash
   pnpm --filter api ace migration:run
   ```

   Το `database/schema.ts` ενημερώνεται μόνο του, και το `Place` έχει πλέον `category: string | null`.

4. **Έλεγξε** ότι το `migration:rollback` και μετά ξανά το `migration:run` δουλεύουν. Έτσι επιβεβαιώνεις ότι το `down` είναι σωστό.

5. **Πρόσθεσε το πεδίο** όπου χρειάζεται: validator, transformer, tests.

6. **Κάνε commit** το migration **μαζί** με το `database/schema.ts` και τον κώδικα, στο ίδιο commit.

Χρήσιμες μέθοδοι μέσα στο `createTable` / `alterTable` (είναι του [Knex](https://knexjs.org/guide/schema-builder.html)):

| Μέθοδος | Τύπος PostgreSQL |
| --- | --- |
| `table.increments('id')` | `serial` primary key |
| `table.string('name', 200)` | `varchar(200)` |
| `table.text('notes')` | `text` |
| `table.integer('count')` | `integer` |
| `table.boolean('is_active').defaultTo(true)` | `boolean` |
| `table.timestamp('created_at', { useTz: true })` | `timestamptz` (χρησιμοποίησε πάντα `useTz`) |
| `table.enu('role', ['admin', 'user'], { useNative: true, enumName: 'user_role' })` | enum |
| `table.integer('user_id').references('id').inTable('users').onDelete('CASCADE')` | foreign key |
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

Το Lucid δεν έχει έτοιμο τύπο geometry, οπότε το PostGIS χρησιμοποιείται σε τρία σημεία:

### 1. Στο migration: η στήλη και το index

```ts
table.specificType('location', 'geometry(Point, 4326)').notNullable()
// ...
this.schema.raw('CREATE INDEX places_location_gist ON places USING gist (location)')
```

- **`geometry(Point, 4326)`**: μόνο σημεία, σε **SRID 4326** (WGS84, συντεταγμένες GPS σε μοίρες). Άλλα είδη: `LineString`, `Polygon`, `MultiPolygon`.
- **GiST index**: απαραίτητο για γρήγορα χωρικά queries. Βάλ' το σε κάθε στήλη geometry που χρησιμοποιείται σε αναζητήσεις.

### 2. Στο model: η στήλη ως GeoJSON

```ts
@pointColumn()
declare location: Point // type από το πακέτο 'geojson'
```

Το [pointColumn](../../apps/api/app/columns/point.ts) μετατρέπει:

- **κατά την αποθήκευση**, το GeoJSON σε `SRID=4326;POINT(lon lat)`, που το PostGIS δέχεται απευθείας
- **κατά την ανάγνωση**, τη δυαδική μορφή που επιστρέφει η PostgreSQL (hex EWKB) σε GeoJSON

Η στήλη εξαιρείται από το παραγόμενο schema (`skipColumns` στο `schema_rules.ts`) και δηλώνεται στο model. Έτσι στον κώδικα και στο API βλέπεις πάντα:

```json
{ "type": "Point", "coordinates": [23.6470, 37.9431] }
```

> [!WARNING]
> Στο GeoJSON η σειρά είναι **πρώτα longitude, μετά latitude** (`[lon, lat]`). Είναι το πιο συνηθισμένο λάθος: αν τα αντιστρέψεις, ο Πειραιάς βρίσκεται στην Αιθιοπία.

Για άλλα είδη γεωμετρίας (π.χ. Polygon για όρια περιοχών), φτιάξε αντίστοιχη στήλη στο `app/columns/`. Για σύνθετες γεωμετρίες, πιο απλό είναι να διαβάζεις με `ST_AsGeoJSON(...)` στο query αντί να αποκωδικοποιείς τη δυαδική μορφή.

### 3. Στα queries: συναρτήσεις PostGIS

Γράφονται με `whereRaw` / `orderByRaw`, καλύτερα μέσα σε **scope** του model. Παράδειγμα από το [place.ts](../../apps/api/app/models/place.ts):

```ts
const POINT = 'ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography'

static withinRadius = scope((query, { lat, lon, radius }) => {
  query
    .whereRaw(`ST_DWithin(location::geography, ${POINT}, ?)`, [lon, lat, radius])
    .orderByRaw(`ST_Distance(location::geography, ${POINT})`, [lon, lat])
})

// χρήση
await Place.query().withScopes((scopes) => scopes.withinRadius({ lat, lon, radius }))
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
| `ST_Transform(geom, srid)` | Μετατροπή σε άλλο σύστημα συντεταγμένων (π.χ. `2100` για ΕΓΣΑ87) |
| `ST_AsGeoJSON(geom)` | Γεωμετρία σε GeoJSON |

## Το τρέχον schema

| Πίνακας | Migration | Τι κρατάει |
| --- | --- | --- |
| `users` | [create_users_table](../../apps/api/database/migrations/1761885935168_create_users_table.ts) | Χρήστες: email (μοναδικό, πεζά), hash κωδικού (scrypt), ρόλος (`user_role`: `admin` / `user`), ενεργός ή όχι |
| `auth_access_tokens` | [create_access_tokens_table](../../apps/api/database/migrations/1768620764696_create_access_tokens_table.ts) | Τα access tokens (μόνο το hash τους), με λήξη. Σβήνονται μαζί με τον χρήστη. Βλ. [AUTH.md](AUTH.md) |
| `places` | [create_places_table](../../apps/api/database/migrations/1768620764700_create_places_table.ts) | Σημεία: όνομα, θέση (`geometry(Point, 4326)`, GiST index), ιδιοκτήτης (`created_by_id` → `users`, γίνεται `NULL` αν σβηστεί ο χρήστης) |
| `adonis_schema`, `adonis_schema_versions` | Lucid | Ποια migrations έχουν τρέξει. Μην τα αλλάζεις με το χέρι |
| `spatial_ref_sys` | PostGIS | Τα συστήματα συντεταγμένων. Μην τον αλλάζεις |

Extensions: `postgis` (από το migration [enable_postgis](../../apps/api/database/migrations/1761885935000_enable_postgis.ts)). Το docker image προσθέτει επίσης `postgis_topology`, `postgis_tiger_geocoder` και `fuzzystrmatch`. Γι' αυτό το `down` του `enable_postgis` δεν σβήνει το PostGIS: τα άλλα extensions εξαρτώνται από αυτό.

Ενημέρωνε αυτόν τον πίνακα όταν προσθέτεις πίνακα.

## Συχνά προβλήματα

| Μήνυμα | Αιτία και λύση |
| --- | --- |
| `addQueryContext is not a function` | Παλιό Node (24.0.0). Αναβάθμισε σε Node 24.22 ή νεότερο (`nvm install 24`) |
| `ECONNREFUSED` ή `connect ... 5432` | Δεν τρέχει η βάση, ή το `DB_PORT` δεν ταιριάζει με το `POSTGRES_PORT`. Τρέξε `docker compose up -d postgres` και έλεγξε τα δύο `.env` |
| `password authentication failed` | Λάθος `DB_USER` ή `DB_PASSWORD`. Αν άλλαξες τον κωδικό στο root `.env` **αφού** είχε δημιουργηθεί η βάση, δεν εφαρμόζεται: ο κωδικός ορίζεται μόνο την πρώτη φορά |
| `type "user_role" already exists` | Το `migration:fresh` χωρίς `--drop-types`. Ξανατρέξ' το με `--drop-types` |
| `type "geometry" does not exist` | Δεν έχει τρέξει το `enable_postgis`. Τρέξε `migration:run` |
| `Cannot define "x" on "Y" model, since it is not defined as a model property` | Η στήλη λείπει από το `database/schema.ts`. Τρέξε `migration:run` ή `ace schema:generate`, και έλεγξε το `schema_rules.ts` |

### Reset τοπικής βάσης

Σβήνει **όλα** τα δεδομένα της εφαρμογής και ξαναφτιάχνει τους πίνακες από τα migrations. Δεν επηρεάζει Nominatim και Photon.

```bash
pnpm --filter api ace migration:fresh --drop-types
pnpm --filter api ace create:admin <email>
```
