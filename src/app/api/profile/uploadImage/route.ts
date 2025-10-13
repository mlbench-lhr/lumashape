import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";
import { IncomingForm, Fields, Files } from "formidable";
import { PassThrough } from "stream";
import { IncomingMessage } from "http";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET!;

interface MockIncomingMessage extends PassThrough {
  headers: Record<string, string>;
  method?: string;
  url?: string;
}


// ---------- Helper function (same as in your working API) ----------
async function parseFormData(req: Request): Promise<{ fields: Fields; files: Files }> {
  const form = new IncomingForm({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true,
  });

  const stream = new PassThrough();

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const mockReq: MockIncomingMessage = Object.assign(stream, {
    headers,
    method: req.method,
    url: new URL(req.url).pathname,
  });


  const reader = req.body?.getReader();
  if (reader) {
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            stream.end();
            break;
          }
          stream.write(Buffer.from(value));
        }
      } catch (err) {
        stream.destroy(err as Error);
      }
    })();
  } else {
    const buffer = await req.arrayBuffer();
    stream.write(Buffer.from(buffer));
    stream.end();
  }

  return new Promise((resolve, reject) => {
    form.parse(mockReq as unknown as IncomingMessage, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// ---------- Main API ----------
export async function POST(req: Request) {
  try {
    // ✅ Verify JWT
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ✅ Parse form-data via formidable (Android-safe)
    const { files } = await parseFormData(req);
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = fs.readFileSync(imageFile.filepath);

    // ✅ Generate unique filename
    const fileName = `profiles/profile-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.png`;

    // ✅ Configure DigitalOcean Spaces client
    const s3Client = new S3Client({
      region: process.env.DO_SPACES_REGION!,
      endpoint: process.env.DO_SPACES_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
    });

    // ✅ Upload to DO Spaces
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: imageFile.mimetype || "image/png",
      ACL: "public-read",
    });

    await s3Client.send(command);

    // ✅ Construct public file URL
    const fileUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;

    // ✅ Cleanup temp file
    try {
      fs.unlinkSync(imageFile.filepath);
    } catch (cleanupErr) {
      console.warn("Temp file cleanup failed:", cleanupErr);
    }

    return NextResponse.json({ success: true, fileUrl });
  } catch (err) {
    console.error("Error uploading image:", err);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

