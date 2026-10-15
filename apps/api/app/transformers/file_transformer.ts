import type File from '#models/file'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class FileTransformer extends BaseTransformer<File> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'mimeType',
      'size',
      'ownerId',
      'attachableType',
      'attachableId',
      'createdAt',
      'updatedAt',
    ])
  }
}
