"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Download, ArrowLeft, Mail, Clock } from "lucide-react";

type UserInfo = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  profilePic?: string;
  createdAt?: string;
};

type AdminTool = {
  _id: string;
  toolType: string;
  toolBrand: string;
  SKUorPartNumber: string;
  imageUrl?: string;
  likes: number;
  dislikes: number;
  downloads: number;
  publishedDate?: string | null;
};

type CanvasData = { width: number; height: number; unit: "mm" | "inches"; thickness?: number };
type AdminLayout = {
  _id: string;
  name: string;
  canvas: CanvasData;
  snapshotUrl?: string | null;
  likes: number;
  dislikes: number;
  downloads: number;
  publishedDate?: string | null;
};

export default function AdminUserProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [layouts, setLayouts] = useState<AdminLayout[]>([]);
  const [activeTab, setActiveTab] = useState<"layouts" | "tools">("layouts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : null;
        const res = await fetch(`/api/admin/users/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUser(data.user);
          setTools(data.publishedTools || []);
          setLayouts(data.publishedLayouts || []);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params.id]);

  const avatarSrc = useMemo(() => {
    if (!user) return "/images/icons/logo.svg";
    return user.profilePic || user.avatar || "/images/icons/logo.svg";
  }, [user]);

  const joinDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "-";
  const formatPublishedDate = (date?: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatDownloads = (count?: number) => {
    if (typeof count !== "number") return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-gray-700 flex items-center gap-2 text-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            View Details
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 lg:p-8 flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6 min-h-[120px] sm:min-h-[150px] md:min-h-[200px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 self-start">
            {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full rounded-full object-cover" /> : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">
                {user ? `${user.firstName} ${user.lastName}` : ""}
              </h2>
            </div>
            <div className="mt-1 flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="truncate">{user?.email || "-"}</span>
            </div>
            <div className="text-gray-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>Added On: {joinDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 sm:mt-8 md:mt-10 border-b border-gray-200">
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("tools")}
              className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "tools" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              Published Tools
            </button>
            <button
              onClick={() => setActiveTab("layouts")}
              className={`pb-2 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${activeTab === "layouts" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              Published Layouts
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-600">Loading...</div>
        ) : activeTab === "layouts" ? (
          <div className="flex flex-wrap mt-4 justify-start gap-4">
            {layouts.length === 0 ? (
              <div className="text-gray-600">No Published Layouts</div>
            ) : (
              layouts.map((layout) => (
                <div
                  key={layout._id}
                  className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[260px] sm:w-[266px] sm:h-[300px] relative"
                >
                  <div className="w-[258px] sm:w-[242px]">
                    <div className="relative w-full h-[150px]">
                      {layout.snapshotUrl ? (
                        <Image src={layout.snapshotUrl} alt={layout.name} fill style={{ objectFit: "contain", backgroundColor: "#f9f9f9" }} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-100">
                          <div className="relative w-[80px] h-[80px]">
                            <Image src="/images/icons/workspace/noLayouts.svg" fill style={{ objectFit: "contain" }} alt="layout" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full flex flex-col px-2 py-2 space-y-1">
                    <div className="flex items-baseline gap-[3px]">
                      <h3 className="font-bold text-[16px] truncate">{layout.name}</h3>
                    </div>
                    <div className="text-[12px] text-[#b3b3b3] font-medium leading-tight space-y-[2px]">
                      <div className="flex justify-between">
                        <span>Length:</span>
                        <span className="font-semibold text-gray-800">{layout.canvas?.height ?? "-"} {layout.canvas?.unit ?? ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Width:</span>
                        <span className="font-semibold text-gray-800">{layout.canvas?.width ?? "-"} {layout.canvas?.unit ?? ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thickness:</span>
                        <span className="font-semibold text-gray-800">{layout.canvas?.thickness ?? "-"} {layout.canvas?.unit ?? ""}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1">
                        <div className={`flex items-center gap-1 px-1 py-1 rounded ${layout.likes > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <ThumbsUp className={`w-3 h-3 ${layout.likes > 0 ? 'fill-current text-blue-600' : ''}`} />
                          <span className="text-[11px]">{layout.likes || 0}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-1 py-1 rounded ${layout.dislikes > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <ThumbsDown className={`w-3 h-3 ${layout.dislikes > 0 ? 'fill-current text-blue-600' : ''}`} />
                          <span className="text-[11px]">{layout.dislikes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-[#666666] font-medium">{formatDownloads(layout.downloads)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#666666] font-medium">{formatPublishedDate(layout.publishedDate || undefined)}</span>
                        <button onClick={() => router.push(`/inspect-layout/${layout._id}`)} className="px-2 py-1 text-xs border border-[#E6E6E6] rounded-md text-[#266ca8] hover:bg-gray-50">
                          Inspect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-wrap mt-4 justify-start gap-4">
            {tools.length === 0 ? (
              <div className="text-gray-600">No Published Tools</div>
            ) : (
              tools.map((tool) => (
                <div
                  key={tool._id}
                  className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[280px] sm:w-[266px] sm:h-[270px] relative"
                >
                  <div className="w-[258px] sm:w-[242px]">
                    <div className="relative w-full h-[140px]">
                      {tool.imageUrl ? (
                        <Image src={tool.imageUrl} alt={`${tool.toolType} outlines`} fill style={{ objectFit: "contain", backgroundColor: "#f9f9f9" }} />
                      ) : (
                        <div className="relative w-[80px] h-[80px]">
                          <Image src="/images/icons/wrench.svg" fill style={{ objectFit: "contain" }} alt="tool" />
                        </div>
                      )}
                    </div>
                    <div className="w-full h-[102px] flex flex-col justify-center">
                      <div className="space-y-1 mt-[20px] mb-[5px] text-[12px] text-[#666666] font-medium leading-tight">
                        <div className="flex justify-between">
                          <span>Tool Brand:</span>
                          <span className="font-semibold text-gray-800">{tool.toolBrand || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tool Type:</span>
                          <span className="font-semibold text-gray-800">{tool.toolType || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SKU or Part Number:</span>
                          <span className="font-semibold text-gray-800">{tool.SKUorPartNumber || "-"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <div className={`flex items-center gap-1 px-1 py-1 rounded`}>
                            <ThumbsUp className={`w-3 h-3`} />
                            <span className="text-[11px]">{tool.likes || 0}</span>
                          </div>
                          <div className={`flex items-center gap-1 px-1 py-1 rounded`}>
                            <ThumbsDown className={`w-3 h-3`} />
                            <span className="text-[11px]">{tool.dislikes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            <span className="text-[11px] font-medium">{formatDownloads(tool.downloads)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium">{formatPublishedDate(tool.publishedDate || undefined)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}