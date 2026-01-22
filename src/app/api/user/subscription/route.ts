import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import dbConnect from "@/utils/dbConnect";
import User, { IUser } from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

type Plan = "Free" | "Pro" | null;
type Status = "active" | "canceled" | "past_due" | "trialing" | "incomplete" | null;

type SubscriptionInfo = {
  plan: Plan;
  status: Status;
  interval: 'month' | 'year' | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  dxfDownloadsUsed: number;
  stripeCustomerId: string | null;
};

type InvoiceItem = {
  id: string;
  number?: string | null;
  amountPaidCents: number;
  status: string;
  created: string;
  hostedInvoiceUrl?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const auth = req.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    const user = await User.findOne({ email: decoded.email }).lean<IUser>();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sub: SubscriptionInfo = {
      plan: user.subscriptionPlan === "Pro" ? "Pro" : "Free",
      status:
        user.subscriptionStatus === "active" ||
        user.subscriptionStatus === "canceled" ||
        user.subscriptionStatus === "past_due" ||
        user.subscriptionStatus === "trialing" ||
        user.subscriptionStatus === "incomplete"
          ? user.subscriptionStatus
          : null,
      interval: null,
      periodStart: null,
      periodEnd: user.subscriptionPeriodEnd
        ? new Date(user.subscriptionPeriodEnd).toISOString()
        : null,
      cancelAtPeriodEnd: false,
      dxfDownloadsUsed:
        typeof user.dxfDownloadsUsed === "number" ? user.dxfDownloadsUsed : 0,
      stripeCustomerId: user.stripeCustomerId || null,
    };

    let invoices: InvoiceItem[] = [];
    if (STRIPE_SECRET_KEY && sub.stripeCustomerId) {
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

      try {
        const active = user.subscriptionId
          ? await stripe.subscriptions.retrieve(user.subscriptionId)
          : (await stripe.subscriptions.list({ customer: sub.stripeCustomerId, status: 'active', limit: 1 })).data[0];
        if (active) {
          const price = active.items.data[0]?.price;
          const interval = price?.recurring?.interval || null;
          const pStart = (active as any).current_period_start as number | undefined;
          const pEnd = (active as any).current_period_end as number | undefined;
          const cancelAt = (active as any).cancel_at_period_end;
          sub.interval = interval as 'month' | 'year' | null;
          sub.periodStart = pStart ? new Date(pStart * 1000).toISOString() : sub.periodStart;
          sub.periodEnd = pEnd ? new Date(pEnd * 1000).toISOString() : sub.periodEnd;
          sub.cancelAtPeriodEnd = Boolean(cancelAt);
        }
      } catch {}

      const list = await stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 12 });
      invoices = list.data.map((inv) => ({
        id: String(inv.id || ''),
        number: inv.number || null,
        amountPaidCents: typeof inv.amount_paid === 'number' ? inv.amount_paid : 0,
        status: String(inv.status || 'unknown'),
        created: inv.created ? new Date(inv.created * 1000).toISOString() : new Date().toISOString(),
        hostedInvoiceUrl: inv.hosted_invoice_url || null,
      }));
    }

    return NextResponse.json({ success: true, subscription: sub, invoices });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}