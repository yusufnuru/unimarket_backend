import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  SPACES_REGION,
  SPACES_ENDPOINT,
  SPACES_KEY,
  SPACES_SECRET,
  BUCKET_NAME,
} from '../constants/env.js';
import AppError from '../utils/AppError.js';
import { HttpStatusCode, INTERNAL_SERVER_ERROR, NOT_FOUND } from '../constants/http.js';

export const s3Client = new S3Client({
  endpoint: `https://${SPACES_ENDPOINT}`,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET,
  },
});

export const uploadFile = async (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string,
  filePath?: string,
) => {
  try {
    const key = filePath ? `${filePath}/${fileName}` : fileName;
    console.log('Uploading to S3 with Key:', key);
    const params = {
      Bucket: BUCKET_NAME,
      Body: fileBuffer,
      Key: key,
      ContentType: mimetype,
    };

    return await s3Client.send(new PutObjectCommand(params));
  } catch (error: unknown) {
    if (error instanceof AppError) {
      console.error('Error uploading file to S3:', error);
      throw new AppError(error.statusCode, `Failed to upload file ${fileName}: ${error.message}`);
    }
    console.error('Error uploading file to S3:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AppError(INTERNAL_SERVER_ERROR, `Failed to upload file ${fileName}: ${errorMessage}`);
  }
};

export const deleteFile = (fileName: string, filePath?: string) => {
  try {
    const key = filePath ? `${filePath}/${fileName}` : fileName;
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    return s3Client.send(new DeleteObjectCommand(params));
  } catch (error: unknown) {
    if (error instanceof AppError) {
      console.error('Error deleting file from S3:', error);
      throw new AppError(error.statusCode, `Failed to delete file ${fileName}: ${error.message}`);
    }
    console.error('Error deleting file from S3:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AppError(INTERNAL_SERVER_ERROR, `Failed to delete file ${fileName}: ${errorMessage}`);
  }
};

export const deleteFolder = async (folderPrefix: string) => {
  try {
    const prefix = folderPrefix.endsWith('/') ? folderPrefix : `${folderPrefix}/`;
    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
      const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      };

      const response = await s3Client.send(new ListObjectsV2Command(params));

      if (response.Contents && response.Contents.length > 0) {
        const objectsToDelete = response.Contents.map((object) => ({ Key: object.Key }));

        for (let i = 0; i < objectsToDelete.length; i += 1000) {
          const batch = objectsToDelete.slice(i, i + 1000);
          const deleteParams = {
            Bucket: BUCKET_NAME,
            Delete: {
              Objects: batch,
            },
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
        }
      }
      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }
  } catch (error) {
    if (error instanceof AppError) {
      console.error('Error deleting folder from S3:', error);
      throw new AppError(
        error.statusCode,
        `Failed to delete folder ${folderPrefix}: ${error.message}`,
      );
    }
    console.error('Error deleting folder from S3:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AppError(
      INTERNAL_SERVER_ERROR,
      `Failed to delete folder ${folderPrefix}: ${errorMessage}`,
    );
  }
};

export const getObjectSignedUrl = async (key: string, expiresIn: number = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      console.error('Error generating signed URL:', error);
      throw new AppError(
        error.statusCode,
        `Failed to generate signed URL for ${key}: ${error.message}`,
      );
    }
    console.error('Error generating signed URL:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AppError(
      INTERNAL_SERVER_ERROR,
      `Failed to generate signed URL for ${key}: ${errorMessage}`,
    );
  }
};

export const checkFolderExists = async (folderPath: string) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: folderPath,
    };

    const response = await s3Client.send(new ListObjectsV2Command(params));

    return !!(response.Contents && response.Contents.length > 0);
  } catch (error) {
    if (error instanceof AppError) {
      console.error('Error checking if folder exists:', error);
      throw new AppError(
        error.statusCode,
        `Failed to check if folder ${folderPath} exists: ${error.message}`,
      );
    }
    console.error('Error checking if folder exists:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AppError(
      INTERNAL_SERVER_ERROR,
      `Failed to check if folder ${folderPath} exists: ${errorMessage}`,
    );
  }
};

export const checkFileExists = async (fileName: string, filePath: string) => {
  try {
    const key = filePath ? `${filePath}/${fileName}` : fileName;
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new HeadObjectCommand(params));
    return true;
  } catch (error) {
    if (error instanceof Error) {
      const errWithMeta = error as Error & {
        $metadata?: { httpStatusCode?: number };
        name?: string;
      };
      if (errWithMeta.$metadata?.httpStatusCode === NOT_FOUND || errWithMeta.name === 'NotFound') {
        return false;
      }
      console.error('Error checking if file exists:', errWithMeta);
      throw new AppError(
        <HttpStatusCode>errWithMeta.$metadata?.httpStatusCode || NOT_FOUND,
        `Failed to check if file ${fileName} exists: ${errWithMeta.message}`,
      );
    }
    console.error('Error checking if file exists:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AppError(
      INTERNAL_SERVER_ERROR,
      `Failed to check if file ${fileName} exists: ${errorMessage}`,
    );
  }
};
