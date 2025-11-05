'use client'
import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Wrench, Calendar, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import InputField from "@/components/ui/InputField";

interface ToolData {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  depth?: number;
  unit: 'mm' | 'inches';
  opacity?: number;
  smooth?: number;
  image?: string;
}

interface CanvasData {
  width: number;
  height: number;
  unit: 'mm' | 'inches';
  thickness: number;
}

interface LayoutStats {
  totalTools: number;
  validLayout: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Layout {
  _id: string;
  name: string;
  brand?: string;
  canvas: CanvasData;
  tools: ToolData[];
  stats: LayoutStats;
  userEmail: string;
  snapshotUrl?: string;
  published?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MyLayouts = () => {
  const router = useRouter();
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });

  // Fetch layouts from API
  const fetchLayouts = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('auth-token');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/layouts?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch layouts');
      }

      setLayouts(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching layouts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch layouts');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLayouts();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim() || layouts.length === 0) {
        fetchLayouts(1, searchQuery);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = (id: string) => {
    setOpenDropdown(prev => prev === id ? null : id);
  };

  // Add this function to handle layout deletion
  const deleteLayout = async (id: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const res = await fetch(`/api/layouts?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      if (!res.ok) throw new Error("Failed to delete layout");

      // Remove the deleted layout from the state
      setLayouts(prev => prev.filter(layout => layout._id !== id));

    } catch (error) {
      console.error("Error deleting layout:", error);
    }
  };

  // New: unpublishLayout
  const unpublishLayout = async (id: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const res = await fetch(`/api/layouts/unpublishLayout`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to unpublish layout");
      }

      setLayouts((prev) =>
        prev.map((l) => (l._id === id ? { ...l, published: false } : l))
      );
    } catch (err) {
      console.error("Error unpublishing layout:", err);
      alert(err instanceof Error ? err.message : "Failed to unpublish layout");
    }
  };

  // Update the handleMenuClick function to handle delete action
  const handleMenuClick = async (action: string, layout: Layout) => {
    setOpenDropdown(null);

    if (action === "Delete") {
      if (window.confirm("Are you sure you want to delete this layout?")) {
        deleteLayout(layout._id);
      }
    } else if (action === "Publish to profile") {
      publishLayout(layout._id);
    } else if (action === "Unpublish from profile") {
      unpublishLayout(layout._id);
    } else if (action === "Edit") {
      router.push(`/workspace/edit-layout/${layout._id}`);
    }
  };


  // Function: publishLayout
  const publishLayout = async (id: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const res = await fetch(`/api/layouts/publishLayout`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to publish layout");
      }

      // Update layouts in state
      setLayouts((prev) =>
        prev.map((l) =>
          l._id === id ? { ...l, published: true } : l
        )
      );
    } catch (err) {
      console.error("Error publishing layout:", err);
      alert(err instanceof Error ? err.message : "Failed to publish layout");
    }
  };


  // Format canvas dimensions
  const formatDimensions = (canvas: CanvasData) => {
    return `(${canvas.width}" × ${canvas.height}" x ${canvas.thickness}) ${canvas.unit}`
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="px-0 md:px-4 py-6 flex-1">
        <div className="mx-auto w-full max-w-[343px] sm:max-w-[1250px]">
          <div className="row">
            <div className="flex items-center justify-between w-full h-full sm:h-[64px]">
              <h1 className="text-2xl font-bold text-gray-900">My Layouts</h1>
              <div className="flex sm:flex hidden">
                <Button
                  onClick={() => router.push("/workspace/create-new-layout")}
                  variant="primary"
                  size="lg"
                >

                  <Image
                    src="/images/icons/mdi_add.svg"
                    width={24}
                    height={24}
                    alt="add"
                  />
                  Create New Layout
                </Button>
                {/* <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
                  <Image
                    src="/images/icons/bell.svg"
                    width={36}
                    height={36}
                    alt="notifications"
                  />
                </div> */}
              </div>
              <div className="relative w-[30px] h-[30px] rounded-[10px] border-[#c7c7c7] border flex items-center justify-center sm:hidden">
                <Image src="/images/icons/bell.svg" fill alt="notifications" />
              </div>
            </div>
            {/* <p>{`View, download, or duplicate all DXF layouts you’ve previously created.`}</p> */}
          </div>


          {/* Search & Sort */}
          <div className="flex flex-row sm:items-center sm:justify-between w-full sm:gap-6 mt-4">
            {/* Search Box */}
            <div className="relative w-full w-[193px] sm:w-[382px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <InputField
                label=""
                name="Search Files"
                placeholder="Search Files"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[35px] sm:h-[50px] pl-10 rounded-[10px] text-[12px] sm:text-[18px] font-medium"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Layouts Display */}
        <div className={`flex items-center ${layouts.length === 0 ? 'justify-center min-h-[500px]' : 'justify-center sm:justify-start'}`}>
          <div className="flex flex-col items-center justify-center py-12">

            {layouts.length > 0 && (
              <div className="w-full max-w-[343px] sm:max-w-[1200px] mx-auto px-4 sm:px-0">
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  {layouts.map((layout) => (
                    <div
                      key={layout._id}
                      className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[248px] sm:w-[266px] sm:h-[248px] relative"
                    >
                      {/* Published Badge */}
                      {layout.published && (
                        <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium z-10">
                          Published
                        </div>
                      )}
                      <div className="relative inline-block" data-dropdown>
                        <div className="w-[258px] sm:w-[242px]">
                          <div className="relative w-full h-[150px]">
                            {layout.snapshotUrl ? (
                              <Image
                                src={layout.snapshotUrl}
                                alt={`${layout.name} layout`}
                                fill
                                style={{ objectFit: "contain", backgroundColor: "#f9f9f9" }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-gray-100">
                                <div className="relative w-[80px] h-[80px]">
                                  <Image
                                    src="/images/icons/workspace/noLayouts.svg"
                                    fill
                                    style={{ objectFit: "contain" }}
                                    alt="layout"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Three dots button */}
                            <button
                              className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(layout._id);
                              }}
                            >
                              <MoreVertical className="w-4 h-4 text-[#266ca8] cursor-pointer" />
                            </button>

                            {/* Dropdown menu */}
                            {openDropdown === layout._id && (
                              <div className="absolute top-6 sm:top-5 right-0 sm:right-2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[118px] h-[76px] sm:min-w-[171px] sm:h-[111px] overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick("Edit", layout);
                                  }}
                                  className="w-full px-1 py-1 sm:px-3 sm:py-2 text-left flex items-center gap-[5px] hover:bg-gray-50"
                                >
                                  <Image src="/images/icons/edit.svg" width={16} height={16} alt="edit" />
                                  <span className="text-[#266ca8] text-[10px] sm:text-[14px] font-medium">Edit</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick(
                                      layout.published ? "Unpublish from profile" : "Publish to profile",
                                      layout
                                    );
                                  }}
                                  className="w-full px-1 py-1 sm:px-3 sm:py-2 text-left flex items-center gap-[5px] hover:bg-gray-50"
                                >
                                  <Image src="/images/icons/share.svg" width={16} height={16} alt="share" />
                                  <span className="text-[10px] sm:text-[14px] font-medium text-[#808080]">
                                    {layout.published ? "Unpublish from profile" : "Publish to profile"}
                                  </span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick("Delete", layout);
                                  }}
                                  className="w-full px-1 py-1 sm:px-3 text-left flex items-center gap-[5px] hover:bg-gray-50"
                                >
                                  <Image src="/images/icons/delete.svg" width={16} height={16} alt="delete" />
                                  <span className="text-[#ed2929] text-[10px] sm:text-[14px] font-medium">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Layout details */}
                        <div className="w-full h-[70px] flex flex-col justify-center px-2">
                          <div className="flex items-baseline gap-[3px]">
                            <h3 className="font-bold text-[16px] truncate mt-2">{`${layout.name}`}</h3>
                          </div>
                          <div className="text-[12px] text-[#b3b3b3] font-medium leading-tight space-y-[2px]">
                            <div className="flex justify-between">
                              <span>Length:</span>
                              <span className="font-semibold text-gray-800">
                                {(layout.canvas?.height) ?? "-"}{" "}
                                {(layout.canvas?.unit) ?? ""}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span>Width:</span>
                              <span className="font-semibold text-gray-800">
                                {(layout.canvas?.width) ?? "-"}{" "}
                                {(layout.canvas?.unit) ?? ""}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span>Thickness:</span>
                              <span className="font-semibold text-gray-800">
                                {(layout.canvas?.thickness) ?? "-"}{" "}
                                {(layout.canvas?.unit) ?? ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {layouts.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-20">
                {/* Empty State Icon */}
                <Image src={"/images/icons/workspace/noLayouts.svg"} alt="Layout" width={261} height={261} />

                {/* Empty State Text */}
                <h3 className="text-lg font-medium text-gray-700 mb-2 mt-2">
                  {searchQuery ? 'No layouts found' : 'No Layout Created Yet'}
                </h3>
                {searchQuery && (
                  <p className="text-gray-600 text-center max-w-sm">
                    {`No layouts match "${searchQuery}". Try a different search term.`}
                  </p>
                )}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading layouts...</span>
              </div>
            )}
          </div>
        </div>
      </div >

      {/* Floating Add Button */}
      < div className="fixed bottom-6 right-6 sm:hidden" >
        <button
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg transition-colors"
          onClick={() => router.push("/workspace/create-new-layout")}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div >
    </div >
  );
};

export default MyLayouts;