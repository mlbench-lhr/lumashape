import React from 'react';
import { Info } from 'lucide-react';
import Image from 'next/image';

const OptionsBar: React.FC = () => {
    return (
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center space-x-8">
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="finger-clearance" className="rounded border-gray-300" />
                <label htmlFor="finger-clearance" className="text-sm text-gray-700 flex items-center">
                    Include Finger clearance cut
                </label>
                <Image
                    src={"/images/workspace/info.svg"}
                    alt="Cursor"
                    width={4}
                    height={4}
                    className="w-5 h-5"
                />
            </div>

            <div className="flex items-center space-x-2">
                <input type="checkbox" id="contour-offset" className="rounded border-gray-300" />
                <label htmlFor="contour-offset" className="text-sm text-gray-700">
                    Contour Offset Parameter
                </label>
            </div>
        </div>
    );
};

export default OptionsBar;