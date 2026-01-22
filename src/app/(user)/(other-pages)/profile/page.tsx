"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import MyLayouts from "./MyLayouts/page";
import MyToolContours from "./MyToolContours/page";
import { useUser } from "@/context/UserContext";

interface User {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  status: string;
  isPublic: boolean;
  profilePic: string;
  bio: string;
  avatar?: string;
  followers: number;
  following: number;
}

interface Stats {
  upvotes: number;
  downvotes: number;
  downloads: number;
}

interface Counts {
  publishedLayouts: number;
  publishedTools: number;
}

interface ProfileData {
  user: User;
  stats: Stats;
  counts: Counts;
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<
    "layouts" | "contours" | "subscription"
  >("layouts");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<{
    plan: "Free" | "Pro" | null;
    status:
      | "active"
      | "canceled"
      | "past_due"
      | "trialing"
      | "incomplete"
      | null;
    interval: "month" | "year" | null;
    periodStart: string | null;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    dxfDownloadsUsed: number;
    stripeCustomerId: string | null;
  } | null>(null);
  const [invoices, setInvoices] = useState<
    Array<{
      id: string;
      number?: string | null;
      amountPaidCents: number;
      status: string;
      created: string;
      hostedInvoiceUrl?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { logout } = useUser();

  useEffect(() => {
    if (!localStorage.getItem("auth-token")) {
      router.push("/auth/login");
    }
  }, []);

  // Profile circle rendering
  const renderProfileImage = () => {
    if (user?.profilePic) {
      return (
        <img
          src={user.profilePic}
          alt="Profile"
          className="w-full h-full rounded-full object-cover"
        />
      );
    } else if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt="Avatar"
          className="w-full h-full rounded-full object-cover"
        />
      );
    } else {
      return (
        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">
          {user?.firstName?.charAt(0).toUpperCase() || "M"}
          {user?.lastName?.charAt(0).toUpperCase() || "M"}
        </div>
      );
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchSubscriptionData();
  }, []);

  const getAuthToken = () => localStorage.getItem("auth-token") || "";

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch profile data");
      const data: ProfileData = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const res = await fetch("/api/user/subscription", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.subscription) setSubscription(json.subscription);
      if (Array.isArray(json?.invoices)) setInvoices(json.invoices);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse text-gray-500">
              Loading profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-red-500">Error loading profile: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, counts } = profileData;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 lg:p-8 flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6 min-h-[120px] sm:min-h-[150px] md:min-h-[200px]">
          {/* Avatar */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 self-start">
            {renderProfileImage()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">
                {user.firstName} {user.lastName}
              </h2>
              <span className="bg-blue-100 text-primary text-xs font-medium px-2 py-1 rounded-4xl flex-shrink-0">
                {user.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm line-clamp-2">
              {user.bio}
            </p>

            {/* Followers */}
            {/* <div className="flex gap-4 sm:gap-6 md:gap-8 mt-2">
              <div className="text-center">
                <p className="text-sm sm:text-base md:text-lg font-bold">{user.followers}</p>
                <p className="text-gray-600 text-xs">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-base md:text-lg font-bold">{user.following}</p>
                <p className="text-gray-600 text-xs">Following</p>
              </div>
            </div> */}
          </div>

          <button
            onClick={() => router.push("/profile/edit/ProfitSharing")}
            className="flex items-center mr-6 gap-2 bg-primary text-white px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm md:px-8 md:py-4 md:text-base rounded-lg font-semibold cursor-pointer hover:bg-primary/90 transition"
          >
            Profit Sharing
            <img
              src="/images/icons/profile/profit.svg"
              alt="Logout"
              className="w-5 h-5"
            />
          </button>

          {/* Edit Profile Button */}
          <button
            onClick={() => {
              // Save user details in localStorage
              localStorage.setItem(
                "edit-profile-data",
                JSON.stringify({
                  firstName: user.firstName,
                  lastName: user.lastName,
                  username: user.username,
                  email: user.email,
                  avatar: user.avatar || "",
                  profilePic: user.profilePic || "",
                  isPublic: user.isPublic,
                  bio: user.bio || "",
                }),
              );

              // Redirect to edit profile page
              router.push("/profile/edit");
            }}
            className="bg-primary text-white px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm md:px-8 md:py-4 md:text-base rounded-lg font-semibold cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm md:px-8 md:py-4 md:text-base rounded-lg font-semibold cursor-pointer hover:bg-primary/90 transition"
          >
            <img
              src="/images/icons/profile/logout.svg" // 🟢 Replace this with your actual icon path
              alt="Logout icon"
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
            Logout
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-10">
          <div className="bg-blue-50 rounded-2xl sm:rounded-3xl md:rounded-4xl shadow p-3 sm:p-4 md:p-6 text-center">
            {/* Counts (bigger on mobile, scale up later) */}
            <p className="text-primary font-semibold text-2xl sm:text-xl md:text-2xl lg:text-3xl">
              {stats.upvotes.toLocaleString()}
            </p>
            {/* Labels (smaller on mobile, scale up later) */}
            <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">
              Total Upvotes
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl sm:rounded-3xl md:rounded-4xl shadow p-3 sm:p-4 md:p-6 text-center">
            <p className="text-primary font-semibold text-2xl sm:text-xl md:text-2xl lg:text-3xl">
              {stats.downvotes.toLocaleString()}
            </p>
            <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">
              Total Downvotes
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl sm:rounded-3xl md:rounded-4xl shadow p-3 sm:p-4 md:p-6 text-center">
            <p className="text-primary font-semibold text-2xl sm:text-xl md:text-2xl lg:text-3xl">
              {stats.downloads.toLocaleString()}
            </p>
            <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">
              Total Downloads
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mt-6 sm:mt-8 md:mt-10 border-b border-gray-200">
          {/* Left Tabs */}
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("layouts")}
              className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "layouts" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              My Published Layouts
            </button>
            <button
              onClick={() => setActiveTab("contours")}
              className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "contours" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              My Published Tool Contours
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "subscription" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              Subscription
            </button>
          </div>

          {/* Right-aligned Profit Sharing Button */}
          <button
            onClick={() => router.push("/profile/edit/ProfitSharing")}
            className="flex items-center mb-3 mr-3 gap-2 bg-primary text-white px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm md:px-8 md:py-4 md:text-base rounded-lg font-semibold cursor-pointer hover:bg-primary/90 transition"
          >
            Profit Sharing
            <img
              src="/images/icons/profile/profit.svg"
              alt="Logout"
              className="w-5 h-5"
            />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "layouts" ? (
          <MyLayouts />
        ) : activeTab === "contours" ? (
          <MyToolContours />
        ) : (
          <div className="mt-8 space-y-6">
            {/* Subscription Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Plan Card */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-md">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Current Plan
                      </p>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {subscription?.plan || "Free"}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      subscription?.status === "active"
                        ? "bg-green-100 text-green-700"
                        : subscription?.status === "canceled"
                          ? "bg-red-100 text-red-700"
                          : subscription?.status === "past_due"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {subscription?.status || "Inactive"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">
                      Billing Cycle
                    </span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {subscription?.interval === "month"
                        ? "Monthly"
                        : subscription?.interval === "year"
                          ? "Yearly"
                          : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">
                      Renewal Date
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {subscription?.periodEnd
                        ? new Date(subscription.periodEnd).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )
                        : subscription?.periodStart
                          ? new Date(
                              new Date(subscription.periodStart).getTime() +
                                30 * 24 * 60 * 60 * 1000,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                    </span>
                  </div>
                </div>

                {(!subscription || subscription.plan === "Free") && (
                  <button
                    onClick={() => (window.location.href = "/#pricing")}
                    className="mt-6 w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>

              {/* DXF Downloads Card */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      DXF Downloads
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {subscription?.plan === "Pro"
                        ? "Unlimited"
                        : `${Math.max(0, 10 - (subscription?.dxfDownloadsUsed ?? 0))}/10`}
                    </h3>
                  </div>
                </div>

                {subscription?.plan !== "Pro" && (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Downloads Used</span>
                        <span className="font-semibold text-gray-900">
                          {subscription?.dxfDownloadsUsed ?? 0} / 10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${((subscription?.dxfDownloadsUsed ?? 0) / 10) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      {Math.max(0, 10 - (subscription?.dxfDownloadsUsed ?? 0))}{" "}
                      downloads remaining this month
                    </p>
                  </>
                )}

                {subscription?.plan === "Pro" && (
                  <div className="bg-purple-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Unlimited downloads with Pro
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription History */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">
                  Billing History
                </h4>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Invoice
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoices || []).length ? (
                      (invoices || []).map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {new Date(inv.created).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-4 text-sm">
                            {inv.hostedInvoiceUrl ? (
                              <a
                                className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                                href={inv.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {inv.number || inv.id}
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-900">
                                {inv.number || inv.id}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                            ${(inv.amountPaidCents / 100).toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                inv.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : inv.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="py-8 text-center text-gray-500"
                          colSpan={4}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <svg
                              className="w-12 h-12 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <p className="text-sm">No invoices yet</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      {/*Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center p-6 pb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                  <span className="text-white text-2xl font-bold">!</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Logout?</h2>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex w-full gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout(); // 👈 Call actual logout
                  }}
                  className="flex-1 py-3 bg-primary text-white rounded-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
