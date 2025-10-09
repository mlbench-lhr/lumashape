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

interface AddToolDTO {
  length: number;
  depth: number;
  toolType: string;
  toolBrand: string;
  unit: string;
}

interface CvApiResponse {
  annotated_image_url?: string;
  dxf_link?: string;
  height_in_inches?: number;
  scale_info?: number;
  [key: string]: unknown;
}

interface ToolUpdateData {
  processingStatus: "completed" | "failed";
  cvResponse?: CvApiResponse;
  imageUrl?: string;
  dxfLink?: string;
  diagonalInches?: number;
  scaleFactor?: number;
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
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    let decoded: JwtDecoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtDecoded;
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const dataJson = formData.get("data") as string | null;

    // 3. Validate image
    if (!image) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!image.size || image.size === 0) {
      return NextResponse.json({ error: "Image file is empty or invalid" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image file too large. Max 10MB allowed" }, { status: 400 });
    }

    // 4. Parse and validate data JSON
    if (!dataJson) {
      return NextResponse.json({ error: "Tool data is required" }, { status: 400 });
    }

    let toolData: AddToolDTO;
    try {
      toolData = JSON.parse(dataJson);
    } catch (parseError) {
      console.error("Failed to parse tool data:", parseError);
      return NextResponse.json({ error: "Invalid JSON in data field" }, { status: 400 });
    }

    const { length, depth, toolBrand, toolType, unit } = toolData;

    // 5. Validate required fields
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

    const lengthNum = typeof length === 'number' ? length : parseFloat(String(length));
    const depthNum = typeof depth === 'number' ? depth : parseFloat(String(depth));

    if (isNaN(lengthNum) || isNaN(depthNum) || lengthNum <= 0 || depthNum <= 0) {
      return NextResponse.json(
        { error: "Length and depth must be valid positive numbers" },
        { status: 400 }
      );
    }

    const unitValue = unit || "inches";
    const lengthInches = convertToInches(lengthNum, unitValue);
    const depthInches = convertToInches(depthNum, unitValue);

    console.log("Processing tool upload:", {
      email: decoded.email,
      lengthInches,
      depthInches,
      toolBrand,
      toolType,
      imageSize: image.size,
    });

    // 6. Save initial tool data to MongoDB
    const tool = new Tool({
      userEmail: decoded.email,
      length: lengthNum,
      depth: depthNum,
      unit: unitValue.toLowerCase().trim(),
      brand: toolBrand,
      toolType: toolType,
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
    console.log("Tool saved with ID:", tool._id);

    // 7. Background processing - send to CV endpoint
    setImmediate(async () => {
      try {
        console.log(`Starting CV processing for tool ${tool._id}`);
        
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        const form = new FormData();
        
        form.append("image", imageBuffer, {
          filename: image.name || "tool_image.jpg",
          contentType: image.type || "image/jpeg",
        });
        form.append("length", lengthInches.toString());
        form.append("depth", depthInches.toString());

        console.log("Sending to CV endpoint:", {
          lengthInches,
          depthInches,
          imageSize: imageBuffer.length,
        });

        const cvResponse: AxiosResponse<CvApiResponse> = await axios.post(
          CV_ENDPOINT,
          form,
          {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 300000, // 5 minutes
          }
        );

        console.log("CV response received:", cvResponse.data);

        const updateData: ToolUpdateData = {
          processingStatus: "completed",
          cvResponse: cvResponse.data,
        };

        // Map CV response fields
        if (cvResponse.data.annotated_image_url) {
          updateData.imageUrl = cvResponse.data.annotated_image_url;
        }
        if (cvResponse.data.dxf_link) {
          updateData.dxfLink = cvResponse.data.dxf_link;
        }
        if (cvResponse.data.height_in_inches) {
          updateData.diagonalInches = cvResponse.data.height_in_inches;
        }
        if (cvResponse.data.scale_info) {
          updateData.scaleFactor = cvResponse.data.scale_info;
        }

        await dbConnect();
        await Tool.findByIdAndUpdate(tool._id, updateData);
        console.log(`Tool ${tool._id} updated successfully with CV response`);
        
      } catch (cvError: unknown) {
        console.error(`Error processing CV endpoint for tool ${tool._id}:`, cvError);

        const errorMessage =
          cvError instanceof Error ? cvError.message : "Unknown error occurred";

        if (axios.isAxiosError(cvError)) {
          console.error("Axios error details:", {
            status: cvError.response?.status,
            statusText: cvError.response?.statusText,
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
          console.log(`Tool ${tool._id} marked as failed`);
        } catch (updateError) {
          console.error("Failed to update tool status:", updateError);
        }
      }
    });

    // 8. Respond immediately to client
    return NextResponse.json({
      success: true,
      message: "Tool data saved successfully. Processing in background.",
      toolId: tool._id,
      processingStatus: "pending",
    }, { status: 201 });

  } catch (err: unknown) {
    console.error("Error in tool upload route:", err);
    
    const errorMessage =
      err instanceof Error ? err.message : "Failed to process tool creation";

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(err) : undefined,
      },
      { status: 500 }
    );
  }
}