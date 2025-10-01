'use client'

import { useState } from 'react';
import Header from '@/components/landingPage/Header';
import Footer from '@/components/landingPage/Footer';
import Image from 'next/image';

export default function FAQSection() {
    // Explicitly type the state
    const [openItems, setOpenItems] = useState<{ [key: number]: boolean }>({}); // openItems will have numeric keys with boolean values

    // Define the function parameter type
    const toggleItem = (index: number) => {  // Explicitly type 'index' as a number
        setOpenItems((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const faqItems = [
        {
            question: "How do I scan my tools into Lumashape?",
            answer: "Place each tool flat on a single sheet of printer paper (US Letter, A4, or A3 depending on the tool size) and take a clear, overhead photo. Lumashape uses the paper size to automatically scale the contour.",
        },
        {
            question: "Can I scan multiple tools at once?",
            answer: "No. Each tool must be scanned individually to ensure accurate scaling and easy reuse in future layouts.",
        },
        {
            question: "Do I need CAD experience?",
            answer: "Not at all. Lumashape handles contour detection, scaling, and layout building automatically—no CAD or manual tracing required.",
        },
        {
            question: "What can I do in the layout builder?",
            answer: "You can drag in tools, rotate, position, add finger holes, insert text, draw shapes, assign cut depths, and more. It's a full-featured digital workspace for layout creation.",
        },
        {
            question: "What file format does Lumashape export?",
            answer: "DXF. This format is compatible with CO₂ lasers, CNC routers, waterjets, and other cutting machines.",
        },
        {
            question: "How does order fulfillment work?",
            answer: "Instead of cutting locally, you can submit your layout for fulfillment. We'll cut your foam insert to spec and ship it directly to your door.",
        },
        {
            question: "Can I share my layouts with other users?",
            answer: "Yes. You can publish tool scans and completed layouts to the Lumashape community to help others save time and effort.",
        },
        {
            question: "Do I get paid if others use my layout?",
            answer: "Yes. You earn 25% of the import fee every time another user imports your published layout into their own project.",
        },
        {
            question: "What causes errors during scanning?",
            answer: [
                "Most Commonly:",
                {
                    "id": 1,
                    "cause": "Tool not fully visible or cropped at the paper edge"
                },
                {
                    "id": 2,
                    "cause": "Shadows, glare, or poor lighting"
                },
                {
                    "id": 3,
                    "cause": "Wrong paper size selection"
                },
                {
                    "id": 4,
                    "cause": "Busy or low-contrast backgrounds"
                }
            ]
        },
        {
            question: "Can I reuse my scanned tools in multiple layouts?",
            answer: "Yes. Once a tool is scanned and added to your inventory, you can use it across any number of layouts without rescanning—saving time and ensuring consistency."
        }

    ];

    return (
        <>
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
                {/* Header with fade-in animation */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-slide-up">
                        <span className='text-primary'> Frequently</span> Asked Questions
                    </h1>
                    <p className="text-secondary-light text-lg animate-slide-up-delay">
                        Have Queries?? WE have got answers, find quick answers to all of your questions!!
                    </p>
                </div>

                {/* FAQ Items with staggered animations */}
                <div className="space-y-4">
                    {faqItems.map((item, index) => (
                        <div 
                            key={index} 
                            className="bg-white overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-[1.02]  rounded-lg animate-fade-in-up"
                            style={{ 
                                animationDelay: `${index * 0.1}s`,
                                animationFillMode: 'both'
                            }}
                        >
                            <button
                                onClick={() => toggleItem(index)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-300 ease-in-out group rounded-lg"
                            >
                                <span className="text-gray-900 font-semibold text-xl pr-4 group-hover:text-primary transition-colors duration-300">
                                    {item.question}
                                </span>
                                <div className="flex-shrink-0 transition-transform duration-300 ease-in-out">
                                    {openItems[index] ? (
                                        <div className="transform rotate-180 transition-transform duration-300">
                                            <Image 
                                                src="/images/icons/Faqs/Minus.svg" 
                                                className='cursor-pointer hover:scale-110 transition-transform duration-200' 
                                                alt="minus" 
                                                width={36} 
                                                height={36} 
                                            />
                                        </div>
                                    ) : (
                                        <div className="transform rotate-0 transition-transform duration-300 group-hover:rotate-90">
                                            <Image 
                                                src="/images/icons/Faqs/Plus.svg" 
                                                className='cursor-pointer hover:scale-110 transition-transform duration-200' 
                                                alt="Plus" 
                                                width={36} 
                                                height={36} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Animated content area */}
                            <div 
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                                    openItems[index] 
                                        ? 'max-h-96 opacity-100' 
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                {item.answer && (
                                    <div className="px-6 pb-5 border-t border-gray-100 transform transition-transform duration-300">
                                        {Array.isArray(item.answer) ? (
                                            <div className="pt-4 text-lg leading-relaxed text-gray-600 space-y-2">
                                                {item.answer.map((point, i) =>
                                                    typeof point === 'string' ? (
                                                        <p 
                                                            key={`text-${i}`} 
                                                            className="font-semibold animate-slide-in"
                                                            style={{ animationDelay: `${i * 0.1}s` }}
                                                        >
                                                            {point}
                                                        </p>
                                                    ) : (
                                                        <ul 
                                                            key={`list-${i}`} 
                                                            className="list-disc list-inside space-y-1"
                                                        >
                                                            <li 
                                                                className="animate-slide-in hover:text-primary transition-colors duration-200"
                                                                style={{ animationDelay: `${i * 0.1}s` }}
                                                            >
                                                                {point.cause}
                                                            </li>
                                                        </ul>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 pt-4 text-lg leading-relaxed animate-slide-in">
                                                {item.answer}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="border-b border-gray-300 mb-8 transition-colors duration-300 group-hover:border-primary"></div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />


        </>
    );
}