import { FileSchema } from '#database/schema'
import { withFilters } from '#mixins/with_filters'
import { filters } from '#generated/filters'
import { withAudit } from '#mixins/with_audit'
import { audit } from '#services/audit'
import { compose } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import { scope } from '@adonisjs/lucid/orm'
import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'

/**
 * How long a download URL stays valid
 */
const URL_EXPIRES_IN = '1 hour'

/**
 * The attachable_type of a record: the name of its table (e.g. "users")
 */
function attachableTypeOf(record: LucidRow) {
  return (record.constructor as LucidModel).table
}

/**
 * A file stored in S3.
 *
 * - owner_id: who the file belongs to, a user or an organization. Not a foreign key
 *   (it points to either table), so deleting the owner does not delete its files.
 * - uploaded_by: the user who uploaded it.
 * - attachable_type + attachable_id: the one record it is attached to, if any (polymorphic).
 *
 * Lucid has no polymorphic relations, so attaching and querying go through the
 * attachTo() method and the attachedTo scope below.
 */
export default class File extends compose(FileSchema, withAudit(), withFilters(filters.File)) {
  /**
   * The files of a user or an organization: File.query().withScopes((s) => s.ownedBy(user))
   */
  static ownedBy = scope((query, owner: { id: string }) => {
    query.where('owner_id', owner.id)
  })

  /**
   * The files attached to a record: File.query().withScopes((s) => s.attachedTo(place))
   */
  static attachedTo = scope((query, record: LucidRow) => {
    query
      .where('attachable_type', attachableTypeOf(record))
      .where('attachable_id', String(record.$primaryKeyValue))
  })

  async attachTo(record: LucidRow) {
    this.attachableType = attachableTypeOf(record)
    this.attachableId = String(record.$primaryKeyValue)
    await this.save()
  }

  async detach() {
    this.attachableType = null
    this.attachableId = null
    await this.save()
  }

  /**
   * A temporary download URL; the bucket itself is private. Recorded in the audit log:
   * the download itself goes straight to S3, so issuing the URL is what we can see.
   */
  async signedUrl() {
    const url = await drive.use().getSignedUrl(this.key, { expiresIn: URL_EXPIRES_IN })
    await audit({
      action: 'files.url_issued',
      subject: this,
      changes: { expiresIn: URL_EXPIRES_IN },
    })
    return url
  }

  /**
   * Deletes the object from S3 first, then the row. If S3 fails, both stay,
   * so a row never points to a missing object.
   */
  async deleteWithObject() {
    await drive.use().delete(this.key)
    await this.delete()
  }
}
