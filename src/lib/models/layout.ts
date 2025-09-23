// /lib/models/layout.ts
import mongoose, { Document, Model } from "mongoose";

/* ---------------------- Types ---------------------- */

interface Tool {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  thickness: number;
  unit: "mm" | "inches";
  opacity: number;
  smooth: number;
  image: string;
  groupId?: string | null;
}

interface Canvas {
  width: number;
  height: number;
  unit: "mm" | "inches";
  thickness: number;
}

interface Stats {
  totalTools: number;
  validLayout: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayoutAttrs {
  userEmail: string;
  name: string;
  description?: string;
  canvas: Canvas;
  tools: Tool[];
  stats: Stats;
  snapshotUrl?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  isPublic?: boolean;
}

export interface LayoutMethods {
  validateLayout(): boolean;
  getSummary(): {
    id: string;
    name: string;
    description: string;
    toolCount: number;
    canvasSize: string;
    isValid: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export type LayoutDocument = Document & LayoutAttrs & LayoutMethods;

export interface LayoutModel extends Model<LayoutDocument> {
  findByUser(userEmail: string, options?: Record<string, unknown>): Promise<LayoutDocument[]>;
}

/* ---------------------- Schemas ---------------------- */

// Tool Schema
const ToolSchema = new mongoose.Schema<Tool>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    rotation: { type: Number, required: true, default: 0 },
    flipHorizontal: { type: Boolean, required: true, default: false },
    flipVertical: { type: Boolean, required: true, default: false },
    thickness: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ["mm", "inches"] },
    opacity: { type: Number, min: 0, max: 100, default: 100 },
    smooth: { type: Number, min: 0, max: 100, default: 0 },
    image: { type: String, default: "" },
    groupId: { type: String, default: null },
  },
  { _id: false }
);

// Canvas Schema
const CanvasSchema = new mongoose.Schema<Canvas>(
  {
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, enum: ["mm", "inches"] },
    thickness: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Stats Schema
const StatsSchema = new mongoose.Schema<Stats>(
  {
    totalTools: { type: Number, required: true, min: 0 },
    validLayout: { type: Boolean, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

// Main Layout Schema
const LayoutSchema = new mongoose.Schema<LayoutDocument, LayoutModel>(
  {
    userEmail: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxLength: 255 },
    description: { type: String, trim: true, maxLength: 1000, default: "" },
    canvas: { type: CanvasSchema, required: true },
    tools: {
      type: [ToolSchema],
      required: true,
      validate: {
        validator: function (tools: Tool[]) {
          return tools.length > 0;
        },
        message: "Layout must contain at least one tool",
      },
    },
    stats: { type: StatsSchema, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    snapshotUrl: { type: String },
    tags: [{ type: String, trim: true, maxLength: 50 }],
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

/* ---------------------- Indexes ---------------------- */
LayoutSchema.index({ userEmail: 1, "stats.updatedAt": -1 });
LayoutSchema.index({ name: 1 });
LayoutSchema.index({ "stats.createdAt": -1 });
LayoutSchema.index({ tags: 1 });
LayoutSchema.index({ isPublic: 1 });

/* ---------------------- Middleware ---------------------- */
LayoutSchema.pre("save", function (next) {
  if (this.isModified("tools")) {
    this.stats.totalTools = this.tools.length;
    this.stats.updatedAt = new Date();

    // validate layout
    this.stats.validLayout = this.validateLayout();
  }
  next();
});

/* ---------------------- Methods ---------------------- */
LayoutSchema.methods.validateLayout = function (): boolean {
  const tools = this.tools;
  const toolSize = 80; // Assuming fixed tool size

  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const tool1 = tools[i];
      const tool2 = tools[j];

      const dx = Math.abs(tool1.x - tool2.x);
      const dy = Math.abs(tool1.y - tool2.y);

      if (dx < toolSize && dy < toolSize) {
        return false; // Overlap detected
      }
    }
  }
  return true;
};

LayoutSchema.methods.getSummary = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    toolCount: this.stats.totalTools,
    canvasSize: `${this.canvas.width}×${this.canvas.height} ${this.canvas.unit}`,
    isValid: this.stats.validLayout,
    createdAt: this.stats.createdAt,
    updatedAt: this.stats.updatedAt,
  };
};

/* ---------------------- Statics ---------------------- */
LayoutSchema.statics.findByUser = function (userEmail: string, options = {}) {
  return this.find({ userEmail, ...options }).sort({ "stats.updatedAt": -1 });
};

/* ---------------------- Model ---------------------- */
const Layout =
  (mongoose.models.Layout as LayoutModel) ||
  mongoose.model<LayoutDocument, LayoutModel>("Layout", LayoutSchema);

export default Layout;
