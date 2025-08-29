import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { Buffer } from "buffer";
import s3 from "./spaces";

export async function uploadToSpaces(
  file: Buffer,
  fileName: string,
  mimeType: string
) {
  const bucketName = process.env.DO_SPACES_BUCKET as string;

  const uploadParams: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: fileName,
    Body: file, // Buffer works directly in Node
    ACL: "public-read",
    ContentType: mimeType,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `https://${bucketName}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;
}
