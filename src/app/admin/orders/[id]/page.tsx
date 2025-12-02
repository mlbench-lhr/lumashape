"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Download, Eye, MapPin, Phone, Mail } from "lucide-react";
import { calculateUnitMaterialCostWithWaste, DEFAULT_PRICING } from "@/utils/pricing";

type Canvas = { width: number; height: number; unit: "mm" | "inches"; thickness: number; materialColor?: string };
type OrderItem = { layoutId: string; name: string; quantity: number; canvas?: Canvas; hasTextEngraving: boolean; dxfUrl?: string };
type Totals = { customerTotal: number };
type Shipping = { name?: string; email?: string; address1?: string; address2?: string; city?: string; state?: string; postalCode?: string; country?: string; phone?: string };
type Buyer = { firstName?: string; lastName?: string; username?: string; email?: string };
type Order = { _id: string; status: "pending" | "paid" | "failed"; items: OrderItem[]; totals: Totals; shipping?: Shipping; createdAt: string; updatedAt?: string };
type LayoutInfo = { snapshotUrl?: string | null; canvas?: Canvas; name?: string };

// const StatusBadge = ({ status }: { status: "pending" | "paid" | "failed" }) => {
//   const configs = {
//     paid: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: CheckCircle, label: "Paid" },
//     failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle, label: "Failed" },
//     pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: Clock, label: "Pending" }
//   };
//   const config = configs[status];
//   const Icon = config.icon;
//   return (
//     <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
//       <Icon className="w-4 h-4" />
//       <span className="font-medium">{config.label}</span>
//     </div>
//   );
// };

export default function AdminOrderDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  // hydrated from admin order details API for snapshot previews and dimensions
  const [layouts, setLayouts] = useState<Record<string, LayoutInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : null;
        if (!token) return router.push("/admin/login");
        const res = await fetch(`/api/admin/orders/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.success) { setOrder(data.order); setBuyer(data.buyer || null); setLayouts(data.layouts || {}); }
      } finally {
        setLoading(false);
      }
    };
    if (params.id) run();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="w-32 h-5 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        </div>



      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <Link href="/admin/orders" className="text-[#2E6C99] hover:text-[#235478] font-medium transition-colors">
              Back to All Orders
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">The order you’re looking for does not exist or you don’t have access to view it.</p>
            <Link href="/admin/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E6C99] text-white rounded-lg hover:bg-[#235478] transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Return to All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shortId = `#${order._id.slice(-8).toUpperCase()}`;
  const dateOrdered = new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const totalTop = order.totals.customerTotal;
  const shippingAddress = order.shipping
    ? [order.shipping.address1, order.shipping.address2, order.shipping.city, order.shipping.state, order.shipping.postalCode].filter(Boolean).join(", ") + (order.shipping.country ? `, ${order.shipping.country}` : "")
    : "-";
  const lineItemAmount = (item: OrderItem) => {
    const c = item.canvas;
    if (!c) return 0;
    const unitCost = calculateUnitMaterialCostWithWaste({ width: c.width, height: c.height, thickness: c.thickness, unit: c.unit }, DEFAULT_PRICING);
    const engraving = item.hasTextEngraving ? DEFAULT_PRICING.engravingFlatFee : 0;
    return Math.round((unitCost * item.quantity + engraving) * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            View Details
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">Order {shortId}</div>
            <div className="text-gray-900 font-semibold">${totalTop.toFixed(1)}</div>
          </div>
          <div className="mt-2 text-gray-600">Date Ordered: {dateOrdered}</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-sm text-gray-600">First Name:<span className="ml-2 text-gray-900">{buyer?.firstName || "-"}</span></div>
            <div className="text-sm text-gray-600">Last Name:<span className="ml-2 text-gray-900">{buyer?.lastName || "-"}</span></div>
            <div className="text-sm text-gray-600">Username:<span className="ml-2 text-gray-900">{buyer?.username || "-"}</span></div>
            <div className="text-sm text-gray-600">Email Address:<span className="ml-2 text-gray-900">{buyer?.email || "-"}</span></div>
            <div className="col-span-2 text-sm text-gray-600">Shipping Address:<span className="ml-2 text-gray-900">{shippingAddress}</span></div>
          </div>
        </div>

        <div className="mb-3"><h2 className="text-base font-semibold">Cart</h2></div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Line Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Layout name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Qty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item, idx) => {
                  const line = String(idx + 1).padStart(4, '0');
                  const amount = lineItemAmount(item);
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{line}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{layouts[item.layoutId]?.name || item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${amount.toFixed(0)}</td>
                      <td className="px-6 py-4 text-sm">
                        {item.dxfUrl ? (
                          <a href={item.dxfUrl} download={`${item.name || 'layout'}.dxf`} className="text-[#2E6C99] underline">Download DXF</a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2"><h3 className="text-base font-semibold">Layouts</h3></div>
          <div className="flex flex-wrap justify-start gap-4">
            {order.items.map((item) => {
              const layout = layouts[item.layoutId] || {};
              const canvas = layout.canvas || item.canvas;
              return (
                <div key={item.layoutId} className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[248px] sm:w-[266px] sm:h-[248px] relative">
                  <div className="relative inline-block" data-dropdown>
                    <div className="w-[258px] sm:w-[242px]">
                      <div className="relative w-full h-[150px]">
                        {layout.snapshotUrl ? (
                          <img src={layout.snapshotUrl} alt={`${layout.name || item.name} layout`} className="absolute inset-0 w-full h-full object-contain" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-100">
                            <div className="relative w-[80px] h-[80px]">
                              <img src="/images/icons/workspace/noLayouts.svg" alt="layout" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        )}
                        <button
                          className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/inspect-layout/${item.layoutId}`);
                          }}
                        >
                          <svg className="w-4 h-4 text-[#266ca8]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-[70px] flex flex-col justify-center px-2">
                      <div className="flex items-baseline gap-[3px]">
                        <h3 className="font-bold text-[16px] truncate mt-2">{layout.name || item.name}</h3>
                      </div>
                      <div className="text-[12px] text-[#b3b3b3] font-medium leading-tight space-y-[2px]">
                        <div className="flex justify-between">
                          <span>Length:</span>
                          <span className="font-semibold text-gray-800">{canvas?.height ?? "-"} {canvas?.unit ?? ""}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Width:</span>
                          <span className="font-semibold text-gray-800">{canvas?.width ?? "-"} {canvas?.unit ?? ""}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Thickness:</span>
                          <span className="font-semibold text-gray-800">{canvas?.thickness ?? "-"} {canvas?.unit ?? ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}