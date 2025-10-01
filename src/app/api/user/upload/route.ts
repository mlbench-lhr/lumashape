import { NextRequest } from "next/server";
import formidable, { File } from "formidable";
import fs from "fs";
import AWS from "aws-sdk";

export const config = {
  api: {
    bodyParser: false,
  },
};

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT!);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const fileName =
      formData.get("fileName")?.toString() || `upload_${Date.now()}`;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3
      .putObject({
        Bucket: process.env.DO_SPACES_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        ACL: "public-read",
      })
      .promise();

    const url = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${fileName}`;
    return new Response(JSON.stringify({ url }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
    });
  }
}
