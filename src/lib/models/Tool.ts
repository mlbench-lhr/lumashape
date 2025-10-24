import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICCVResponse {
  success?: boolean;
  dxf_url?: string;
  annotated_image_url?: string;
  contour_image_url?: string;
  contour_points_count?: number;
  expansion_pixels?: number;
  dimensions?: {
    length_inches?: number;
    depth_inches?: number;
  };
  [key: string]: string | number | boolean | object | undefined;
}

export interface ITool extends Document {
  userEmail: string;
  toolBrand: string;
  toolType: string;
  SKUorPartNumber: string;
  length: number;
  depth: number;
  unit: string; // Added unit field
  imageUrl: string;
  processingStatus: "pending" | "completed" | "failed";
  cvResponse?: ICCVResponse | null;
  processingError?: string | null;
  published: boolean;
  likes: number;
  dislikes: number;
  downloads: number;
  publishedDate?: Date | null;
  likedByUsers: string[];
  dislikedByUsers: string[];
  downloadedByUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ToolSchema: Schema<ITool> = new mongoose.Schema(
  {
    userEmail: { 
      type: String, 
      required: true, 
      trim: true, 
      lowercase: true, 
      index: true 
    },
    toolBrand: { 
      type: String, 
      required: true, 
      trim: true 
    },
    toolType: { 
      type: String, 
      required: true, 
      trim: true 
    },
    SKUorPartNumber: { 
      type: String,
      trim: true 
    },
    length: { 
      type: Number, 
      required: true 
    },
    depth: { 
      type: Number, 
      required: true 
    },
    unit: { 
      type: String, 
      required: true, 
      default: "inches",
      trim: true 
    },
    imageUrl: { 
      type: String, 
      default: "" 
    },
    processingStatus: { 
      type: String, 
      required: true, 
      default: "pending",
      enum: ["pending", "completed", "failed"]
    },
    cvResponse: { 
      type: Schema.Types.Mixed, 
      default: null 
    },
    processingError: { 
      type: String, 
      default: null 
    },
    published: { 
      type: Boolean, 
      required: true, 
      default: false 
    },
    likes: { 
      type: Number, 
      default: 0,
      min: 0
    },
    dislikes: { 
      type: Number, 
      default: 0,
      min: 0
    },
    downloads: { 
      type: Number, 
      default: 0,
      min: 0
    },
    publishedDate: { 
      type: Date, 
      default: null 
    },
    likedByUsers: [{ 
      type: String, 
      trim: true, 
      lowercase: true 
    }],
    dislikedByUsers: [{ 
      type: String, 
      trim: true, 
      lowercase: true 
    }],
    downloadedByUsers: [{ 
      type: String, 
      trim: true, 
      lowercase: true 
    }],
  },
  {
    timestamps: true,
  }
);

// Add indexes for common queries
ToolSchema.index({ published: 1, publishedDate: -1 });
ToolSchema.index({ userEmail: 1, createdAt: -1 });

const Tool: Model<ITool> =
  mongoose.models.Tool || mongoose.model<ITool>("Tool", ToolSchema);

export default Tool;