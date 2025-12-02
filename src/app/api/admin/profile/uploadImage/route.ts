import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET as string;

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CL0UDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY as string;
const API_SECRET = process.env.CLOUDINARY_API_SECRET as string;
const FOLDER = process.env.CLOUDINARY_ADMIN_AVATAR_FOLDER || "lumashape/admin-avatars";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
      if (decoded?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json({ error: "Cloudinary config missing" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as Blob | File | null;
    if (!file) return NextResponse.json({ error: "No image file provided" }, { status: 400 });

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `folder=${FOLDER}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(stringToSign + API_SECRET)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", API_KEY);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", FOLDER);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });

    const json = await resp.json();
    if (!resp.ok) {
      const message = (json && (json.error?.message || json.message)) || "Upload failed";
      return NextResponse.json({ error: message }, { status: resp.status || 500 });
    }

    return NextResponse.json({
      secure_url: json.secure_url,
      public_id: json.public_id,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}