import { S3Client } from '@aws-sdk/client-s3';
import { SPACES_REGION, SPACES_ENDPOINT, SPACES_KEY, SPACES_SECRET } from '../constants/env.js';

export const s3Client = new S3Client({
  endpoint: `https://${SPACES_ENDPOINT}`,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET,
  },
});
