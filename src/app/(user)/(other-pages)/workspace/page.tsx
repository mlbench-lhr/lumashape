'use client'
import React from 'react';
import { Search, Plus, Bell } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import InputField from "@/components/ui/InputField";

const MyLayouts = () => {
  const router = useRouter();
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
                className="w-full h-[35px] sm:h-[50px] pl-10 rounded-[10px] text-[12px] sm:text-[18px] font-medium"
              />
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center px-4 py-20">
            {/* Empty State Icon */}

            {/* Tool/Plier Icon */}
            <Image src={"/images/icons/workspace/noLayouts.svg"} alt="Layout" width={261} height={261} />

            {/* Empty State Text */}
            <h3 className="text-lg font-medium text-gray-700 mb-2 mt-2">No Layout Created Yet</h3>
          </div>
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