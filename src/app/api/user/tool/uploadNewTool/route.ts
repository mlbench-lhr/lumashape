import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

// ===============================
// CONSTANTS
// ===============================
const JWT_SECRET = process.env.JWT_SECRET!;
const CV_ENDPOINT = "https://lumashape-canvas-dxf-generation.hf.space/api/image-to-dxf";
const MM_TO_INCHES = 1 / 25.4;

// ===============================
// TYPES
// ===============================
interface JwtDecoded {
  email: string;
  iat?: number;
  exp?: number;
}

interface CvApiResponse {
  annotated_image_url?: string;
  [key: string]: unknown; // allow flexible response from CV server
}

interface ToolUpdateData {
  processingStatus: "completed" | "failed";
  cvResponse?: CvApiResponse;
  imageUrl?: string;
  processingError?: string;
}

// ===============================
// UTILS
// ===============================
function convertToInches(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  if (normalizedUnit === "mm" || normalizedUnit === "millimeters") {
    return value * MM_TO_INCHES;
  }
  return value;
}

// ===============================
// ROUTE HANDLER
// ===============================
export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Verify JWT token
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: JwtDecoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtDecoded;
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Parse request body
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const length = formData.get("length") as string | null;
    const depth = formData.get("depth") as string | null;
    const unit = (formData.get("unit") as string) || "inches";
    const toolBrand = formData.get("toolBrand") as string | null;
    const toolType = formData.get("toolType") as string | null;

    // 3. Validate
    if (!image) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!length || !depth || !toolBrand || !toolType) {
      return NextResponse.json(
        {
          error: "Missing required fields: length, depth, toolBrand, and toolType are required",
          received: {
            hasLength: !!length,
            hasDepth: !!depth,
            hasToolBrand: !!toolBrand,
            hasToolType: !!toolType,
          },
        },
        { status: 400 }
      );
    }

    const lengthNum = parseFloat(length);
    const depthNum = parseFloat(depth);

    if (isNaN(lengthNum) || isNaN(depthNum) || lengthNum <= 0 || depthNum <= 0) {
      return NextResponse.json(
        { error: "Length and depth must be valid positive numbers" },
        { status: 400 }
      );
    }

    const lengthInches = convertToInches(lengthNum, unit);
    const depthInches = convertToInches(depthNum, unit);

    if (!image.size || image.size === 0) {
      return NextResponse.json({ error: "Image file is empty or invalid" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image file too large. Max 10MB" }, { status: 400 });
    }

    // 4. Save to MongoDB
    const tool = new Tool({
      userEmail: decoded.email,
      length: lengthNum,
      depth: depthNum,
      unit: unit.toLowerCase().trim(),
      toolBrand,
      toolType,
      imageUrl: "",
      processingStatus: "pending",
      likes: 0,
      dislikes: 0,
      downloads: 0,
      published: false,
      publishedDate: null,
      likedByUsers: [],
      dislikedByUsers: [],
      downloadedByUsers: [],
    });

    await tool.save();

    // 5. Background processing
    setImmediate(async () => {
      try {
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        const form = new FormData();
        form.append("image", imageBuffer, {
          filename: image.name || "upload.png",
          contentType: image.type || "image/png",
        });
        form.append("length", lengthInches.toString());
        form.append("depth", depthInches.toString());

        const cvResponse: AxiosResponse<CvApiResponse> = await axios.post(
          CV_ENDPOINT,
          form,
          {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 300000,
          }
        );

        const updateData: ToolUpdateData = {
          processingStatus: "completed",
          cvResponse: cvResponse.data,
        };

        if (cvResponse.data.annotated_image_url) {
          updateData.imageUrl = cvResponse.data.annotated_image_url;
        }

        await dbConnect();
        await Tool.findByIdAndUpdate(tool._id, updateData);
      } catch (cvError: unknown) {
        console.error("Error processing CV endpoint:", cvError);

        const errorMessage =
          cvError instanceof Error ? cvError.message : "Unknown error occurred";

        if (axios.isAxiosError(cvError)) {
          console.error("Axios error details:", {
            status: cvError.response?.status,
            data: cvError.response?.data,
            message: cvError.message,
          });
        }

        const failUpdate: ToolUpdateData = {
          processingStatus: "failed",
          processingError: errorMessage,
        };

        try {
          await dbConnect();
          await Tool.findByIdAndUpdate(tool._id, failUpdate);
        } catch (updateError) {
          console.error("Failed to update tool status:", updateError);
        }
      }
    });

    // 6. Respond immediately
    return NextResponse.json({
      success: true,
      message: "Tool data saved successfully. Processing in background.",
      toolId: tool._id,
      processingStatus: "pending",
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to process tool creation";

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? err : undefined,
      },
      { status: 500 }
    );
  }
}
