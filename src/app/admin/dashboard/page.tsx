"use client";
import React from "react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          <div className="w-72">
            <input
              placeholder="Search..."
              className="w-full px-4 py-2 border border-[#E6E6E6] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <img src="/images/icons/bell.svg" alt="Notifications" className="w-5 h-5" />
        </div>
      </div>
      <div className="rounded-xl border border-[#E6E6E6] bg-white shadow-sm">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-semibold text-secondary bg-[#F9FAFB] rounded-t-xl">
          <div>Order ID</div>
          <div>Date Ordered</div>
          <div>Amount</div>
          <div>Action</div>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-t text-sm text-gray-700">
            <div>{`#ORD${2237 + i}`}</div>
            <div>12 Nov 2025</div>
            <div>$120</div>
            <div>
              <button className="text-primary underline">View Details</button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <button className="px-3 py-1 rounded border border-[#E6E6E6] text-gray-700">Previous</button>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 rounded bg-primary text-white">1</span>
            <span className="px-3 py-1 rounded border border-[#E6E6E6] text-gray-700">2</span>
            <span className="px-3 py-1 rounded border border-[#E6E6E6] text-gray-700">3</span>
          </div>
          <button className="px-3 py-1 rounded border border-[#E6E6E6] text-gray-700">Next</button>
        </div>
      </div>
    </div>
  );
}