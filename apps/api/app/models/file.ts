import { FileSchema } from '#database/schema'
import User from '#models/user'
import drive from '@adonisjs/drive/services/main'
import { belongsTo, scope } from '@adonisjs/lucid/orm'
import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

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
 * A file stored in S3. It always has an owner (the user who uploaded it), and it can
 * be attached to any one record (polymorphic: attachable_type + attachable_id).
 *
 * Lucid has no polymorphic relations, so attaching and querying go through the
 * attachTo() method and the attachedTo scope below.
 */
export default class File extends FileSchema {
  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  /**
   * The files of a user: File.query().withScopes((s) => s.ownedBy(user))
   */
  static ownedBy = scope((query, user: User) => {
    query.where('owner_id', user.id)
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
   * A temporary download URL; the bucket itself is private
   */
  signedUrl() {
    return drive.use().getSignedUrl(this.key, { expiresIn: URL_EXPIRES_IN })
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
