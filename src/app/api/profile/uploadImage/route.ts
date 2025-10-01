import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // ✅ Auth check
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ✅ Extract formData
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // ✅ Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Generate unique filename
    const fileName = `profiles/profile-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.png`;

    // ✅ Configure DO Spaces
    const s3Client = new S3Client({
      region: process.env.DO_SPACES_REGION!,
      endpoint: process.env.DO_SPACES_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
    });

    // ✅ Upload
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: "image/png",
      ACL: "public-read",
    });

    await s3Client.send(command);

    // ✅ Construct public URL
    const fileUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;

    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
