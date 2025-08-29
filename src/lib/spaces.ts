import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "sfo3", // Your Space region
  endpoint: "https://lumashape-image-space.sfo3.digitaloceanspaces.com", // Space endpoint
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY as string,
    secretAccessKey: process.env.DO_SPACES_SECRET as string,
  },
});

export default s3;