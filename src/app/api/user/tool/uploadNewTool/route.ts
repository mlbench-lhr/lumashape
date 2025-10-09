import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import FormData from "form-data";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;
const CV_ENDPOINT = "https://lumashape-canvas-dxf-generation.hf.space/api/image-to-dxf";

// Conversion factor: 1 inch = 25.4 mm
const MM_TO_INCHES = 1 / 25.4;

/**
 * Convert measurement to inches based on unit
 */
function convertToInches(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  
  if (normalizedUnit === "mm" || normalizedUnit === "millimeters") {
    return value * MM_TO_INCHES;
  }
  
  // Default to inches (in, inches, or any other value)
  return value;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Verify JWT token
    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("Authorization: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Parse request body from mobile app
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const length = formData.get("length"); // comes as string from FormData
    const depth = formData.get("depth"); // comes as string from FormData
    const unit = (formData.get("unit") as string) || "inches";
    const toolBrand = formData.get("toolBrand") as string;
    const toolType = formData.get("toolType") as string;

    console.log("Received data from mobile:", { 
      hasImage: !!image,
      imageSize: image?.size,
      imageName: image?.name,
      imageType: image?.type,
      length, 
      depth, 
      unit, 
      toolBrand, 
      toolType 
    });

    // 3. Validate required fields
    if (!image) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!length || !depth || !toolBrand || !toolType) {
      return NextResponse.json(
        { 
          error: "Missing required fields: length, depth, toolBrand, and toolType are required",
          received: { 
            hasLength: !!length, 
            hasDepth: !!depth, 
            hasToolBrand: !!toolBrand, 
            hasToolType: !!toolType 
          }
        },
        { status: 400 }
      );
    }

    // Parse numeric values from mobile (comes as string from FormData)
    const lengthNum = parseFloat(length as string);
    const depthNum = parseFloat(depth as string);

    if (isNaN(lengthNum) || isNaN(depthNum) || lengthNum <= 0 || depthNum <= 0) {
      return NextResponse.json(
        { 
          error: "Length and depth must be valid positive numbers",
          received: { length, depth }
        },
        { status: 400 }
      );
    }

    // Convert to inches for CV processing
    const lengthInches = convertToInches(lengthNum, unit);
    const depthInches = convertToInches(depthNum, unit);

    console.log("Conversion for mobile request:", {
      original: { length: lengthNum, depth: depthNum, unit },
      converted: { length: lengthInches, depth: depthInches, unit: "inches" }
    });

    // Validate image file from mobile
    if (!image.size || image.size === 0) {
      return NextResponse.json(
        { error: "Image file is empty or invalid" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB for mobile uploads)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image file too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // 4. Save initial tool data to MongoDB (store original values + unit)
    const tool = new Tool({
      userEmail: decoded.email,
      length: lengthNum, // Store original value
      depth: depthNum, // Store original value
      unit: unit.toLowerCase().trim(), // Store user's preferred unit
      toolBrand,
      toolType,
      imageUrl: "", // Will be updated from CV response if needed
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

    // 5. Process CV endpoint in background (non-blocking)
    setImmediate(async () => {
      try {
        console.log("Starting background CV processing for tool ID:", tool._id);
        
        // Convert File to Buffer for form-data
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        
        const form = new FormData();
        form.append("image", imageBuffer, {
          filename: image.name || "upload.png",
          contentType: image.type || "image/png",
        });
        // Always send measurements in INCHES to CV endpoint
        form.append("length", lengthInches.toString());
        form.append("depth", depthInches.toString());

        console.log("Sending to CV endpoint (in inches):", {
          length: lengthInches,
          depth: depthInches
        });

        const cvResponse = await axios.post(CV_ENDPOINT, form, {
          headers: {
            ...form.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 300000, // 5 minutes timeout
        });

        console.log("CV Response received:", cvResponse.data);

        // Update tool with CV response
        await dbConnect(); // Ensure connection is still active
        const updateData: any = {
          processingStatus: "completed",
          cvResponse: cvResponse.data,
        };

        // If CV response contains an annotated image URL, update imageUrl
        if (cvResponse.data?.annotated_image_url) {
          updateData.imageUrl = cvResponse.data.annotated_image_url;
        }

        await Tool.findByIdAndUpdate(tool._id, updateData);

        console.log("Tool updated with CV response for tool ID:", tool._id);
      } catch (cvError) {
        console.error("Error processing CV endpoint:", cvError);
        
        const errorMessage = cvError instanceof Error 
          ? cvError.message 
          : "Unknown error occurred during CV processing";

        // Log detailed error info
        if (axios.isAxiosError(cvError)) {
          console.error("Axios error details:", {
            status: cvError.response?.status,
            data: cvError.response?.data,
            message: cvError.message
          });
        }
        
        // Update tool status to failed
        try {
          await dbConnect(); // Ensure connection is still active
          await Tool.findByIdAndUpdate(tool._id, {
            processingStatus: "failed",
            processingError: errorMessage,
          });
          console.log("Tool status updated to failed for tool ID:", tool._id);
        } catch (updateError) {
          console.error("Failed to update tool status:", updateError);
        }
      }
    });

    // 6. Send success response immediately
    return NextResponse.json({
      success: true,
      message: "Tool data saved successfully. Processing in background.",
      toolId: tool._id,
      processingStatus: "pending",
      data: {
        originalUnit: unit,
        originalLength: lengthNum,
        originalDepth: depthNum,
        convertedToInches: {
          length: lengthInches,
          depth: depthInches
        }
      }
    });

  } catch (err) {
    console.error("Error in tool creation route:", err);
    
    const errorMessage = err instanceof Error ? err.message : "Failed to process tool creation";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? err : undefined
      },
      { status: 500 }
    );
  }
}