import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'

const endpoint = env.get('S3_ENDPOINT')

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    /**
     * AWS S3, or any S3-compatible storage when S3_ENDPOINT is set
     * (RustFS locally, Cloudflare R2, Hetzner, ...)
     */
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY').release(),
      },
      region: env.get('AWS_REGION'),
      bucket: env.get('S3_BUCKET'),
      endpoint,
      // S3-compatible servers expect http://host/bucket/key instead of http://bucket.host/key
      forcePathStyle: !!endpoint,
      // Files are private; clients read them through signed URLs
      visibility: 'private',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
