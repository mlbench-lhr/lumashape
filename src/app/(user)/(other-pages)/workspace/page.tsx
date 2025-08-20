'use client'
import React from 'react';
import { Search, Plus, Bell } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const MyLayouts = () => {
    const router = useRouter();
  return (
    <div className="border border-gray-200 rounded-lg m-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-secondary">My Layouts</h1>
          <div className="flex items-center space-x-3">
            <Button onClick={() => router.push('/workspace/create-new-layout')} className="text-white px-4 py-2 rounded-md font-medium  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center text-sm">
              <Plus className="w-4 h-4 mr-1" />
              Create New Layout
            </Button>
            <Image className='cursor-pointer' src={"/images/icons/workspace/Notifications.svg"} alt="Bell" width={43} height={40}/>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Files"
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm"
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
  );
};

export default MyLayouts;