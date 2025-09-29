"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import MyLayouts from "./MyLayouts/page";
import MyToolContours from "./MyToolContours/page";

interface User {
  name: string;
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
  const [activeTab, setActiveTab] = useState<"layouts" | "contours">("layouts");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
          {user?.name?.charAt(0).toUpperCase() || "M"}
        </div>
      );
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const getAuthToken = () => localStorage.getItem("auth-token") || "";

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data: ProfileData = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse text-gray-500">Loading profile...</div>
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
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">{user.name}</h2>
              <span className="bg-blue-100 text-primary text-xs font-medium px-2 py-1 rounded-4xl flex-shrink-0">
                {user.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm line-clamp-2">{user.bio}</p>

            {/* Followers */}
            <div className="flex gap-4 sm:gap-6 md:gap-8 mt-2">
              <div className="text-center">
                <p className="text-sm sm:text-base md:text-lg font-bold">{user.followers}</p>
                <p className="text-gray-600 text-xs">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-base md:text-lg font-bold">{user.following}</p>
                <p className="text-gray-600 text-xs">Following</p>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => {
              // Save user details in localStorage
              localStorage.setItem(
                "edit-profile-data",
                JSON.stringify({
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar || "",
                  profilePic: user.profilePic || "",
                  isPublic: user.isPublic,
                })
              );

              // Redirect to edit profile page
              router.push("/profile/edit");
            }}
            className="bg-primary text-white px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm md:px-8 md:py-4 md:text-base rounded-lg font-semibold cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

        {/* Stats Section */}
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
        <div className="flex gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("layouts")}
            className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "layouts"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
              }`}
          >
            My Published Layouts
          </button>
          <button
            onClick={() => setActiveTab("contours")}
            className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "contours"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
              }`}
          >
            My Published Tool Contours
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "layouts" ? <MyLayouts /> : <MyToolContours />}
      </div>
    </div>
  );
};

export default Profile;