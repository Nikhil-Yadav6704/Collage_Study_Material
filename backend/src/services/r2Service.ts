import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET } from '../config/r2';
import { v4 as uuidv4 } from 'uuid';

export const r2Service = {
  // Upload a buffer to R2 — returns the object key
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: 'materials' | 'request-temp'
  ): Promise<string> {
    const ext = originalName.split('.').pop() || 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: { originalName },
    }));

    return key;
  },

  // Move a file from one folder to another (copy + delete)
  async moveFile(sourceKey: string, destinationFolder: 'materials'): Promise<string> {
    const ext = sourceKey.split('.').pop() || 'bin';
    const newKey = `${destinationFolder}/${uuidv4()}.${ext}`;

    // R2/S3 doesn't have a move operation — copy then delete
    await r2Client.send(new CopyObjectCommand({
      Bucket: R2_BUCKET,
      CopySource: `${R2_BUCKET}/${sourceKey}`,
      Key: newKey,
    }));

    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: sourceKey }));
    return newKey;
  },

  // Generate a time-limited signed download URL
  async getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
  },

  // Delete a file
  async deleteFile(key: string): Promise<void> {
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  },
};
