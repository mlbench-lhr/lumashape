"use client";
import { useState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";

export default function EditProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null); // saved pic
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // new selection
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // temporary preview
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Load persisted profile (only saved data)
    const storedData = localStorage.getItem("edit-profile-data");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.name) {
          const [first, ...rest] = parsed.name.split(" ");
          setFirstName(first);
          setLastName(rest.join(" "));
        }
        if (parsed.email) setEmail(parsed.email);
        if (parsed.profilePic) setProfilePic(parsed.profilePic);
      } catch (err) {
        console.error("Error parsing stored profile data:", err);
      }
    }
  }, []);

  // Create a preview URL whenever a file is chosen
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url); // cleanup
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  // Upload helper (only used on save)
  const uploadToDigitalOcean = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file, "profile.png");

    const response = await fetch("/api/profile/uploadImage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth-token")}`, // JWT
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const { fileUrl } = await response.json();
    return fileUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // only set, don't upload yet
    }
  };

  const handleCircleClick = () => fileInputRef.current?.click();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let newProfilePic = profilePic;

      // if user selected a new file, upload it now
      if (selectedFile) {
        newProfilePic = await uploadToDigitalOcean(selectedFile);
        setProfilePic(newProfilePic);
        setSelectedFile(null); // clear after upload
      }

      const username = `${firstName} ${lastName}`.trim();

      const response = await fetch("/api/profile/editProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ username, profilePic: newProfilePic }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const data = await response.json();
      console.log("Profile updated:", data);

      // persist only saved state
      localStorage.setItem(
        "edit-profile-data",
        JSON.stringify({ name: username, email, profilePic: newProfilePic })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>

      <div className="mt-6 flex flex-col items-left">
        <div
          onClick={handleCircleClick}
          className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
        >
          {previewUrl ? (
            // show new selected preview
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-full"
            />
          ) : profilePic ? (
            // show saved pic
            <img
              src={profilePic}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            // fallback
            <svg
              className="w-12 h-12 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          )}
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 border rounded-md text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-primary text-white rounded-md shadow disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </>
  );
}
