import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import ManufacturingOrder from "@/lib/models/ManufacturingOrder";
import User from "@/lib/models/User";
import Layout from "@/lib/models/layout";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : req.cookies.get("admin-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: { adminId?: string; email?: string; role?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { adminId?: string; email?: string; role?: string };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (!decoded || decoded.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const order = await ManufacturingOrder.findById(id).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buyer = await User.findOne({ email: order.buyerEmail }).lean();

    const layoutIds = Array.isArray(order.items) ? order.items.map(i => i.layoutId).filter(Boolean) : [];
    const layouts = layoutIds.length
      ? await Layout.find({ _id: { $in: layoutIds } }).select('snapshotUrl canvas name').lean()
      : [];
    const layoutMap: Record<string, { snapshotUrl: string | null; canvas: { width: number; height: number; unit: "mm" | "inches"; thickness?: number; materialColor?: string }; name: string }> = {};
    for (const id of layoutIds) {
      const l = layouts.find(l => String(l._id) === String(id));
      if (l) {
        const canvas = (l.canvas || {}) as { width: number; height: number; unit: "mm" | "inches"; thickness?: number; materialColor?: string };
        layoutMap[String(id)] = { snapshotUrl: l.snapshotUrl || null, canvas, name: l.name };
      }
    }

    console.log(layoutMap);

    return NextResponse.json({
      success: true,
      order,
      buyer: buyer ? {
        _id: String(buyer._id),
        firstName: buyer.firstName || "",
        lastName: buyer.lastName || "",
        username: buyer.username || "",
        email: buyer.email || ""
      } : null,
      layouts: layoutMap
    });

  } catch {
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}