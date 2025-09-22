import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITool extends Document {
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
      index: true,
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
    annotatedImg: {
      type: String,
      trim: true,
    },
    outlinesImg: {
      type: String,
      trim: true,
    },
    diagonalInches: Number,
    dxfLink: String,
    scaleFactor: Number,

    // Published as boolean with default
    published: {
      type: Boolean,
      required: true,
      default: false,
      select: true,
    }

  },
  {
    timestamps: true,
  }
);


const Tool: Model<ITool> =
  mongoose.models.Tool || mongoose.model<ITool>("Tool", ToolSchema);

export default Tool;