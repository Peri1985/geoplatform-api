# Audit log

Το api καταγράφει στον πίνακα `audit_logs` **ποιος έκανε τι, σε ποια εγγραφή, πότε και από πού**. Ο πίνακας δέχεται μόνο προσθήκες: ένας trigger της βάσης απορρίπτει κάθε αλλαγή. Οι εγγραφές κρατιούνται 365 μέρες (ρυθμίζεται) και μετά σβήνονται αυτόματα.

Το log **δεν** εκτίθεται από το api. Διαβάζεται απευθείας από τη βάση (`psql`, DBeaver), με τα queries [πιο κάτω](#χρήσιμα-queries).

## Περιεχόμενα

- [Τι καταγράφεται](#τι-καταγράφεται)
- [Ο πίνακας](#ο-πίνακας)
- [Πώς δουλεύει](#πώς-δουλεύει)
- [Audit σε νέο model](#audit-σε-νέο-model)
- [Ρητή καταγραφή](#ρητή-καταγραφή)
- [Διάρκεια και καθαρισμός](#διάρκεια-και-καθαρισμός)
- [Χρήσιμα queries](#χρήσιμα-queries)
- [Όρια](#όρια)

## Τι καταγράφεται

| Action | Πότε | `changes` |
| --- | --- | --- |
| `users.created` | Signup | Τα στοιχεία του χρήστη, **χωρίς** τον κωδικό |
| `users.updated` | Αλλαγή χρήστη | Μόνο τα πεδία που άλλαξαν: `{ "fullName": { "from": null, "to": "Maria" } }` |
| `users.deleted` | Διαγραφή χρήστη | Τα στοιχεία που είχε |
| `files.created` | Upload | Τα στοιχεία του αρχείου (όνομα, τύπος, μέγεθος, key) |
| `files.updated` | Αλλαγή αρχείου (π.χ. `attachTo`) | Μόνο τα πεδία που άλλαξαν |
| `files.deleted` | Διαγραφή αρχείου | Τα στοιχεία που είχε |
| `files.url_issued` | Το api έδωσε URL λήψης (upload και `GET /files/:id`) | `{ "expiresIn": "1 hour" }` |

Οι κωδικοί (`password`) και τα tokens δεν γράφονται **ποτέ** στο log, ούτε στο «πριν» ούτε στο «μετά».

## Ο πίνακας

| Στήλη | Τι κρατάει |
| --- | --- |
| `id` | UUID |
| `user_id` | Ποιος το έκανε: ο συνδεδεμένος χρήστης του request. Στο signup, ο νέος χρήστης. `NULL` αν δεν υπάρχει χρήστης (π.χ. εντολή `ace`) ή αν ο χρήστης σβήστηκε αργότερα |
| `action` | `<πίνακας>.<γεγονός>`, π.χ. `files.deleted` |
| `subject_type`, `subject_id` | Σε ποια εγγραφή έγινε: ο πίνακας και το UUID της (πολυμορφικά, όπως στα files) |
| `changes` | jsonb: τα στοιχεία (create/delete) ή τι άλλαξε (update) |
| `ip`, `user_agent`, `request_id` | Από πού ήρθε το request. Το `request_id` είναι το ίδιο με το `x-request-id` στα logs του api |
| `created_at` | Πότε |

- **Αλλαγές απαγορεύονται:** ένας trigger (`audit_logs_no_update`) απορρίπτει κάθε `UPDATE` με `audit_logs rows cannot be changed`. Η μόνη εξαίρεση είναι το foreign key, που κάνει το `user_id` `NULL` όταν σβήνεται ο χρήστης, ώστε το ιστορικό να μένει.
- **Διαγραφές** γίνονται μόνο από τον [καθαρισμό](#διάρκεια-και-καθαρισμός).

## Πώς δουλεύει

**Αλλαγές σε models:** το mixin [withAudit()](../../apps/api/app/mixins/with_audit.ts) προσθέτει στο model hooks του Lucid (`afterCreate`, `beforeUpdate`, `afterUpdate`, `afterDelete`), που γράφουν στο log σε κάθε `create`, `save` και `delete`. Δεν χρειάζεται κώδικας στους controllers.

**Ποιος και από πού:** η [audit()](../../apps/api/app/services/audit.ts) βρίσκει το τρέχον request με `HttpContext.get()`. Αυτό δουλεύει επειδή είναι ενεργό το AsyncLocalStorage (`useAsyncLocalStorage: true` στο `config/app.ts`). Από εκεί παίρνει χρήστη, IP, user agent και request id. Έξω από request (εντολές `ace`, scripts) αυτά μένουν `NULL`.

**Transactions:** αν η αλλαγή γίνεται μέσα σε transaction, η εγγραφή του log γράφεται στο ίδιο transaction. Αν η αλλαγή αναιρεθεί, αναιρείται και το log.

> [!WARNING]
> Τα hooks τρέχουν μόνο για αλλαγές **μέσω model** (`User.create()`, `user.save()`, `file.delete()`). Μαζικά queries (`User.query().update(...)`, `db.from('users').delete()`) **δεν** καταγράφονται. Για αλλαγές που πρέπει να μείνουν στο log, χρησιμοποίησε models, ή κάλεσε την `audit()` ρητά.

## Audit σε νέο model

Πρόσθεσε το mixin με `compose()`:

```ts
import { CategorySchema } from '#database/schema'
import { withAudit } from '#mixins/with_audit'
import { compose } from '@adonisjs/core/helpers'

export default class Category extends compose(CategorySchema, withAudit()) {}
```

Για να μην καταγράφονται συγκεκριμένα πεδία (π.χ. μεγάλα κείμενα ή ευαίσθητα δεδομένα):

```ts
export default class Report extends compose(ReportSchema, withAudit({ exclude: ['body', 'apiKey'] })) {}
```

Πεδία που δεν καταγράφονται σε **κανένα** model ορίζονται στο `REDACTED_FIELDS` του [app/services/audit.ts](../../apps/api/app/services/audit.ts) (`password`, `rememberMeToken`).

## Ρητή καταγραφή

Για γεγονότα που δεν είναι αλλαγή σε model, χρησιμοποίησε την `audit()`, όπως στο `File.signedUrl()`:

```ts
import { audit } from '#services/audit'

await audit({
  action: 'files.url_issued',
  subject: file,                       // η εγγραφή (προαιρετικό)
  changes: { expiresIn: '1 hour' },    // ό,τι επιπλέον αξίζει να μείνει (προαιρετικό)
})
```

Ονοματολογία: `<πίνακας>.<γεγονός σε αόριστο>`, π.χ. `files.url_issued`, `reports.exported`.

## Διάρκεια και καθαρισμός

| | |
| --- | --- |
| Διάρκεια | `AUDIT_RETENTION_DAYS` στο `apps/api/.env` (default `365`) |
| Αυτόματος καθαρισμός | Όταν ξεκινάει ο server, και μετά μία φορά τη μέρα ([start/audit.ts](../../apps/api/start/audit.ts)). Σβήνει όσα είναι παλιότερα από τη διάρκεια |
| Με το χέρι | `npm run ace -w api -- audit:prune` ή `-- audit:prune --days=90` |

Ο καθαρισμός τρέχει μόνο στον HTTP server, όχι στα tests ούτε στις εντολές `ace`. Αν τρέχουν πολλά instances του api, ο καθαρισμός τρέχει σε όλα, κάτι που δεν πειράζει: το ίδιο `DELETE` δύο φορές δεν έχει παρενέργειες.

## Χρήσιμα queries

```bash
docker compose exec postgres psql -U geoplatform
```

```sql
-- τα τελευταία 50 γεγονότα, με το email του χρήστη
SELECT a.created_at, u.email, a.action, a.subject_type, a.subject_id, a.ip
FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
ORDER BY a.created_at DESC
LIMIT 50;

-- ό,τι έκανε ένας χρήστης
SELECT created_at, action, subject_type, subject_id, changes
FROM audit_logs
WHERE user_id = (SELECT id FROM users WHERE email = 'maria@example.com')
ORDER BY created_at DESC;

-- το ιστορικό μιας εγγραφής (π.χ. ενός αρχείου)
SELECT created_at, action, user_id, changes
FROM audit_logs
WHERE subject_type = 'files' AND subject_id = 'b47684da-b404-48e3-b7a6-c5759ed9f03c'
ORDER BY created_at;

-- ποιος σβήνει αρχεία τις τελευταίες 7 μέρες
SELECT u.email, count(*)
FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
WHERE a.action = 'files.deleted' AND a.created_at > now() - interval '7 days'
GROUP BY u.email ORDER BY count(*) DESC;

-- όλα τα γεγονότα ενός request (το x-request-id από τα logs του api)
SELECT * FROM audit_logs WHERE request_id = '...';
```

## Όρια

- **Λήψεις αρχείων:** καταγράφεται πότε **δόθηκε** URL λήψης (`files.url_issued`), όχι αν και πόσες φορές έγινε η λήψη. Αυτή γίνεται απευθείας από το S3, όχι από το api. Για καταγραφή κάθε λήψης χρειάζεται είτε λήψη μέσα από το api, είτε τα access logs του S3.
- **Login και logout** δεν καταγράφονται, γιατί δεν επιλέχθηκαν. Προστίθενται με μία κλήση `audit()` στον `AccessTokensController`.
- **Μαζικά queries** δεν καταγράφονται (βλ. [Πώς δουλεύει](#πώς-δουλεύει)).
- **Αλλαγές απευθείας στη βάση** (psql, DBeaver) δεν καταγράφονται, γιατί δεν περνάνε από το api.
- **Μέγεθος:** κάθε `files.url_issued` είναι μία εγγραφή, οπότε ο πίνακας μεγαλώνει με τη χρήση. Ο καθαρισμός τον κρατάει στο διάστημα του `AUDIT_RETENTION_DAYS`.
