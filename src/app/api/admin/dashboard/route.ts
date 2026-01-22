import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import ManufacturingOrder from "@/lib/models/ManufacturingOrder";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import Stripe from "stripe";

const JWT_SECRET = process.env.JWT_SECRET as string;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

interface AdminJwt extends JwtPayload { email: string; role: string }
type MonthSummary = { year: number; month: number; revenue: number; kaiser: number; lumashape: number; orders: number }
type StripeMetrics = { totalTransactions: number; feesCents: number; refundsCents: number }

const rangeForMonth = (d: Date) => {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
};

const labelForMonth = (y: number, m: number) =>
  `${new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short" })} ${String(y)}`;

const subscriptionRevenueCentsForMonth = async (start: Date, end: Date): Promise<number> => {
  const gte = Math.floor(start.getTime() / 1000);
  const lt = Math.floor(end.getTime() / 1000);

  let total = 0;
  let startingAfter: string | undefined = undefined;

  while (true) {
    const invoicePage: Stripe.ApiList<Stripe.Invoice> = await stripe.invoices.list({
      created: { gte, lt },
      limit: 100,
      starting_after: startingAfter,
      status: "paid",
    });

    for (const inv of invoicePage.data) {
      const reason = String((inv as unknown as Record<string, unknown>).billing_reason || "");
      const subscription = (inv as unknown as Record<string, unknown>).subscription;
      const isSubscription = reason.startsWith("subscription");
      if (!isSubscription && !subscription) continue;
      const amountPaid = (inv as unknown as Record<string, unknown>).amount_paid;
      total += typeof amountPaid === "number" ? amountPaid : 0;
    }

    if (!invoicePage.has_more || invoicePage.data.length === 0) break;
    startingAfter = invoicePage.data[invoicePage.data.length - 1].id;
  }

  return total;
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token =
      req.headers.get("Authorization")?.startsWith("Bearer ")
        ? req.headers.get("Authorization")!.substring(7)
        : req.cookies.get("admin-token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: AdminJwt;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === "string") return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      decoded = verified as AdminJwt;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (!decoded || decoded.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const months: { label: string; key: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { start, end } = rangeForMonth(d);
      months.push({
        label: i === 0 ? "This Month" : labelForMonth(d.getFullYear(), d.getMonth() + 1),
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        start,
        end,
      });
    }
    months.reverse();

    const monthly: MonthSummary[] = [];
    const subscriptionRevenueCents: number[] = [];
    for (const m of months) {
      const agg = await ManufacturingOrder.aggregate([
        { $match: { status: "paid", createdAt: { $gte: m.start, $lt: m.end } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totals.customerTotal" },
            kaiser: { $sum: "$totals.kaiserPayout" },
            lumashape: { $sum: "$totals.lumashapePayout" },
            orders: { $sum: 1 },
          },
        },
      ]);
      const row = agg[0] || { revenue: 0, kaiser: 0, lumashape: 0, orders: 0 };
      monthly.push({
        year: m.start.getFullYear(),
        month: m.start.getMonth() + 1,
        revenue: row.revenue || 0,
        kaiser: row.kaiser || 0,
        lumashape: row.lumashape || 0,
        orders: row.orders || 0,
      });

      try {
        subscriptionRevenueCents.push(await subscriptionRevenueCentsForMonth(m.start, m.end));
      } catch {
        subscriptionRevenueCents.push(0);
      }
    }

    const thisIdx = monthly.length - 1;
    const prevIdx = thisIdx - 1;
    const summaryThis = monthly[thisIdx] || { revenue: 0, kaiser: 0, lumashape: 0, orders: 0, year: now.getFullYear(), month: now.getMonth() + 1 };
    const summaryPrev = monthly[prevIdx] || { revenue: 0, kaiser: 0, lumashape: 0, orders: 0, year: now.getFullYear(), month: now.getMonth() };
    const growth = summaryPrev.revenue ? (summaryThis.revenue - summaryPrev.revenue) / summaryPrev.revenue : 0;

    const { start, end } = rangeForMonth(now);
    const txs = await Transaction.find({ status: "paid", createdAt: { $gte: start, $lt: end } })
      .select("stripePaymentIntentId")
      .lean();

    let feesCents = 0;
    let refundsCents = 0;
    for (const tx of txs) {
      if (!tx.stripePaymentIntentId) continue;
      try {
        const chargeList = await stripe.charges.list({
          payment_intent: tx.stripePaymentIntentId,
          expand: ["data.balance_transaction"],
          limit: 100,
        });
        for (const c of chargeList.data) {
          const bt = c.balance_transaction;
          if (typeof bt === "string") {
            const real = await stripe.balanceTransactions.retrieve(bt);
            feesCents += real.fee || 0;
          } else if (bt && typeof bt === "object") {
            feesCents += (bt as Stripe.BalanceTransaction).fee || 0;
          }
          refundsCents += c.amount_refunded || 0;
        }
      } catch {}
    }
    const stripeMetrics: StripeMetrics = { totalTransactions: txs.length, feesCents, refundsCents };

    const latestUsers = await User.find({})
      .select("username email avatar profilePic createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const userMonthly: { label: string; count: number }[] = [];
    for (const m of months) {
      const count = await User.countDocuments({ createdAt: { $gte: m.start, $lt: m.end } });
      userMonthly.push({ label: m.label, count });
    }
    const userGrowth = userMonthly.length > 1 && userMonthly[userMonthly.length - 2].count
      ? (userMonthly[userMonthly.length - 1].count - userMonthly[userMonthly.length - 2].count) /
        userMonthly[userMonthly.length - 2].count
      : 0;

    return NextResponse.json({
      summary: {
        label: "This Month",
        revenue: summaryThis.revenue,
        kaiser: summaryThis.kaiser,
        lumashape: summaryThis.lumashape,
        orders: summaryThis.orders,
        growth,
      },
      monthlyRevenue: monthly.map((m, i) => ({
        label: months[i].label,
        revenue: m.revenue,
        kaiser: m.kaiser,
        lumashape: m.lumashape,
        orders: m.orders,
        subscriptionRevenue: (subscriptionRevenueCents[i] || 0) / 100,
        year: m.year,
        month: m.month,
        key: `${m.year}-${m.month}`,
      })),
      stripeMetrics,
      latestUsers,
      userInsights: { monthly: userMonthly, growth: userGrowth },
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}