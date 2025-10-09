import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import FormData from "form-data";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;
const CV_ENDPOINT = "https://lumashape-canvas-dxf-generation.hf.space/api/image-to-dxf";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Verify JWT token
    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("Authorization: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    // 2. Parse request body
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const length = parseFloat(formData.get("length") as string);
    const depth = parseFloat(formData.get("depth") as string);

    // 3. Validate required fields
    if (!image || !length || !depth) {
      return NextResponse.json(
        { error: "Missing required fields: image, length, and depth are required" },
        { status: 400 }
      );
    }

    // 4. Save initial tool data to MongoDB
    const tool = new Tool({
      userEmail: decoded.email,
      length,
      depth,
      imageUrl: "", // Will be updated after processing
      processingStatus: "pending",
      likes: 0,
      dislikes: 0,
      downloads: 0,
      published: false,
      publishedDate: null,
    });

    await tool.save();
    console.log("Tool saved with ID:", tool._id);

    // 5. Send success response immediately
    const responseToUser = NextResponse.json({
      success: true,
      message: "Tool data saved successfully. Processing in background.",
      toolId: tool._id,
    });

    // 6. Process CV endpoint in background (non-blocking)
    // Convert File to Buffer for form-data
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    
    const form = new FormData();
    form.append("image", imageBuffer, {
      filename: image.name,
      contentType: image.type,
    });
    form.append("length", length.toString());
    form.append("depth", depth.toString());

    // Send to CV endpoint asynchronously
    (async () => {
      try {
        console.log("Sending data to CV endpoint...");
        const cvResponse = await axios.post(CV_ENDPOINT, form, {
          headers: {
            ...form.getHeaders(),
          },
          maxBodyLength: Infinity,
          timeout: 300000, // 5 minutes timeout
        });

        console.log("CV Response received:", cvResponse.data);

        // Update tool with CV response
        await dbConnect();
        await Tool.findByIdAndUpdate(tool._id, {
          processingStatus: "completed",
          cvResponse: cvResponse.data,
        });

        console.log("Tool updated with CV response for tool ID:", tool._id);
      } catch (cvError) {
        console.error("Error processing CV endpoint:", cvError);
        
        // Update tool status to failed
        await dbConnect();
        await Tool.findByIdAndUpdate(tool._id, {
          processingStatus: "failed",
          processingError: cvError instanceof Error ? cvError.message : "Unknown error",
        });
      }
    })();

    return responseToUser;
  } catch (err) {
    console.error("Error in tool creation route:", err);
    return NextResponse.json(
      { error: "Failed to process tool creation" },
      { status: 500 }
    );
  }
}