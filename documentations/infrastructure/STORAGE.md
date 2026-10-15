# Αποθήκευση αρχείων (S3)

Τα αρχεία (εικόνες, PDF, γεωδεδομένα) αποθηκεύονται σε **S3-compatible object storage**. Ο κώδικας μιλάει μόνο S3, μέσω του [`@adonisjs/drive`](https://docs.adonisjs.com/guides/digging-deeper/drive), οπότε το ίδιο api δουλεύει με οποιονδήποτε πάροχο. Αλλάζουν μόνο οι μεταβλητές στο `.env`.

| Περιβάλλον | Storage |
| --- | --- |
| Ανάπτυξη (τοπικά) | [RustFS](https://github.com/rustfs/rustfs), στο `docker-compose.yml` |
| Production | Managed S3: AWS S3, Cloudflare R2, Hetzner Object Storage κ.λπ. |

## Γιατί RustFS

Το MinIO, που ήταν η συνηθισμένη επιλογή για τοπικό S3, [σταμάτησε να συντηρείται](https://stormdevelopments.ca/blog/minio-s-community-edition-is-archived-what-still-runs-in-2026/) το 2026 και δεν βγάζει πια docker images. Το RustFS:

- τρέχει σε ένα container, με web console, όπως το MinIO
- έχει άδεια Apache-2.0
- έχει image για Apple Silicon (arm64)

Είναι νέο project (έκδοση 1.0), γι' αυτό το χρησιμοποιούμε μόνο για ανάπτυξη. Για self-hosted production, πιο δοκιμασμένα είναι το [SeaweedFS](https://github.com/seaweedfs/seaweedfs) και το [Garage](https://garagehq.deuxfleurs.fr).

## Τοπικά (RustFS)

```bash
docker compose up -d rustfs-init     # σηκώνει το RustFS και φτιάχνει το bucket
```

| Τι | Πού |
| --- | --- |
| S3 API | http://127.0.0.1:9000 |
| Web console | http://127.0.0.1:9001 (χρήστης και κωδικός: `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` του root `.env`, default `geoplatform` / `geoplatform-secret`) |
| Bucket | `geoplatform` (`RUSTFS_BUCKET`) |

Στο `docker-compose.yml` υπάρχουν τρία services:

| Service | Τι κάνει |
| --- | --- |
| `rustfs` | Ο server. Τα δεδομένα μένουν στο volume `geoplatform_rustfs-data` |
| `rustfs-permissions` | Τρέχει μία φορά πριν το `rustfs` και δίνει το volume στον χρήστη 10001, με τον οποίο τρέχει το RustFS |
| `rustfs-init` | Τρέχει μία φορά αφού γίνει healthy το `rustfs`, και φτιάχνει το bucket αν δεν υπάρχει. Μπορεί να ξανατρέξει χωρίς πρόβλημα |

Με το `docker compose up -d` σηκώνονται όλα μαζί με τις υπόλοιπες υπηρεσίες.

### Εντολές με το AWS CLI

Το image του `rustfs-init` έχει μέσα το AWS CLI, οπότε μπορείς να το χρησιμοποιήσεις χωρίς εγκατάσταση:

```bash
# όλα τα αρχεία του bucket
docker compose run --rm --entrypoint aws \
  -e AWS_ACCESS_KEY_ID=geoplatform -e AWS_SECRET_ACCESS_KEY=geoplatform-secret -e AWS_DEFAULT_REGION=us-east-1 \
  rustfs-init --endpoint-url http://rustfs:9000 s3 ls s3://geoplatform --recursive
```

Για τα ίδια, πιο εύκολα, υπάρχει το web console.

## Ρυθμίσεις

**Root `.env`** (Docker):

| Μεταβλητή | Default | Τι ορίζει |
| --- | --- | --- |
| `RUSTFS_ACCESS_KEY` | `geoplatform` | Access key (και χρήστης του console) |
| `RUSTFS_SECRET_KEY` | `geoplatform-secret` | Secret key (και κωδικός του console). Τουλάχιστον 8 χαρακτήρες |
| `RUSTFS_BUCKET` | `geoplatform` | Το bucket που φτιάχνει το `rustfs-init` |
| `RUSTFS_PORT` | `9000` | Port του S3 API στο host |
| `RUSTFS_CONSOLE_PORT` | `9001` | Port του web console στο host |

**`apps/api/.env`** (api):

| Μεταβλητή | Τοπικά | Τι ορίζει |
| --- | --- | --- |
| `DRIVE_DISK` | `s3` | Ποιο storage χρησιμοποιεί το api |
| `AWS_ACCESS_KEY_ID` | `geoplatform` | Ίδιο με το `RUSTFS_ACCESS_KEY` |
| `AWS_SECRET_ACCESS_KEY` | `geoplatform-secret` | Ίδιο με το `RUSTFS_SECRET_KEY` |
| `AWS_REGION` | `us-east-1` | Region. Το RustFS το αγνοεί, αλλά το SDK το θέλει |
| `S3_BUCKET` | `geoplatform` | Ίδιο με το `RUSTFS_BUCKET` |
| `S3_ENDPOINT` | `http://127.0.0.1:9000` | Μόνο για S3-compatible storage. Για AWS S3 το αφήνεις κενό |

Όταν υπάρχει `S3_ENDPOINT`, το api χρησιμοποιεί αυτόματα URLs της μορφής `http://host/bucket/key` (path-style), που περιμένουν το RustFS και οι περισσότεροι S3-compatible πάροχοι.

### Σε production

Αλλάζουν μόνο οι μεταβλητές του `apps/api/.env`. Παραδείγματα:

```bash
# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
S3_BUCKET=geoplatform-prod
# S3_ENDPOINT κενό

# Cloudflare R2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=auto
S3_BUCKET=geoplatform-prod
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

Το bucket πρέπει να είναι **ιδιωτικό**. Τα κλειδιά να έχουν δικαιώματα μόνο στο συγκεκριμένο bucket.

## Πώς χρησιμοποιείται στο api

Κάθε αρχείο υπάρχει σε **δύο σημεία**:

- **στο S3**, το ίδιο το περιεχόμενο, στο `uploads/<id χρήστη>/<uuid>.<κατάληξη>`
- **στη βάση**, μια εγγραφή στον πίνακα `files`: ποιος είναι ο ιδιοκτήτης, το αρχικό όνομα, ο τύπος, το μέγεθος, και σε τι είναι συνδεδεμένο

Η λίστα «τα αρχεία μου» βγαίνει από τη βάση, όχι από το S3, γιατί έτσι έχει το αρχικό όνομα και σελίδες.

Τα αρχεία είναι **ιδιωτικά**: δεν διαβάζονται με απλό URL (`403`). Ο client τα κατεβάζει με **signed URL**, δηλαδή προσωρινό σύνδεσμο που ισχύει 1 ώρα και τον δίνει το api.

### Endpoints

Όλα θέλουν login (Bearer token) και αφορούν **μόνο αρχεία του συνδεδεμένου χρήστη**. Για αρχείο άλλου χρήστη απαντούν `404`, σαν να μην υπάρχει.

| Method | Path | Τι κάνει |
| --- | --- | --- |
| `GET` | `/api/v1/files?page=1&perPage=20` | Τα αρχεία μου, νεότερα πρώτα, σε σελίδες (`perPage` έως 100) |
| `POST` | `/api/v1/files` | Ανέβασμα (multipart, πεδίο `file`). Επιστρέφει το αρχείο και `url` |
| `GET` | `/api/v1/files/:id` | Ένα αρχείο μου, με νέο `url` |
| `DELETE` | `/api/v1/files/:id` | Διαγραφή από το S3 **και** από τη βάση (`204`) |

```bash
curl -X POST http://localhost:3333/api/v1/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@port.geojson"
```

```json
{
  "data": {
    "file": {
      "id": "b47684da-b404-48e3-b7a6-c5759ed9f03c",
      "name": "port.geojson",
      "mimeType": "application/geo+json",
      "size": 45,
      "ownerId": "19753223-0a9f-471c-a0c9-e7d3648ae5e3",
      "attachableType": null,
      "attachableId": null,
      "createdAt": "2026-10-15T12:15:00.137+00:00",
      "updatedAt": "2026-10-15T12:15:00.137+00:00"
    },
    "url": "http://127.0.0.1:9000/geoplatform/uploads/1975.../354c...geojson?X-Amz-Algorithm=..."
  }
}
```

Η λίστα επιστρέφει τα αρχεία στο `data` και τις σελίδες στο `metadata`:

```json
{
  "data": [{ "id": "b476...", "name": "port.geojson", "...": "..." }],
  "metadata": { "total": 1, "perPage": 20, "currentPage": 1, "lastPage": 1, "firstPage": 1, "nextPageUrl": null, "previousPageUrl": null }
}
```

- **Όρια:** έως 20 MB, και μόνο οι καταλήξεις `jpg`, `jpeg`, `png`, `webp`, `pdf`, `csv`, `json`, `geojson`, `kml`, `gpx`, `zip`, `tif`, `tiff`. Αλλιώς `422`. Η λίστα, μαζί με τον MIME type κάθε κατάληξης, είναι στο [app/validators/file.ts](../../apps/api/app/validators/file.ts).
- **Ο MIME type βγαίνει από την κατάληξη,** όχι από ό,τι δηλώνει ο client.
- **Το key στο S3 δεν περιέχει το αρχικό όνομα,** για να μη συγκρούονται αρχεία με το ίδιο όνομα και για να μη μπορεί να μαντέψει κανείς keys. Το key δεν επιστρέφεται στον client. Ο client χρησιμοποιεί το `id`.
- **Κράτα το `id`, όχι το `url`:** το `url` λήγει. Όποτε χρειάζεσαι νέο, `GET /api/v1/files/:id`.
- **Διαγραφή:** σβήνει πρώτα το αντικείμενο από το S3 και μετά την εγγραφή. Αν αποτύχει το S3, δεν σβήνεται τίποτα, οπότε δεν μένει ποτέ εγγραφή που δείχνει σε αρχείο που λείπει. Αντίστοιχα, αν αποτύχει η εγγραφή μετά από upload, το αρχείο σβήνεται από το S3.

### Ο πίνακας `files` (πολυμορφικός)

| Στήλη | Τι κρατάει |
| --- | --- |
| `id` | UUID |
| `key` | Πού είναι στο S3 (μοναδικό) |
| `name`, `mime_type`, `size` | Αρχικό όνομα, τύπος, μέγεθος σε bytes |
| `owner_id` | Ο χρήστης στον οποίο ανήκει (foreign key, `CASCADE`) |
| `attachable_type`, `attachable_id` | Σε ποια εγγραφή είναι συνδεδεμένο, αν είναι: ο **πίνακας** της εγγραφής (π.χ. `users`) και το id της |

Το **`owner_id`** λέει σε ποιον ανήκει το αρχείο, και από αυτό βγαίνει η λίστα. Το **`attachable_*`** λέει σε τι χρησιμοποιείται. Ένα αρχείο μπορεί να ανέβει πριν συνδεθεί κάπου, και μετά να συνδεθεί με οποιονδήποτε πίνακα, χωρίς νέα στήλη για αρχεία σε κάθε πίνακα.

Το Lucid δεν έχει έτοιμες πολυμορφικές σχέσεις, οπότε η σύνδεση γίνεται με μεθόδους του [File](../../apps/api/app/models/file.ts):

```ts
import File from '#models/file'

// σύνδεση ενός αρχείου με μια εγγραφή (οποιοδήποτε model)
await file.attachTo(project)        // attachable_type = 'projects', attachable_id = project.id
await file.detach()

// όλα τα αρχεία μιας εγγραφής
const files = await File.query().withScopes((scopes) => scopes.attachedTo(project))

// τα αρχεία ενός χρήστη
const mine = await File.query().withScopes((scopes) => scopes.ownedBy(user))

// URL λήψης και διαγραφή
const url = await file.signedUrl()
await file.deleteWithObject()       // από το S3 και από τη βάση
```

> [!IMPORTANT]
> Στα `attachable_*` η βάση **δεν** μπορεί να έχει foreign key, γιατί το `attachable_id` δείχνει σε διαφορετικό πίνακα ανάλογα με τον τύπο. Όταν σβήνεις μια εγγραφή που έχει αρχεία, σβήσε **πρώτα** τα αρχεία της:
>
> ```ts
> const files = await File.query().withScopes((scopes) => scopes.attachedTo(project))
> for (const file of files) await file.deleteWithObject()
> await project.delete()
> ```
>
> Αλλιώς τα αρχεία μένουν συνδεδεμένα σε εγγραφή που δεν υπάρχει.

Όταν σβήνεται ένας χρήστης, οι εγγραφές των αρχείων του σβήνονται αυτόματα (`CASCADE`), αλλά τα αντικείμενα στο S3 **όχι**. Μια μελλοντική διαγραφή χρήστη πρέπει να κάνει πρώτα `deleteWithObject()` για κάθε αρχείο του.

### Απευθείας με το drive

Για αρχεία που δεν είναι uploads χρηστών (π.χ. exports, αναφορές):

```ts
import drive from '@adonisjs/drive/services/main'

await drive.use().put('reports/2026.csv', csvText)
const content = await drive.use().get('reports/2026.csv')
await drive.use().exists('reports/2026.csv')
await drive.use().delete('reports/2026.csv')
await drive.use().getSignedUrl('reports/2026.csv', { expiresIn: '1 hour' })
```

Δες τον [FilesController](../../apps/api/app/controllers/files_controller.ts) για ένα πλήρες παράδειγμα.

### Στα tests

Τα tests δεν χρειάζονται RustFS: το `drive.fake('s3')` στέλνει τα αρχεία σε προσωρινό τοπικό φάκελο ([files.spec.ts](../../apps/api/tests/functional/files.spec.ts)):

```ts
let disk: ReturnType<typeof drive.fake>
group.each.setup(() => {
  disk = drive.fake('s3')
  return () => drive.restore('s3')
})

// μέσα σε test
disk.assertExists(key)
disk.assertMissing(key)
```

## Συχνά προβλήματα

| Πρόβλημα | Αιτία και λύση |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:9000` στο upload | Δεν τρέχει το RustFS. `docker compose up -d rustfs-init` |
| `NoSuchBucket` | Δεν έχει δημιουργηθεί το bucket, ή το `S3_BUCKET` διαφέρει από το `RUSTFS_BUCKET`. Τρέξε `docker compose up -d rustfs-init` |
| `SignatureDoesNotMatch` ή `InvalidAccessKeyId` | Τα κλειδιά στο `apps/api/.env` διαφέρουν από τα `RUSTFS_*` του root `.env` |
| Το `rustfs` κάνει restart με `permission denied` | Δεν έτρεξε το `rustfs-permissions`. Τρέξε `docker compose up -d` για όλα τα services |
| Άλλαξα τα κλειδιά στο root `.env` και δεν ισχύουν | Το RustFS διαβάζει τα κλειδιά όταν ξεκινάει. `docker compose up -d rustfs`, που ξαναδημιουργεί το container με τα νέα |
| Port 9000 πιασμένο | Άλλαξε το `RUSTFS_PORT` στο root `.env` **και** το `S3_ENDPOINT` στο `apps/api/.env` |
