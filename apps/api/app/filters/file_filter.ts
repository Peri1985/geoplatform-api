import { BaseFilter } from '#mixins/with_filters'

export default class FileFilter extends BaseFilter {
  search(value: string) {
    this.query.whereILike('name', `%${value}%`)
  }

  mimeType(value: string) {
    this.query.where('mime_type', value)
  }
}
