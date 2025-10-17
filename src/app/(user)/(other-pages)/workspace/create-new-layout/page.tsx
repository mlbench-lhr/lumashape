'use client'
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const CreateNewLayout = () => {
  const [layoutName, setLayoutName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [width, setWidth] = useState('10');
  const [length, setLength] = useState('24');
  const [units, setUnits] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const brands = [
    { name: 'BOSCH', logo: '/images/icons/workspace/Bosch.svg' },
    { name: 'Milwaukee', logo: '/images/icons/workspace/Milwaukee.svg' },
    { name: 'Makita', logo: '/images/icons/workspace/Makita.svg' }
  ];

  // Load from sessionStorage
  useEffect(() => {
    const savedData = sessionStorage.getItem('layoutForm');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setLayoutName(parsed.layoutName || '');
      setWidth(parsed.width || '10');
      setLength(parsed.length || '24');
      setUnits(parsed.units || '');
    }
  }, []);

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    const data = { layoutName, width, length, units };
    sessionStorage.setItem('layoutForm', JSON.stringify(data));
  }, [layoutName, width, length, units]);

  // Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!layoutName) {
      newErrors.layoutName = 'Layout name is required.';
    } else if (/\s/.test(layoutName)) {
      newErrors.layoutName = 'Layout name must not contain spaces.';
    }

    if (!units) {
      newErrors.units = 'Units selection is required.';
    }

    if (!width) {
      newErrors.width = 'Width is required.';
    } else if (isNaN(Number(width))) {
      newErrors.width = 'Width must be a number.';
    }

    if (!length) {
      newErrors.length = 'Length is required.';
    } else if (isNaN(Number(length))) {
      newErrors.length = 'Length must be a number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = (e: React.MouseEvent) => {
    if (!validateForm()) {
      e.preventDefault(); // stop navigation on invalid form
      return;
    }
    // Clear any stale edit-mode ID so navigation to canvas uses POST
    try { sessionStorage.removeItem('editingLayoutId'); } catch {}
  };

  return (
    <div className="border border-gray-200 rounded-lg m-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <Image
            className="cursor-pointer"
            onClick={() => window.history.back()}
            src={"/images/icons/workspace/Back.svg"}
            alt="Back"
            width={35}
            height={35}
          />
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
              placeholder="Layout_3Tools"
              readOnly={!isEditingName}
              onClick={() => setIsEditingName(true)}
              onChange={(e) => setLayoutName(e.target.value)}
              className={`px-6 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 
                ${errors.layoutName ? 'border-red-500' : 'border-gray-300'} 
                ${!isEditingName ? 'cursor-pointer bg-gray-50' : ''}`}
            />
            {errors.layoutName && <p className="text-sm text-red-600 mt-1">{errors.layoutName}</p>}
          </div>

          {/* Container Details */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Container Details
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">

              {/* Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units
                </label>
                <select
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary text-gray-900 bg-gray
                      ${errors.units ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  <option value="mm">mm</option>
                  <option value="inches">inches</option>
                </select>
                {errors.units && <p className="text-sm text-red-600">{errors.units}</p>}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary text-gray-900
                      ${errors.width ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.width && <p className="text-sm text-red-600">{errors.width}</p>}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary text-gray-900
                      ${errors.length ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.length && <p className="text-sm text-red-600">{errors.length}</p>}
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-8">
            <Link
              href="/workspace/create-new-layout/design-layout"
              onClick={handleContinue}
              className="text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-primary"
            >
              Continue To Canvas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewLayout;
