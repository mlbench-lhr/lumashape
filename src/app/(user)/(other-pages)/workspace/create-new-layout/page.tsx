'use client'
import React, { useState } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

const CreateNewLayout = () => {
  const [layoutName, setLayoutName] = useState('Layout_3Tools');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [containerType, setContainerType] = useState('Drawer');
  const [width, setWidth] = useState('10');
  const [length, setLength] = useState('24');
  const [units, setUnits] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const brands = [
    { name: 'BOSCH', logo: '/images/icons/workspace/Bosch.svg', bgColor: 'bg-gray-100' },
    { name: 'Milwaukee', logo: '/images/icons/workspace/Milwakee.svg', bgColor: 'bg-red-600' },
    { name: 'DEWALT', logo: '/images/icons/workspace/Dewalt.svg', bgColor: 'bg-yellow-400' }
  ];

  return (
    <div className="border border-gray-200 rounded-lg m-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <Image className='cursor-pointer' onClick={() => window.history.back()} src={"/images/icons/workspace/Back.svg"} alt="Back" width={35} height={35}/>
          <h1 className="ml-2 text-2xl font-bold text-gray-900">Create New Layout</h1>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Layout Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Layout Name
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="px-6 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Brand
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Choose a brand to use standard container dimensions, or select 'Custom' to enter your own.
            </p>
            
            {/* Brand Options */}
            <div className="flex space-x-2 mb-3">
              {brands.map((brand) => (
                <div
                  key={brand.name}
                  className={`w-16 h-12 rounded border-2 cursor-pointer flex items-center justify-center ${
                    selectedBrand === brand.name 
                      ? 'border-blue-500' 
                      : 'border-gray-300'
                  } ${brand.bgColor}`}
                  onClick={() => setSelectedBrand(brand.name)}
                >
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ))}
            </div>

            {/* Custom Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="custom"
                checked={selectedBrand === 'Custom'}
                onChange={(e) => setSelectedBrand(e.target.checked ? 'Custom' : '')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="custom" className="ml-2 text-sm font-medium text-gray-900">
                Custom
              </label>
            </div>
          </div>

          {/* Container Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Container Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Container Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Container Type
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between text-gray-900"
                  >
                    {containerType}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="py-1">
                        {['Drawer', 'Box', 'Case'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setContainerType(type);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-900"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units
                </label>
                <input
                  type="text"
                  placeholder="Select"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width
                </label>
                <input
                  type="text"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length
                </label>
                <input
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="mt-6">
          <Button className="ml-4 mb-4 text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Continue To Canvas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateNewLayout;