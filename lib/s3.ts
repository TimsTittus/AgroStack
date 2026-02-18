import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

class S3Handler {
  private s3Client: S3Client;
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  getObjectUrl(key: string) {
    const baseUrl = new URL(key, this.config.publicUrl);
    return baseUrl.toString();
  }

  async getUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const ObjectUrl = this.getObjectUrl(key);

    return { uploadUrl, ObjectUrl };
  }

  async uploadObject(object: File, key: string) {
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: object,
    });

    await this.s3Client.send(command);
  };

  async downloadObject(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return response.Body;
  };

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  };

  async listObjects() {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucketName,
    });

    const response = await this.s3Client.send(command);
    return response.Contents || [];
  };
}

export const s3 = new S3Handler({
  endpoint: process.env.R2_ENDPOINT as string,
  accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  bucketName: process.env.R2_BUCKET_NAME as string,
  publicUrl: process.env.R2_PUBLIC_URL as string,
});