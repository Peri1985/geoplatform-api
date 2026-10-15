import File from '#models/file'
import FileTransformer from '#transformers/file_transformer'
import { listFilesValidator, MIME_TYPES, uploadFileValidator } from '#validators/file'
import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'
import { randomUUID } from 'node:crypto'

/**
 * The files of the logged-in user. They are stored in S3 under uploads/<user id>/
 * and listed from the files table. Other users' files answer 404, as if missing.
 */
export default class FilesController {
  /**
   * GET /files?page=1&perPage=20: the caller's files, newest first
   */
  async index({ request, auth, serialize }: HttpContext) {
    const { page = 1, perPage = 20 } = await request.validateUsing(listFilesValidator)
    const files = await File.query()
      .withScopes((scopes) => scopes.ownedBy(auth.getUserOrFail()))
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return serialize(FileTransformer.paginate(files.all(), files.getMeta()))
  }

  async store({ request, response, auth, serialize }: HttpContext) {
    const { file: upload } = await request.validateUsing(uploadFileValidator)
    const owner = auth.getUserOrFail()

    const key = `uploads/${owner.id}/${randomUUID()}.${upload.extname}`
    await upload.moveToDisk(key)

    let file: File
    try {
      file = await File.create({
        key,
        name: upload.clientName,
        // The validator has already limited extname to the keys of MIME_TYPES
        mimeType: MIME_TYPES[upload.extname!],
        size: upload.size,
        ownerId: owner.id,
        attachableType: null,
        attachableId: null,
      })
    } catch (error) {
      // No row, no object: do not leave an orphan in S3
      await drive.use().delete(key)
      throw error
    }

    response.status(201)
    return serialize({ file: FileTransformer.transform(file), url: await file.signedUrl() })
  }

  /**
   * One of the caller's files, with a fresh download URL
   */
  async show({ params, auth, serialize }: HttpContext) {
    const file = await this.findOwn(params.id, auth.getUserOrFail().id)
    return serialize({ file: FileTransformer.transform(file), url: await file.signedUrl() })
  }

  async destroy({ params, response, auth }: HttpContext) {
    const file = await this.findOwn(params.id, auth.getUserOrFail().id)
    await file.deleteWithObject()
    return response.noContent()
  }

  private findOwn(id: string, ownerId: string) {
    return File.query().where('id', id).where('owner_id', ownerId).firstOrFail()
  }
}
