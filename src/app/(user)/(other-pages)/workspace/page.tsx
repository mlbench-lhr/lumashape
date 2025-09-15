'use client'
import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Wrench, Calendar } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import InputField from "@/components/ui/InputField";
import LayoutPreviewCard from '../../../../components/Workspace/DesignLayout/LayoutPreviewCard';

interface ToolData {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  thickness: number;
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
  description?: string;
  canvas: CanvasData;
  tools: ToolData[];
  stats: LayoutStats;
  userEmail: string;
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

  // Handle layout actions
  const handleEditLayout = (layout: Layout) => {
    router.push(`/workspace/design?edit=${layout._id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="px-0 md:px-4 py-6 flex-1">
        <div className="mx-auto w-full max-w-[343px] sm:max-w-[1250px]">
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
              <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
                <Image
                  src="/images/icons/bell.svg"
                  width={36}
                  height={36}
                  alt="notifications"
                />
              </div>
            </div>
            <div className="relative w-[30px] h-[30px] rounded-[10px] border-[#c7c7c7] border flex items-center justify-center sm:hidden">
              <Image src="/images/icons/bell.svg" fill alt="notifications" />
            </div>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-6 mt-4">
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

          {/* Loading State */}
          {loading && layouts.length === 0 && (
            <div className="flex items-center justify-center py-12 mt-6">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading layouts...</span>
            </div>
          )}

          {/* Layouts Grid */}
          {layouts.length > 0 && (
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {layouts.map((layout) => (
                  <LayoutPreviewCard
                    key={layout._id}
                    layout={layout}
                    onEdit={handleEditLayout}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => fetchLayouts(pagination.page - 1, searchQuery)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => fetchLayouts(i + 1, searchQuery)}
                      className={`px-3 py-2 border rounded-lg ${
                        pagination.page === i + 1
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => fetchLayouts(pagination.page + 1, searchQuery)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results Summary */}
              <div className="text-center mt-6 text-sm text-gray-600">
                Showing {layouts.length} of {pagination.total} layouts
              </div>
            </div>
          )}

          {/* Empty State - Only show when not loading and no layouts */}
          {!loading && layouts.length === 0 && !error && (
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
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg transition-colors"
          onClick={() => router.push("/workspace/create-new-layout")}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default MyLayouts;