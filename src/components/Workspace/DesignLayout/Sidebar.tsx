"use client";
import React, { useState } from 'react';
import {
    Search,
    ChevronDown,
    RotateCcw,
    RotateCw,
    FlipVertical,
    Group,
    Ungroup,
    Undo,
    Redo,
    Copy,
    Clipboard,
    ZoomIn,
    Trash2,
    Layout,
    CornerDownLeft,
    Grip,
    ArrowUp,
    Circle,
    Square,
    ArrowUpDown,
    ArrowDown,
    Hash
} from 'lucide-react';
import Image from 'next/image';
import { DroppedTool, Tool } from './types';
import DraggableTool from './DraggableTool';

interface SidebarProps {
    droppedTools: DroppedTool[];
    selectedTool: string | null;
}
const TOOLS: Tool[] = [
    { id: '1', name: 'Pliers', icon: '🔧', brand: 'MILWAUKEE', image: '/images/workspace/pliers.png' },
    { id: '2', name: 'Scissors', icon: '✂️', brand: 'MILWAUKEE', image: '/api/placeholder/80/80' },
    { id: '3', name: 'Screwdriver', icon: '🪛', brand: 'MILWAUKEE', image: '/api/placeholder/80/80' },
    { id: '4', name: 'Wrench', icon: '🔧', brand: 'MILWAUKEE', image: '/api/placeholder/80/80' },
];
const Sidebar: React.FC<SidebarProps> = ({ droppedTools, selectedTool }) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'edit'>('inventory');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTools = TOOLS.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const ToolInventoryView = () => (
        <>
            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Tools"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="flex items-center space-x-1 text-sm text-blue-600 cursor-pointer">
                    <span>All Brands</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            <div className="space-y-2">
                {filteredTools.map((tool) => (
                    <DraggableTool key={tool.id} tool={tool} />
                ))}
            </div>

            {filteredTools.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    <p>No tools found matching "{searchTerm}"</p>
                </div>
            )}
        </>
    );


    // const tools: Tool[] = [
    //     { name: 'Wrench', icon: '🔧', brand: 'MILWAUKEE' },
    //     { name: 'Scissors', icon: '✂️', brand: 'MILWAUKEE' },
    //     { name: 'Screwdriver', icon: '🪛', brand: 'MILWAUKEE' },
    //     { name: 'Wrench', icon: '🔧', brand: 'MILWAUKEE' },
    // ];

    const editActions = [
        { icon: "/images/workspace/rotate_left.svg", label: 'rotate' },
        { icon: "/images/workspace/rotate_right.svg", label: 'rotate' },
        { icon: "/images/workspace/flip-horizontal.svg", label: 'flip' },
        { icon: "/images/workspace/flip_vertical.svg", label: 'flip' },
        { icon: "/images/workspace/group.svg", label: 'group' },
        { icon: "/images/workspace/ungroup.svg", label: 'ungroup' },
        { icon: "/images/workspace/undo.svg", label: 'undo' },
        { icon: "/images/workspace/redo.svg", label: 'redo' },
        { icon: "/images/workspace/copy.svg", label: 'copy' },
        { icon: "/images/workspace/paste.svg", label: 'paste' },
        { icon: "/images/workspace/zoom.svg", label: 'Zoom' },
        { icon: "/images/workspace/delete.svg", label: 'delete' },
        { icon: "/images/workspace/layout.svg", label: 'Auto Layout' },
        { icon: "/images/workspace/finger.svg", label: 'finger grip' },
        { icon: "/images/workspace/arrow.svg", label: 'arrow' },
    ];

    // const ToolInventoryView = () => (
    //     <>
    //         <div className="relative mb-4">
    //             <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    //             <input
    //                 type="text"
    //                 placeholder="Search Tools"
    //                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
    //             />
    //         </div>

    //         <div className="flex items-center justify-between mb-4">
    //             <span className="text-sm text-gray-600">Sort by:</span>
    //             <div className="flex items-center space-x-1 text-sm text-blue-600 cursor-pointer">
    //                 <span>All Brands</span>
    //                 <ChevronDown className="w-4 h-4" />
    //             </div>
    //         </div>

    //         <div className="space-y-2">
    //             {tools.map((tool, index) => (
    //                 <div
    //                     key={index}
    //                     className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
    //                 >
    //                     <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
    //                         <span className="text-lg">{tool.icon}</span>
    //                     </div>
    //                     <div className="flex-1">
    //                         <div className="flex items-center justify-between">
    //                             <span className="text-sm font-medium text-gray-900">{tool.name}</span>
    //                             <div className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium">
    //                                 {tool.brand}
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             ))}
    //         </div>
    //     </>
    // );

    const EditLayoutView = () => (
        <div className="space-y-6">
            {/* Edit Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit</h3>
                <div className="grid grid-cols-6 gap-2">
                    {editActions.map((action, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1">
                                <div className='w-6 h-6'>
                                    <Image src={action.icon} alt={action.label} width={4} height={4} className="w-full h-full object-cover" />
                                </div>
                            </button>
                            <span className="text-xs text-gray-500 text-center leading-tight">{action.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Appearance Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                <div className="space-y-4">
                    {/* Opacity */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Opacity</span>
                        <div className="flex justify-between items-center space-x-2 bg-[#F5F5F5] w-28 px-2 py-1">
                            <input
                                type="number"
                                defaultValue={100}
                                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                            />
                            <Image
                                src="/images/workspace/appearance.svg"
                                alt="appearance"
                                width={24}
                                height={24}
                            />
                        </div>
                    </div>

                    {/* Smooth */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Smooth</span>
                        <div className="flex justify-between items-center space-x-2 bg-[#F5F5F5] w-28 px-2 py-1">
                            <input
                                type="number"
                                defaultValue={100}
                                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                            />
                            <Image
                                src="/images/workspace/appearance.svg"
                                alt="appearance"
                                width={24}
                                height={24}
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* Alignment Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alignment</h3>
                <div className="flex space-x-4">
                    <div className="flex flex-col items-center">
                        <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1">
                            <div className='w-6 h-6'>
                                <Image src="/images/workspace/align_top.svg" alt="aligntop" width={4} height={4} className="w-full h-full object-cover" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">align top</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1">
                            <div className='w-6 h-6'>
                                <Image src="/images/workspace/align_bottom.svg" alt="alignbottom" width={4} height={4} className="w-full h-full object-cover" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">align bottom</span>
                    </div>
                </div>
            </div>

            {/* Add Shapes Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Shapes</h3>
                <div className="flex space-x-4">
                    <div className="flex flex-col items-center">
                        <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1">
                            <div className='w-6 h-6'>
                                <Image src="/images/workspace/circle.svg" alt="circle" width={4} height={4} className="w-full h-full object-cover" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">circle</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center mb-1">
                            <div className='w-6 h-6'>
                                <Image src="/images/workspace/square.svg" alt="square" width={4} height={4} className="w-full h-full object-cover" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500 text-center leading-tight">square</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4">
                <div className="flex justify-between items-center space-x-2 mb-4 bg-gray-100 py-2 px-2 rounded-md">
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium w-1/2 ${activeTab === 'inventory'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Tool Inventory
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium w-1/2 ${activeTab === 'edit'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        onClick={() => setActiveTab('edit')}
                    >
                        Edit Layout
                    </button>
                </div>

                {activeTab === 'inventory' ? <ToolInventoryView /> : <EditLayoutView />}
            </div>
        </div>
    );
};

export default Sidebar;