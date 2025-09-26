"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import MyLayouts from "./MyLayouts/page";
import MyToolContours from "./MyToolContours/page";

interface User {
  name: string;
  email: string;
  status: string;
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
          className="w-40 h-40 rounded-full object-cover"
        />
      );
    } else if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt="Avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
      );
    } else {
      return (
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
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
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse text-gray-500">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-red-500">Error loading profile: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, counts } = profileData;

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-8 flex items-center space-x-8 min-h-[200px]">
          {/* Avatar */}
          <div className="w-36 h-36 rounded-full bg-primary flex items-center justify-center overflow-hidden text-5xl font-bold text-white">
            {renderProfileImage()}
          </div>


          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <span className="bg-blue-100 text-primary text-sm font-medium px-3 py-1 rounded-4xl">
                {user.status}
              </span>
            </div>
            <p className="text-gray-600 mt-2 text-md">{user.bio}</p>

            {/* Followers */}
            <div className="flex gap-10 mt-4 text-center">
              <div>
                <p className="text-xl font-bold">{user.followers}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </div>
              <div>
                <p className="text-xl font-bold">{user.following}</p>
                <p className="text-gray-600 text-sm">Following</p>
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
                })
              );

              // Redirect to edit profile page
              router.push("/profile/edit");
            }}
            className="bg-primary text-white px-6 py-3 rounded-lg text-base font-semibold cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <div className="bg-blue-50 rounded-4xl shadow p-6 text-center">
            <p className="text-primary font-semibold text-2xl">
              {stats.upvotes.toLocaleString()}
            </p>
            <p className="text-gray-600 text-md">Total Upvotes</p>
          </div>
          <div className="bg-blue-50 rounded-4xl shadow p-6 text-center">
            <p className="text-primary font-semibold text-2xl">
              {stats.downvotes.toLocaleString()}
            </p>
            <p className="text-gray-600 text-md">Total Downvotes</p>
          </div>
          <div className="bg-blue-50 rounded-4xl shadow p-6 text-center">
            <p className="text-primary font-semibold text-2xl">
              {stats.downloads.toLocaleString()}
            </p>
            <p className="text-gray-600 text-md">Total Downloads</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mt-10 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("layouts")}
            className={`pb-2 font-medium flex items-center gap-2 ${activeTab === "layouts"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
              }`}
          >
            My Published Layouts
          </button>
          <button
            onClick={() => setActiveTab("contours")}
            className={`pb-2 font-medium flex items-center gap-2 ${activeTab === "contours"
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