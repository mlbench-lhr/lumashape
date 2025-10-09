import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICCVResponse {
  dxfUrl?: string;
  [key: string]: string | number | boolean | object | undefined;
}

export interface ITool extends Document {
  userEmail: string;
  toolBrand: string;
  toolType: string;
  length: number;
  depth: number;
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
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    toolBrand: { type: String, required: true, trim: true },
    toolType: { type: String, required: true, trim: true },
    length: { type: Number, required: true },
    depth: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    processingStatus: { type: String, required: true, default: "pending" },
    cvResponse: { type: Schema.Types.Mixed, default: null }, // stores ICCVResponse
    processingError: { type: String, default: null },
    published: { type: Boolean, required: true, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    publishedDate: { type: Date, default: null },
    likedByUsers: [{ type: String, trim: true, lowercase: true }],
    dislikedByUsers: [{ type: String, trim: true, lowercase: true }],
    downloadedByUsers: [{ type: String, trim: true, lowercase: true }],
  },
  {
    timestamps: true,
  }
);

const Tool: Model<ITool> =
  mongoose.models.Tool || mongoose.model<ITool>("Tool", ToolSchema);

export default Tool;
