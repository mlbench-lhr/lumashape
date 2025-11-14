'use client'
import React, { useState, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const CreateNewLayout = () => {
    const router = useRouter();
    const [layoutName, setLayoutName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [width, setWidth] = useState('10');
    const [length, setLength] = useState('24');
    const [units, setUnits] = useState('');
    const [materialColor, setMaterialColor] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [thickness, setThickness] = useState('');
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isInfoColorOpen, setIsInfoColorOpen] = useState(false);
    const [isInfoThicknessOpen, setIsInfoThicknessOpen] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const brands = [
        { name: 'BOSCH', logo: '/images/icons/workspace/Bosch.svg' },
        { name: 'Milwaukee', logo: '/images/icons/workspace/Milwaukee.svg' },
        { name: 'Makita', logo: '/images/icons/workspace/Makita.svg' }
    ];

    const colorOptions = [
        { id: 'blue', src: '/images/workspace/create_new_layout/blue.svg', alt: 'Blue' },
        { id: 'black', src: '/images/workspace/create_new_layout/black.svg', alt: 'Black' },
        { id: 'yellow', src: '/images/workspace/create_new_layout/yellow.svg', alt: 'Yellow' },
        { id: 'red', src: '/images/workspace/create_new_layout/red.svg', alt: 'Red' },
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
            setThickness(parsed.thickness || '');
            setMaterialColor(parsed.materialColor || '');
        }
    }, []);

    // Save to sessionStorage whenever state changes
    useEffect(() => {
        const data = { layoutName, width, length, units, materialColor, thickness };
        sessionStorage.setItem('layoutForm', JSON.stringify(data));
    }, [layoutName, width, length, units, materialColor, thickness]);

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

        if (!thickness) {
            newErrors.thickness = 'Thickness is required.';
        } else if (isNaN(Number(thickness))) {
            newErrors.thickness = 'Thickness must be a number.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (!validateForm()) {
            return;
        }
        try { sessionStorage.removeItem('editingLayoutId'); } catch { }
        router.push('/workspace/create-new-layout/design-layout');
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
                            <div className="col-span-2">
                                <div className="mt-4 col-span-2">
                                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">


                                        {/* Thickness Section */}
                                        <div>
                                            {/* Label + Info button side-by-side */}
                                            {/* Label + Info button side-by-side (with popup relative to this wrapper) */}
                                            <div className="flex items-center mb-2 gap-2 relative">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Thickness
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => setIsInfoThicknessOpen(!isInfoThicknessOpen)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <Info size={18} />
                                                </button>

                                                {/* Info popup positioned under the icon */}
                                                {isInfoThicknessOpen && (
                                                    <div className="absolute left-[60px] top-full mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg p-3 z-20">
                                                        <div className="flex items-start flex-col gap-3">
                                                            <Image
                                                                src="/images/workspace/create_new_layout/thickness-info.png"
                                                                alt="Info"
                                                                width={500}
                                                                height={500}
                                                                className="rounded"
                                                            />
                                                            <p className="text-sm text-gray-700">
                                                                Lumashape order fulfillment does not cut entirely through the
                                                                material thickness. A minimum floor thickness of 0.25 inches
                                                                must remain beneath all tool pockets to ensure proper vacuum
                                                                hold-down during manufacturing.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>


                                            <div className="relative">
                                                {/* Select wrapper */}
                                                <div className="relative">
                                                    <select
                                                        value={thickness}
                                                        onChange={(e) => setThickness(e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary text-gray-900 ${errors.thickness ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                    >
                                                        <option value="">Select Thickness</option>
                                                        <option value="1.25">1.25</option>
                                                        <option value="2.00">2.00</option>
                                                        <option value="2.50">2.50</option>
                                                        <option value="3.00">3.00</option>
                                                    </select>

                                                    {/* Simple SVG arrow */}
                                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {errors.thickness && (
                                                <p className="text-sm text-red-600">{errors.thickness}</p>
                                            )}
                                        </div>


                                        {/* Color Section */}
                                        <div>
                                            <div className="flex items-center mb-2 gap-2 relative">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Color (Optional)
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => setIsInfoColorOpen(!isInfoColorOpen)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <Info size={18} />
                                                </button>

                                                {/* Info popup positioned under the icon */}
                                                {isInfoColorOpen && (
                                                    <div className="absolute left-[60px] top-full mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg p-3 z-20">
                                                        <div className="flex items-start flex-col gap-3">
                                                            <p className="text-sm text-gray-700">
                                                                Foam color selection is only required when submitting this layout for order fulfillment.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 sm:grid-cols-4 sm:w-[350] w-[230] gap-2">
                                                {colorOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setMaterialColor(opt.id)}
                                                        className={`border-1 rounded-lg transition-all ${materialColor === opt.id
                                                            ? 'border-blue-500 ring-1 ring-primary'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                        aria-pressed={materialColor === opt.id}
                                                    >
                                                        <Image
                                                            src={opt.src}
                                                            alt={opt.alt}
                                                            width={80}
                                                            height={80}
                                                            className="p-2 sm:p-2"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>



                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Button */}
                    <div className="mt-8">
                        <button
                            onClick={handleContinue}
                            disabled={!layoutName || /\s/.test(layoutName) || !units || !width || isNaN(Number(width)) || !length || isNaN(Number(length)) || !thickness || isNaN(Number(thickness))}
                            className="text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Continue To Canvas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateNewLayout;
