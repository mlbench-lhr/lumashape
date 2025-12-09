import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import ManufacturingOrder, { IManufacturingOrder } from "@/lib/models/ManufacturingOrder";
import { FilterQuery, Types } from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface JwtAdminPayload extends JwtPayload {
  email: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("Authorization");
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies.get("admin-token")?.value;

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: JwtAdminPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === "string") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      decoded = verified as JwtAdminPayload;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded || decoded.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get("limit") || "10", 10))
    );
    const search = (searchParams.get("search") || "").trim();
    const statusParam = (searchParams.get("status") || "").trim();

    const query: FilterQuery<IManufacturingOrder> = {};
    if (statusParam && ["pending", "paid", "failed"].includes(statusParam)) {
      query.status = statusParam as IManufacturingOrder["status"];
    } else {
      query.status = "paid";
    }
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { buyerEmail: rx },
        { stripePaymentIntentId: rx },
        { stripeSessionId: rx },
        ...(Types.ObjectId.isValid(search) ? [{ _id: new Types.ObjectId(search) }] : []),
      ];
    }

    const total = await ManufacturingOrder.countDocuments(query);

    // **Return an array type** from lean
    const orders = await ManufacturingOrder.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean<Array<{
        _id: Types.ObjectId;
        buyerEmail: string;
        status: string;
        createdAt: Date;
        totals?: { customerTotal: number; kaiserPayout?: number; lumashapePayout?: number };
        items?: { quantity?: number }[];
      }>>();

    const mapped = orders.map((o) => ({
      _id: o._id.toString(),
      buyerEmail: o.buyerEmail,
      status: o.status,
      createdAt: o.createdAt,
      total: o.totals?.customerTotal ?? 0,
      kaiser: o.totals?.kaiserPayout ?? 0,
      lumashape: o.totals?.lumashapePayout ?? 0,
      itemsCount: Array.isArray(o.items)
        ? o.items.reduce((s, i) => s + (i.quantity ?? 0), 0)
        : 0,
    }));

    return NextResponse.json({ success: true, orders: mapped, total, page, perPage });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
