# Βάση δεδομένων

Το backend (`apps/api`) χρησιμοποιεί **PostgreSQL 18 με PostGIS 3.6**, μέσω του ORM [TypeORM](https://typeorm.io) 1.x (`@nestjs/typeorm`). Η βάση τρέχει τοπικά στο Docker (βλ. [DOCKER.md](../infrastructure/DOCKER.md)).

Το schema αλλάζει **μόνο με migrations**. Το `synchronize` του TypeORM είναι κλειστό, οπότε τα entities δεν αλλάζουν ποτέ αυτόματα τη βάση.

## Περιεχόμενα

- [Σύνδεση](#σύνδεση)
- [Αρχεία](#αρχεία)
- [Entities](#entities)
- [Migrations](#migrations)
- [Γεωχωρικά δεδομένα (PostGIS)](#γεωχωρικά-δεδομένα-postgis)
- [Το τρέχον schema](#το-τρέχον-schema)
- [Συχνά προβλήματα](#συχνά-προβλήματα)

## Σύνδεση

Τα στοιχεία σύνδεσης είναι στο `apps/api/.env`, που φτιάχνεις από το [.env.example](../../apps/api/.env.example):

```bash
cp apps/api/.env.example apps/api/.env
```

| Μεταβλητή     | Default       | Τι ορίζει        |
| ------------- | ------------- | ---------------- |
| `DB_HOST`     | `localhost`   | Host της βάσης   |
| `DB_PORT`     | `5432`        | Port της βάσης   |
| `DB_USER`     | `geoplatform` | Χρήστης          |
| `DB_PASSWORD` | `geoplatform` | Κωδικός          |
| `DB_NAME`     | `geoplatform` | Όνομα βάσης      |

> [!IMPORTANT]
> Το `DB_PORT` πρέπει να είναι ίδιο με το `POSTGRES_PORT` του root `.env` (αυτό που χρησιμοποιεί το Docker). Αν άλλαξες το port του Docker, π.χ. σε `5434` επειδή το `5432` ήταν πιασμένο, άλλαξέ το και εδώ.

Το `.env` δεν μπαίνει στο git. Το `.env.example` μπαίνει και πρέπει να ενημερώνεται όταν προστίθεται νέα μεταβλητή.

Για να μπεις στη βάση με `psql`:

```bash
docker compose exec postgres psql -U geoplatform
```

Χρήσιμες εντολές μέσα στο `psql`: `\dt` (πίνακες), `\d places` (δομή ενός πίνακα), `\q` (έξοδος).

## Αρχεία

| Αρχείο | Τι κάνει |
| --- | --- |
| [database.config.ts](../../apps/api/src/database/database.config.ts) | Οι ρυθμίσεις του TypeORM: σύνδεση, λίστα entities, πού βρίσκονται τα migrations. Τις χρησιμοποιούν **και** η εφαρμογή **και** το CLI, ώστε να μη διαφέρουν ποτέ |
| [data-source.ts](../../apps/api/src/data-source.ts) | Σημείο εισόδου του TypeORM CLI. Διαβάζει το `.env` και φτιάχνει το `DataSource` |
| [app.module.ts](../../apps/api/src/app.module.ts) | Συνδέει το TypeORM στο Nest (`TypeOrmModule.forRootAsync`) |
| [src/migrations/](../../apps/api/src/migrations/) | Τα migrations, δηλαδή το ιστορικό αλλαγών του schema |
| `src/<module>/*.entity.ts` | Τα entities, ένα αρχείο ανά πίνακα, μέσα στο module που τον χρησιμοποιεί |

## Entities

Ένα entity είναι μια κλάση που περιγράφει έναν πίνακα. Παράδειγμα, το [place.entity.ts](../../apps/api/src/places/place.entity.ts):

```ts
@Entity('places')
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index({ spatial: true })
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location: Point;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
```

Κανόνες:

- **Όνομα πίνακα** στο `@Entity('...')`: πληθυντικός, `snake_case` (π.χ. `places`, `place_categories`).
- **Δήλωνε πάντα τον τύπο** της στήλης (`type: 'varchar'`, `'integer'`, `'timestamptz'` κ.λπ.). Το TypeORM δεν μαντεύει τον τύπο σωστά σε όλες τις περιπτώσεις, και το migration βγαίνει ακριβώς όπως το θέλεις.
- **Ημερομηνίες:** `timestamptz` (με ζώνη ώρας), όχι `timestamp`.
- **IDs:** `@PrimaryGeneratedColumn('uuid')`. Τα UUID παράγονται από το `gen_random_uuid()` της PostgreSQL (ρύθμιση `uuidExtension: 'pgcrypto'`), χωρίς επιπλέον extension.

> [!IMPORTANT]
> Κάθε νέο entity πρέπει να προστεθεί σε **δύο** σημεία:
>
> 1. Στη λίστα `entities` του [database.config.ts](../../apps/api/src/database/database.config.ts), για να το βλέπουν η εφαρμογή και το CLI των migrations.
> 2. Στο `TypeOrmModule.forFeature([...])` του module του, για να μπορείς να κάνεις `@InjectRepository(...)`.
>
> Αν ξεχάσεις το πρώτο, το `migration:generate` δεν θα δει τον πίνακα.

## Migrations

Ένα migration είναι ένα αρχείο με δύο συναρτήσεις:

- **`up`**: εφαρμόζει την αλλαγή (π.χ. `CREATE TABLE`).
- **`down`**: την αναιρεί (π.χ. `DROP TABLE`).

Η PostgreSQL κρατάει στον πίνακα `migrations` ποια έχουν ήδη τρέξει, οπότε το `migration:run` εφαρμόζει μόνο τα καινούργια, με τη σειρά. Έτσι κάθε βάση (η δική σου, των συναδέλφων, η production) φτάνει στο ίδιο schema με τα ίδια βήματα, και κάθε αλλαγή φαίνεται στο git.

Το όνομα κάθε αρχείου ξεκινάει με timestamp (π.χ. `1792054036084-CreatePlaces.ts`), που ορίζει τη σειρά εκτέλεσης.

### Εντολές

Όλες τρέχουν από το root του repo:

| Εντολή | Τι κάνει |
| --- | --- |
| `pnpm --filter api migration:run` | Εφαρμόζει όσα migrations δεν έχουν τρέξει ακόμα |
| `pnpm --filter api migration:show` | Λίστα όλων: `[X]` = έχει τρέξει, `[ ]` = εκκρεμεί |
| `pnpm --filter api migration:revert` | Αναιρεί το **τελευταίο** migration (τρέχει το `down` του). Ξανατρέξ' το για να αναιρέσεις και το προηγούμενο |
| `pnpm --filter api migration:generate src/migrations/<Όνομα>` | Συγκρίνει τα entities με τη βάση και γράφει migration με τις διαφορές |
| `pnpm --filter api migration:create src/migrations/<Όνομα>` | Φτιάχνει άδειο migration, για SQL που γράφεις με το χέρι |

Το `<Όνομα>` είναι σε PascalCase και περιγράφει την αλλαγή: `CreatePlaces`, `AddCategoryToPlaces`, `DropLegacyTable`.

> [!NOTE]
> Τα migrations γράφονται σε TypeScript στο `src/migrations/`, αλλά το CLI τρέχει τον compiled κώδικα στο `dist/`. Γι' αυτό οι εντολές κάνουν πρώτα `nest build`, κάτι που προσθέτει λίγα δευτερόλεπτα. Η επίσημη εναλλακτική του TypeORM (ts-node) δεν δουλεύει αξιόπιστα με TypeScript 6 και ESM.

### Ροή: αλλαγή στο schema

Παράδειγμα: προσθέτουμε στήλη `category` στα places.

1. **Άλλαξε το entity** στο `place.entity.ts`:

   ```ts
   @Column({ type: 'varchar', length: 50, nullable: true })
   category: string | null;
   ```

2. **Φτιάξε το migration:**

   ```bash
   pnpm --filter api migration:generate src/migrations/AddCategoryToPlaces
   ```

3. **Διάβασε το αρχείο που δημιουργήθηκε** στο `src/migrations/`. Βεβαιώσου ότι κάνει μόνο αυτό που περιμένεις, και ότι το `down` αναιρεί σωστά το `up`.

4. **Εφάρμοσέ το:**

   ```bash
   pnpm --filter api migration:run
   ```

5. **Έλεγξε** ότι το `migration:revert` και μετά ξανά το `migration:run` δουλεύουν. Έτσι επιβεβαιώνεις ότι το `down` είναι σωστό.

6. **Κάνε commit** το entity **μαζί** με το migration, στο ίδιο commit.

### Ροή: χειροκίνητο migration

Για ό,τι δεν εκφράζεται με entity, φτιάξε άδειο migration και γράψε SQL. Τέτοιες περιπτώσεις είναι extensions, views, triggers, αλλαγές δεδομένων και σύνθετα indexes.

```bash
pnpm --filter api migration:create src/migrations/EnablePostgis
```

Παράδειγμα, το [EnablePostgis](../../apps/api/src/migrations/1792053991785-EnablePostgis.ts):

```ts
export class EnablePostgis1792053991785 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP EXTENSION IF EXISTS postgis');
  }
}
```

### Κανόνες

- **Μην αλλάζεις ποτέ migration που έχει ήδη τρέξει** σε άλλη βάση ή έχει γίνει push. Όποιος το έχει ήδη τρέξει δεν θα πάρει την αλλαγή, γιατί η βάση του το έχει σημειώσει ως εκτελεσμένο. Για διόρθωση φτιάχνεις **νέο** migration.
  - Εξαίρεση: ένα migration που υπάρχει μόνο στο δικό σου μηχάνημα. Κάνε `migration:revert`, σβήσε το αρχείο, διόρθωσε το entity και ξαναφτιάξ' το.
- **Ένα migration ανά λογική αλλαγή.** Όχι πολλές άσχετες αλλαγές στο ίδιο αρχείο.
- **Το `down` πρέπει να δουλεύει.** Αν μια αλλαγή δεν αναιρείται (π.χ. σβήσιμο δεδομένων), γράψε το ρητά σε σχόλιο στο `down`.
- **Πρόσεχε τις αλλαγές που χάνουν δεδομένα.** Το TypeORM, όταν μετονομάζεις στήλη, κάνει `DROP` και `ADD` και χάνονται τα δεδομένα. Σε μετονομασία, άλλαξε χειροκίνητα το παραγόμενο migration σε `ALTER TABLE ... RENAME COLUMN ...`.
- **Νέα υποχρεωτική στήλη σε πίνακα με δεδομένα:** δώσε `default`, ή φτιάξ' τη πρώτα `nullable`, γέμισέ τη με δεδομένα, και μετά κάν' τη `NOT NULL` σε επόμενο migration.
- **Μην κάνεις αλλαγές στο schema με το χέρι** (π.χ. από `psql` ή DBeaver). Θα διαφέρει η βάση σου από τα migrations, και το επόμενο `migration:generate` θα βγάλει περίεργα αποτελέσματα.

### Σε production

Τα migrations **δεν** τρέχουν αυτόματα όταν ξεκινάει η εφαρμογή (`migrationsRun` είναι κλειστό). Στο deploy τρέχεις `migration:run` **πριν** ξεκινήσει η νέα έκδοση του api, με τα στοιχεία της production βάσης στο environment:

```bash
pnpm --filter api migration:run
```

Έτσι, αν ένα migration αποτύχει, το deploy σταματάει πριν τρέξει κώδικας που περιμένει το νέο schema. Πάρε πάντα backup πριν από migration σε production.

## Γεωχωρικά δεδομένα (PostGIS)

### Στήλες

```ts
@Index({ spatial: true })
@Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
location: Point; // type από το πακέτο 'geojson'
```

- **`spatialFeatureType`**: το είδος της γεωμετρίας: `Point`, `LineString`, `Polygon`, `MultiPolygon` κ.λπ. Δήλωνέ το πάντα, ώστε η βάση να απορρίπτει λάθος είδη.
- **`srid: 4326`**: WGS84, δηλαδή συντεταγμένες GPS σε μοίρες. Χρησιμοποίησε αυτό, εκτός αν υπάρχει λόγος για άλλο σύστημα (π.χ. ΕΓΣΑ87, `2100`).
- **`@Index({ spatial: true })`**: φτιάχνει GiST index, απαραίτητο για γρήγορα χωρικά queries. Βάλ' το σε κάθε στήλη geometry που χρησιμοποιείται σε αναζητήσεις.

Το TypeORM διαβάζει και γράφει τις στήλες ως **GeoJSON**:

```json
{ "type": "Point", "coordinates": [23.6470, 37.9431] }
```

> [!WARNING]
> Στο GeoJSON η σειρά είναι **πρώτα longitude, μετά latitude** (`[lon, lat]`). Είναι το πιο συνηθισμένο λάθος: αν τα αντιστρέψεις, ο Πειραιάς βρίσκεται στην Αιθιοπία.

### Χωρικά queries

Οι συναρτήσεις του PostGIS (`ST_*`) γράφονται σε QueryBuilder. Παράδειγμα από το [places.service.ts](../../apps/api/src/places/places.service.ts): σημεία σε ακτίνα μέτρων, τα πιο κοντινά πρώτα:

```ts
const point = 'ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography';
return this.places
  .createQueryBuilder('place')
  .where(`ST_DWithin(place.location::geography, ${point}, :radius)`)
  .orderBy(`ST_Distance(place.location::geography, ${point})`)
  .setParameters({ lat, lon, radius })
  .getMany();
```

- **`::geography`** κάνει τις αποστάσεις σε **μέτρα**. Χωρίς αυτό, σε SRID 4326 οι αποστάσεις είναι σε μοίρες, που δεν σημαίνουν κάτι πρακτικά.
- **Τιμές πάντα ως parameters** (`:lat`, `:radius`), ποτέ με string concatenation, για προστασία από SQL injection.
- **`ST_DWithin`** χρησιμοποιεί το spatial index, οπότε είναι γρήγορο. Μην το αντικαθιστάς με `ST_Distance(...) < radius` στο `WHERE`, που δεν χρησιμοποιεί index.

Χρήσιμες συναρτήσεις:

| Συνάρτηση | Τι κάνει |
| --- | --- |
| `ST_DWithin(a, b, d)` | Είναι το `a` σε απόσταση έως `d` από το `b`; |
| `ST_Distance(a, b)` | Απόσταση μεταξύ `a` και `b` |
| `ST_Intersects(a, b)` | Τέμνονται; (π.χ. σημείο μέσα σε πολύγωνο δήμου) |
| `ST_Contains(a, b)` | Περιέχει το `a` ολόκληρο το `b`; |
| `ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)` | Ορθογώνιο από bounding box (π.χ. η περιοχή που φαίνεται στον χάρτη) |
| `ST_Transform(geom, srid)` | Μετατροπή σε άλλο σύστημα συντεταγμένων |
| `ST_AsGeoJSON(geom)` | Γεωμετρία σε GeoJSON (σε raw queries) |

## Το τρέχον schema

| Πίνακας | Από | Τι κρατάει |
| --- | --- | --- |
| `places` | [CreatePlaces](../../apps/api/src/migrations/1792054036084-CreatePlaces.ts) | Σημεία με όνομα και θέση (`geometry(Point, 4326)`, GiST index) |
| `migrations` | TypeORM | Ποια migrations έχουν τρέξει. Μην το αλλάζεις με το χέρι |

Extensions: `postgis` (από το migration [EnablePostgis](../../apps/api/src/migrations/1792053991785-EnablePostgis.ts)).

Ενημέρωνε αυτόν τον πίνακα όταν προσθέτεις πίνακα.

## Συχνά προβλήματα

| Μήνυμα | Αιτία και λύση |
| --- | --- |
| `ECONNREFUSED` ή `connect ... 5432` | Δεν τρέχει η βάση, ή το `DB_PORT` δεν ταιριάζει με το `POSTGRES_PORT`. Τρέξε `docker compose up -d postgres` και έλεγξε τα δύο `.env` |
| `password authentication failed` | Λάθος `DB_USER` ή `DB_PASSWORD`. Αν άλλαξες τον κωδικό στο root `.env` **αφού** είχε δημιουργηθεί η βάση, δεν εφαρμόζεται: ο κωδικός ορίζεται μόνο την πρώτη φορά |
| `No changes in database schema were found` | Τα entities συμφωνούν ήδη με τη βάση. Αν περίμενες αλλαγές, έλεγξε ότι το entity είναι στη λίστα `entities` του `database.config.ts` |
| `relation "..." already exists` | Ο πίνακας φτιάχτηκε εκτός migrations (π.χ. με το χέρι). Σε τοπική βάση, σβήσε τον πίνακα ή κάνε reset (παρακάτω) |
| `type "geometry" does not exist` | Δεν έχει τρέξει το `EnablePostgis`. Τρέξε `migration:run` |
| `Unable to open file: dist/data-source.js` | Απέτυχε το `nest build`. Διόρθωσε τα σφάλματα TypeScript που εμφανίζει πρώτα |

### Reset τοπικής βάσης

Σβήνει **όλα** τα δεδομένα της τοπικής βάσης και την ξαναφτιάχνει από τα migrations. Δεν επηρεάζει Nominatim και Photon.

```bash
docker compose down postgres
docker volume rm geoplatform_postgres-data
docker compose up -d postgres
pnpm --filter api migration:run
```
