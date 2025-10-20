import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";
import { IncomingForm, Fields, Files } from "formidable";
import { PassThrough } from "stream";
import { IncomingMessage } from "http";
import fs from "fs";

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
  success?: boolean;
  original_img?: string;
  dxf_url?: string;
  contour_image_url?: string;
  contour_points_count?: number;
  expansion_pixels?: number;
  dimensions?: {
    length_inches?: number;
    depth_inches?: number;
  };
  [key: string]: unknown;
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

// Convert Next.js Request to a proper Node.js stream for formidable
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

  // ✅ Type-safe mock IncomingMessage
  const mockReq = Object.assign(stream, {
    headers,
    method: req.method,
    url: new URL(req.url).pathname,
    httpVersion: "1.1",
    httpVersionMajor: 1,
    httpVersionMinor: 1,
  }) as unknown as IncomingMessage;


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
    form.parse(mockReq, (err, fields, files) => {
      if (err) {
        console.error("Formidable parse error:", err);
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
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
    let fields: Fields;
    let files: Files;

    try {
      const parsed = await parseFormData(req);
      fields = parsed.fields;
      files = parsed.files;
      console.log("Parsed fields:", fields);
      console.log("Parsed files:", Object.keys(files));
    } catch (parseError) {
      console.error("Failed to parse form data:", parseError);
      return NextResponse.json({
        error: "Failed to parse form data",
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }

    // 3. Extract fields from form data
    const length = Array.isArray(fields.length) ? fields.length[0] : fields.length;
    const depth = Array.isArray(fields.depth) ? fields.depth[0] : fields.depth;
    const toolType = Array.isArray(fields.toolType) ? fields.toolType[0] : fields.toolType;
    const toolBrand = Array.isArray(fields.toolBrand) ? fields.toolBrand[0] : fields.toolBrand;
    const unit = Array.isArray(fields.unit) ? fields.unit[0] : fields.unit;

    // 4. Extract and validate image file
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

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
          allFields: Object.keys(fields),
        },
        { status: 400 }
      );
    }

    const lengthNum = parseFloat(String(length));
    const depthNum = parseFloat(String(depth));

    if (isNaN(lengthNum) || isNaN(depthNum) || lengthNum <= 0 || depthNum < 0) {
      return NextResponse.json(
        {
          error: "Length must be a positive number and depth must be non-negative",
          received: {
            length: lengthNum,
            depth: depthNum,
          }
        },
        { status: 400 }
      );
    }

    const unitValue = unit ? String(unit) : "inches";
    const lengthInches = convertToInches(lengthNum, unitValue);
    const depthInches = convertToInches(depthNum, unitValue);

    console.log("Processing tool upload:", {
      email: decoded.email,
      length: lengthNum,
      depth: depthNum,
      lengthInches,
      depthInches,
      toolBrand: String(toolBrand),
      toolType: String(toolType),
      unit: unitValue,
      imageSize: imageFile.size,
    });

    // 6. Save initial tool data to MongoDB (with pending status)
    const tool = new Tool({
      userEmail: decoded.email,
      length: lengthNum,
      depth: depthNum,
      unit: unitValue.toLowerCase().trim(),
      toolBrand: String(toolBrand),
      toolType: String(toolType),
      imageUrl: "", // Will be updated after CV processing
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
    console.log("Tool saved successfully with ID:", tool._id);

    // 7. Start background CV processing
    setImmediate(async () => {
      try {
        console.log(`Starting CV processing for tool ${tool._id}`);

        // Read image file from disk
        const imageBuffer = fs.readFileSync(imageFile.filepath);
        const imageName = imageFile.originalFilename || "tool_image.png";
        const imageType = imageFile.mimetype || "image/png";

        console.log(`Image loaded: ${imageName}, size: ${imageBuffer.length} bytes`);

        // Prepare form data for CV API
        const form = new FormData();
        form.append("image", imageBuffer, {
          filename: imageName,
          contentType: imageType,
        });
        form.append("length", lengthInches.toString());
        form.append("depth", depthInches.toString());

        console.log("Sending to CV endpoint:", {
          endpoint: CV_ENDPOINT,
          lengthInches,
          depthInches,
          imageSize: imageBuffer.length,
        });

        // Call CV API
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

        console.log(`CV response received for tool ${tool._id}:`, cvResponse.data);

        // Check if CV processing was successful
        if (!cvResponse.data.success) {
          throw new Error("CV processing failed: success=false in response");
        }

        // Prepare update data
        const updateData: ToolUpdateData = {
          processingStatus: "completed",
          cvResponse: cvResponse.data,
        };

        // Use annotated image URL if available
        if (cvResponse.data.annotated_image_url) {
          updateData.imageUrl = cvResponse.data.original_img;
        }

        // Update tool with CV response
        await dbConnect();
        await Tool.findByIdAndUpdate(tool._id, updateData);
        console.log(`Tool ${tool._id} updated successfully with CV response`);

        // Clean up temp file
        try {
          fs.unlinkSync(imageFile.filepath);
          console.log(`Temp file deleted: ${imageFile.filepath}`);
        } catch (cleanupError) {
          console.error("Failed to delete temp file:", cleanupError);
        }

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

        // Update tool with failed status
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

        // Clean up temp file even on failure
        try {
          fs.unlinkSync(imageFile.filepath);
        } catch (cleanupError) {
          console.error("Failed to delete temp file:", cleanupError);
        }
      }
    });

    // 8. Respond immediately to client (before CV processing completes)
    return NextResponse.json({
      success: true,
      message: "Tool created successfully. Processing in background.",
      toolId: tool._id,
      tool: {
        id: tool._id,
        userEmail: tool.userEmail,
        length: tool.length,
        depth: tool.depth,
        unit: tool.unit,
        toolBrand: tool.toolBrand,
        toolType: tool.toolType,
        processingStatus: tool.processingStatus,
        likes: tool.likes,
        dislikes: tool.dislikes,
        downloads: tool.downloads,
        published: tool.published,
      }
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