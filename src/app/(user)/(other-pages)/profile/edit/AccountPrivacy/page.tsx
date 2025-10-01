"use client";

import { useEffect, useState } from "react";

export default function AccountPrivacy() {
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem("edit-profile-data");
    if (data) {
      const parsed = JSON.parse(data);
      if (typeof parsed.isPublic !== "undefined") {
        setIsPublic(parsed.isPublic);
      }
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/updateStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ isPublic }),
      });

      const data = await res.json();
      if (res.ok) {
        // update localStorage so UI stays in sync
        const profileData = JSON.parse(
          localStorage.getItem("edit-profile-data") || "{}"
        );
        localStorage.setItem(
          "edit-profile-data",
          JSON.stringify({ ...profileData, isPublic })
        );
        alert("Privacy updated!");
      } else {
        alert(data.message || "Failed to update privacy");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Account Privacy</h2>
      <p className="mt-4 text-gray-600">
        You’re in control of how your content appears. Turn this setting on to
        publish anonymously — your name and profile won’t be linked to any of
        your shared tools or layouts.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-gray-700">Anonymous Mode</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!isPublic}
            onChange={(e) => setIsPublic(!e.target.checked ? true : false)}
            className="sr-only peer"
          />
          <div
            className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:border-gray-300 after:border after:rounded-full
                        after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="mt-6 px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
