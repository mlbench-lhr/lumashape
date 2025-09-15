import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITool extends Document {
  userEmail: string;
  paperType: string;
  brand: string;
  toolType: string;
  description?: string;
  purchaseLink?: string;
  backgroundImg?: string;
  annotatedImg?: string; // NEW: Store annotated image URL
  outlinesImg?: string;  // NEW: Store outlines image URL
  processingData?: string; // NEW: Store server response as JSON string
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
      index: true, // foreign key reference to User.email
    },
    paperType: {
      type: String,
      required: [true, "Paper type is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    toolType: {
      type: String,
      required: [true, "Tool type is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
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
    backgroundImg: {
      type: String,
      trim: true,
    },
    annotatedImg: {
      type: String,
      trim: true,
    },
    outlinesImg: {
      type: String,
      trim: true,
    },
    processingData: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Tool: Model<ITool> =
  mongoose.models.Tool || mongoose.model<ITool>("Tool", ToolSchema);

export default Tool;