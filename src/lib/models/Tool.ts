import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITool extends Document {
  originalToolId: mongoose.Schema.Types.ObjectId;
  userEmail: string;
  paperType: string;
  brand: string;
  toolType: string;
  description?: string;
  purchaseLink?: string;
  backgroundImg?: string;
  annotatedImg?: string;
  outlinesImg?: string;
  diagonalInches?: number;
  dxfLink?: string;
  scaleFactor?: number;
  published: boolean;
  likes: number;
  dislikes: number;
  downloads: number;
  publishedDate?: Date | null;
  // New fields to track user interactions
  likedByUsers: string[]; // Array of user emails who liked this tool
  dislikedByUsers: string[]; // Array of user emails who disliked this tool
  downloadedByUsers: string[]; // Array of user emails who downloaded this tool
  createdAt: Date;
  updatedAt: Date;
}

const ToolSchema: Schema<ITool> = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    paperType: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    toolType: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    purchaseLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: "Purchase link must be a valid URL",
      },
    },
    annotatedImg: { type: String, trim: true },
    outlinesImg: { type: String, trim: true },
    diagonalInches: Number,
    dxfLink: String,
    scaleFactor: Number,

    // Published flag
    published: { type: Boolean, required: true, default: false, select: true },

    // Interaction counts
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    publishedDate: { type: Date, default: null },
    
    // User interaction tracking
    likedByUsers: [{ type: String, trim: true, lowercase: true }],
    dislikedByUsers: [{ type: String, trim: true, lowercase: true }],
    downloadedByUsers: [{ type: String, trim: true, lowercase: true }],
    
    originalToolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tool',
      required: false
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance on user interactions
ToolSchema.index({ likedByUsers: 1 });
ToolSchema.index({ dislikedByUsers: 1 });
ToolSchema.index({ downloadedByUsers: 1 });

const Tool: Model<ITool> =
  mongoose.models.Tool || mongoose.model<ITool>("Tool", ToolSchema);

export default Tool;