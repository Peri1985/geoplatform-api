# Docker (PostGIS, Redis, Nominatim, Photon)

Οι εξωτερικές υπηρεσίες για την ανάπτυξη τρέχουν με Docker Compose. Η ρύθμιση είναι στο [docker-compose.yml](../../docker-compose.yml) στο root.

| Υπηρεσία    | Image                     | Τι κάνει                                               | Port (default) |
| ----------- | ------------------------- | ------------------------------------------------------ | -------------- |
| `postgres`  | `imresamu/postgis:18-3.6` | PostgreSQL 18 με PostGIS 3.6, η βάση της εφαρμογής     | 5432           |
| `redis`     | `redis:8.8`               | Cache και queues                                       | 6379           |
| `nominatim` | `mediagis/nominatim:5.3`  | Geocoding και reverse geocoding από δεδομένα OSM       | 8080           |
| `photon`    | build από `docker/photon` | Γρήγορη αναζήτηση και autocomplete, index από το Nominatim | 2322       |

- Τα ports ακούνε μόνο στο `127.0.0.1`, όχι στο δίκτυο.
- Το `imresamu/postgis` είναι multi-arch build του επίσημου PostGIS image. Το `postgis/postgis` υπάρχει μόνο για amd64, και σε Mac M-series θα έτρεχε αργά με emulation.
- Το Photon δεν έχει δικά του δεδομένα: φτιάχνει το index του από τη βάση του Nominatim, οπότε τα δύο δίνουν τα ίδια αποτελέσματα. Χτίζεται από το [docker/photon/](../../docker/photon/) με την επίσημη έκδοση του [Photon](https://github.com/komoot/photon) (1.3.0).

## Πρώτη φορά

```bash
cp .env.example .env     # ρυθμίσεις: κωδικοί, ports, περιοχή OSM
docker compose up -d
```

Η πρώτη εκκίνηση κατεβάζει τα δεδομένα OSM της **Ελλάδας** (~340 MB από [Geofabrik](https://download.geofabrik.de/europe/greece.html)) και κάνει import:

1. Τα `postgres` και `redis` είναι έτοιμα σε λίγα δευτερόλεπτα.
2. Το `nominatim` κάνει import, που διαρκεί **περίπου 15–30 λεπτά** ανάλογα με το μηχάνημα (~17 λεπτά σε Mac M-series με 8 GB για το Docker). Μέχρι να τελειώσει, το `docker compose ps` το δείχνει `health: starting`.
3. Μόλις το Nominatim γίνει `healthy`, ξεκινάει το `photon` και φτιάχνει το index του (~4 λεπτά).

Το `docker compose up -d` περιμένει να γίνει healthy το Nominatim, γιατί το Photon εξαρτάται από αυτό. Μπορείς να το αφήσεις να τρέχει ή να το διακόψεις με Ctrl+C: τα containers συνεχίζουν κανονικά.

Αν χρειάζεσαι μόνο τη βάση για να δουλέψεις στο api, ξεκίνα μόνο αυτά:

```bash
docker compose up -d postgres redis
```

Η πρόοδος φαίνεται με:

```bash
docker compose ps
docker compose logs -f nominatim
docker compose logs -f photon
```

Τα δεδομένα μένουν σε Docker volumes, οπότε το import γίνεται **μόνο την πρώτη φορά**. Από εκεί και πέρα, το `docker compose up -d` σηκώνει τα πάντα σε δευτερόλεπτα.

## Έλεγχος ότι δουλεύουν

Με τα default ports:

```bash
docker compose exec postgres psql -U geoplatform -c "select postgis_version();"
docker compose exec redis redis-cli ping
curl "http://localhost:8080/search?q=Πειραιάς&format=json"   # Nominatim
curl "http://localhost:2322/api?q=Πειραιά&lang=el"           # Photon
```

Connection strings: `postgresql://geoplatform:geoplatform@localhost:5432/geoplatform` και `redis://localhost:6379`. Το api συνδέεται με τη βάση και το Redis μέσω του `apps/api/.env` (βλ. [DB.md](../backend/DB.md#σύνδεση) και [API.md](../backend/API.md#ρυθμίσεις-env)). Το Redis το χρησιμοποιεί προς το παρόν για τα όρια requests στο login.

## Nominatim και Photon: πότε ποιο

| | Nominatim | Photon |
| --- | --- | --- |
| Για | Ακριβή διεύθυνση, reverse geocoding (συντεταγμένες → διεύθυνση) | Αναζήτηση καθώς πληκτρολογεί ο χρήστης (autocomplete) |
| Ταχύτητα | Πιο αργό | Πολύ γρήγορο |
| Λάθη πληκτρολόγησης | Δεν τα ανέχεται | Τα ανέχεται |
| Παράδειγμα | `/reverse?lat=37.943&lon=23.647&format=json` | `/api?q=Πειραι&lang=el` |

Τεκμηρίωση των APIs: [Nominatim](https://nominatim.org/release-docs/latest/api/Overview/), [Photon](https://github.com/komoot/photon#search-api).

## Ρυθμίσεις (`.env`)

| Μεταβλητή                             | Default                           | Τι ορίζει                                                     |
| ------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| `POSTGRES_DB` / `_USER` / `_PASSWORD` | `geoplatform`                     | Βάση και χρήστης της εφαρμογής                                |
| `POSTGRES_PORT`                       | `5432`                            | Port στο host                                                 |
| `REDIS_PORT`                          | `6379`                            | Port στο host                                                 |
| `NOMINATIM_PBF_URL`                   | Ελλάδα από Geofabrik              | Ποια περιοχή OSM θα γίνει import                              |
| `NOMINATIM_REPLICATION_URL`           | Ενημερώσεις Ελλάδας από Geofabrik | Από πού έρχονται οι ενημερώσεις                               |
| `NOMINATIM_PASSWORD`                  | `nominatim`                       | Κωδικός της βάσης του Nominatim (τον χρησιμοποιεί το Photon)  |
| `NOMINATIM_IMPORT_WIKIPEDIA`          | `false`                           | `true` = καλύτερη κατάταξη αποτελεσμάτων, πιο αργό import     |
| `NOMINATIM_PORT`                      | `8080`                            | Port στο host                                                 |
| `PHOTON_LANGUAGES`                    | `el,en`                           | Γλώσσες στο index του Photon                                  |
| `PHOTON_PORT`                         | `2322`                            | Port στο host                                                 |

**Port πιασμένο** (π.χ. από άλλο project): άλλαξέ το στο `.env`, π.χ. `POSTGRES_PORT=5434`. Αν αλλάξεις το `POSTGRES_PORT` ή το `REDIS_PORT`, άλλαξε αντίστοιχα και τα `DB_PORT` και `REDIS_PORT` στο `apps/api/.env`.

**Κωδικοί:** οι κωδικοί της βάσης ορίζονται μόνο όταν δημιουργείται το volume. Αν τους αλλάξεις αργότερα στο `.env`, δεν εφαρμόζονται. Πρέπει να σβήσεις το volume (βλ. παρακάτω).

**Μνήμη:** οι ρυθμίσεις μνήμης του Nominatim στο `docker-compose.yml` είναι για Docker με ~8 GB RAM. Για μεγαλύτερες περιοχές (π.χ. όλη την Ευρώπη) χρειάζεσαι περισσότερη μνήμη και δίσκο, και πρέπει να ανεβάσεις τα `POSTGRES_*` και το `shm_size`.

## Συχνές εντολές

| Εντολή                                | Τι κάνει                                                 |
| ------------------------------------- | -------------------------------------------------------- |
| `docker compose up -d`                | Ξεκινάει όλες τις υπηρεσίες                              |
| `docker compose up -d postgres redis` | Μόνο βάση και Redis (χωρίς geocoding)                    |
| `docker compose ps`                   | Κατάσταση των υπηρεσιών                                  |
| `docker compose stop`                 | Σταματάει τις υπηρεσίες, τα δεδομένα μένουν              |
| `docker compose down`                 | Σβήνει τα containers, τα δεδομένα (volumes) μένουν       |
| `docker compose down -v`              | Σβήνει **και όλα τα δεδομένα**: την επόμενη φορά ξανά import |
| `docker compose logs -f <υπηρεσία>`   | Logs μιας υπηρεσίας                                      |

## Volumes

| Volume | Τι κρατάει | Αν το σβήσεις |
| --- | --- | --- |
| `geoplatform_postgres-data` | Η βάση της εφαρμογής | Χάνονται όλα τα δεδομένα. Ξανατρέχεις `ace migration:run` (βλ. [DB.md](../backend/DB.md#reset-τοπικής-βάσης)) |
| `geoplatform_redis-data` | Τα δεδομένα του Redis | Μηδενίζονται τα όρια requests |
| `geoplatform_nominatim-data` | Η βάση του Nominatim | Ξανά import (~15–30 λεπτά) |
| `geoplatform_photon-data` | Το index του Photon | Ξανά index από το Nominatim (~4 λεπτά) |

## Αλλαγή περιοχής ή ανανέωση δεδομένων OSM

Για άλλη περιοχή, άλλαξε τα `NOMINATIM_PBF_URL` και `NOMINATIM_REPLICATION_URL` στο `.env` (βλ. [Geofabrik](https://download.geofabrik.de)). Μετά σβήσε τα volumes του Nominatim και του Photon, ώστε να γίνει ξανά import:

```bash
docker compose down
docker volume rm geoplatform_nominatim-data geoplatform_photon-data
docker compose up -d
```

Με τον ίδιο τρόπο ανανεώνεις τα δεδομένα με την τελευταία έκδοση του OSM. Για συνεχείς ενημερώσεις χωρίς νέο import, δες το [Nominatim replication](https://github.com/mediagis/nominatim-docker/blob/master/howto.md#updating-the-database).

Το Photon δεν ενημερώνεται μόνο του όταν ενημερώνεται το Nominatim. Σβήσε το `geoplatform_photon-data` για να ξαναφτιάξει το index.
