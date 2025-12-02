"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Pencil } from "lucide-react";

type AdminProfile = {
  _id?: string;
  username?: string;
  email?: string;
  imgUrl?: string;
  avatar?: string;
};

export default function AdminSettingsPage() {
  const router = useRouter();

  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<"edit" | "password" | "logout">("edit");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [adminData, setAdminData] = useState<AdminProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin-profile");
      if (raw) setAdminData(JSON.parse(raw));
    } catch {}
  }, []);

  const renderProfileImage = () => {
    const initial =
      adminData?.username?.charAt(0)?.toUpperCase() ||
      adminData?.email?.charAt(0)?.toUpperCase() ||
      "A";

    if (adminData?.imgUrl && adminData.imgUrl.trim().length > 0) {
      return <img src={adminData.imgUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />;
    }
    return (
      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
        {initial}
      </div>
    );
  };

  const renderTab = () => {
    if (activeTab === "edit") return <EditProfileAdmin adminData={adminData} onUpdate={(p) => setAdminData(p)} />;
    if (activeTab === "password") return <ChangePasswordAdmin />;
    return <LogoutTabAdmin onConfirm={() => setShowLogoutModal(true)} />;
  };

  const handleBack = () => {
    if (!showSidebar && typeof window !== "undefined" && window.innerWidth < 768) {
      setShowSidebar(true);
    } else {
      router.push("/admin/dashboard");
    }
  };

  const doLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE", credentials: "include" });
    } catch {}
    try {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("admin-profile");
    } catch {}
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4 border-b border-gray-100">
        <ArrowLeft className="w-5 h-5 text-gray-600 cursor-pointer" onClick={handleBack} />
        <h1 className="text-lg font-semibold text-gray-800">
          {showSidebar
            ? "Edit Profile"
            : activeTab === "edit"
            ? "Edit Profile"
            : activeTab === "password"
            ? "Change Password"
            : "Logout"}
        </h1>
      </div>

      <div className="flex flex-1">
        <div className="md:hidden bg-white w-full">
          {showSidebar ? (
            <>
              <div className="p-4 flex flex-col items-center border-b border-gray-100">
                <div className="mb-3">{renderProfileImage()}</div>
                <h2 className="text-sm font-medium text-gray-800">
                  {adminData?.username || "Admin"}
                </h2>
                <p className="text-xs text-gray-500 mb-4">{adminData?.email || "—"}</p>

                <div className="w-full flex flex-col">
                  <button
                    onClick={() => {
                      setActiveTab("edit");
                      setShowSidebar(false);
                    }}
                    className="flex items-center font-semibold justify-between w-full p-3 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-3">
                      <img src="/images/icons/profile/edit.svg" alt="Edit" className="w-5 h-5" />
                      Edit Profile
                    </span>
                    <img src="/images/icons/profile/arrow.svg" alt="Arrow" className="w-4 h-4 text-primary" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("password");
                      setShowSidebar(false);
                    }}
                    className="flex items-center font-semibold justify-between w-full p-3 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-3">
                      <img src="/images/icons/profile/password.svg" alt="Password" className="w-5 h-5" />
                      Change Password
                    </span>
                    <img src="/images/icons/profile/arrow.svg" alt="Arrow" className="w-4 h-4 text-primary" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("logout");
                      setShowSidebar(false);
                    }}
                    className="flex items-center font-semibold justify-between w-full p-3 text-gray-600"
                  >
                    <span className="flex items-center gap-3">
                      <img src="/images/icons/profile/logout.svg" alt="Logout" className="w-5 h-5" />
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4">{renderTab()}</div>
          )}
        </div>

        <div className="hidden md:flex w-full gap-6 px-4 sm:px-6 pb-6">
          <div className="w-1/3 max-w-xs bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="mb-3">{renderProfileImage()}</div>
              <h2 className="text-base font-medium text-gray-800">{adminData?.username || "Admin"}</h2>
              <p className="text-sm text-gray-500">{adminData?.email || "—"}</p>
            </div>

            <nav className="flex flex-col gap-6 text-lg">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg ${
                  activeTab === "edit" ? "text-primary font-medium" : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-3">
                  <img
                    src={activeTab === "edit" ? "/images/icons/profile/active/edit.svg" : "/images/icons/profile/edit.svg"}
                    alt="Edit"
                    className="w-5 h-5"
                  />
                  Edit Profile
                </span>
                <img src="/images/icons/profile/arrow.svg" alt="Arrow" className="w-4 h-4 text-primary" />
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg ${
                  activeTab === "password" ? "text-primary font-medium" : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      activeTab === "password"
                        ? "/images/icons/profile/active/password.svg"
                        : "/images/icons/profile/password.svg"
                    }
                    alt="Password"
                    className="w-5 h-5 flex-shrink-0"
                  />
                  <span className="truncate">Change Password</span>
                </span>
                <img src="/images/icons/profile/arrow.svg" alt="Arrow" className="w-4 h-4 text-primary flex-shrink-0" />
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg text-gray-600 hover:text-primary"
              >
                <span className="flex items-center gap-3" >
                  <img src="/images/icons/profile/logout.svg" alt="Logout" className="w-5 h-5" />
                  Logout
                </span>
              </button>
            </nav>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm p-6">{renderTab()}</div>
        </div>
      </div>

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
                Are you sure you want to logout? You’ll need to log in again to access your admin account.
              </p>
              <div className="flex w-full gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button onClick={doLogout} className="flex-1 py-3 bg-primary text-white rounded-md">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditProfileAdmin({
  adminData,
  onUpdate,
}: {
  adminData: AdminProfile | null;
  onUpdate: (p: AdminProfile | null) => void;
}) {
  const [username, setUsername] = useState(adminData?.username || "");
  const email = adminData?.email || "";
  const [saving, setSaving] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(adminData?.imgUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setUsername(adminData?.username || "");
    setProfilePic(adminData?.imgUrl || null);
  }, [adminData?.username, adminData?.imgUrl]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file, "profile.png");
    const token = localStorage.getItem("admin-token") || "";
    const res = await fetch("/api/profile/uploadImage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.fileUrl) throw new Error(data.error || "Upload failed");
    return data.fileUrl as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let newAvatar = profilePic || null;
      if (selectedFile) {
        newAvatar = await uploadImage(selectedFile);
        setProfilePic(newAvatar);
        setSelectedFile(null);
      }
      const token = localStorage.getItem("admin-token") || "";
      const res = await fetch("/api/admin/profile/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, imgUrl: newAvatar || "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update profile");
      const next = { ...(adminData || {}), username, imgUrl: newAvatar || "" };
      localStorage.setItem("admin-profile", JSON.stringify(next));
      onUpdate(next);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>

      <div className="mt-6 flex flex-col items-left">
        <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
          ) : profilePic ? (
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          )}
          <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
          <input type="email" value={email} disabled className="w-full px-3 py-2 border rounded-md text-sm text-gray-500 bg-gray-100 cursor-not-allowed" />
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-md shadow disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </>
  );
}

function ChangePasswordAdmin() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return alert("All fields are required");
    if (newPassword !== confirmPassword) return alert("New password and confirmation do not match");
    setSaving(true);
    try {
      const token = localStorage.getItem("admin-token") || "";
      const res = await fetch("/api/admin/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return alert(data.message || data.error || "Failed to update password");
      alert("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">Old Password</label>
            <div className="relative">
              <input type={showOld ? "text" : "password"} placeholder="Enter your Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md pr-10" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2">
                <Image src={showOld ? "/images/icons/auth/Eye.svg" : "/images/icons/auth/EyeClosed.svg"} alt="" height={20} width={20} />
              </button>
            </div>
          </div>
          <div></div>
          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} placeholder="Enter your Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2">
                <Image src={showNew ? "/images/icons/auth/Eye.svg" : "/images/icons/auth/EyeClosed.svg"} alt="" height={20} width={20} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-md font-bold text-gray-700 mb-1 truncate">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} placeholder="Enter your Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md pr-10" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2">
                <Image src={showConfirm ? "/images/icons/auth/Eye.svg" : "/images/icons/auth/EyeClosed.svg"} alt="" height={20} width={20} />
              </button>
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-md cursor-pointer">
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

function LogoutTabAdmin({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Logout</h2>
      <p className="mt-4 text-gray-600">You will be logged out from all admin sessions.</p>
      <button onClick={onConfirm} className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700">
        Logout Now
      </button>
    </div>
  );
}