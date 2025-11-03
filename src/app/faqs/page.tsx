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
            question: "What is Lumashape?",
            answer: "Lumashape is a platform that makes it easy to scan tools, design layouts, and create custom foam inserts — all within one connected ecosystem.",
        },
        {
            question: "How does Lumashape work?",
            answer: "You scan your tools with the mobile app, organize them into layouts through the web app, then either download the cut file for DIY production or order finished foam shadowboards directly through Lumashape.",
        },
        {
            question: "Is Lumashape free to use?",
            answer: "Yes — scanning tools, building layouts, and downloading cut files are completely free. The only costs occur when you submit your shadowboard for order fullfilment (to cover material and shipping) or import a completed layout from another creator.",
        },
        {
            question: "Why does importing a layout cost money?",
            answer: "Importing a finished layout includes a small fee that goes directly to the creator as a reward for their effort and the timesaving value their design provides.",
        },
        {
            question: "What is the Lumashape ecosystem?",
            answer: "It’s a shared library where users can upload tool scans and completed layouts for others to explore, import, and build from — fostering collaboration and efficiency.",
        },
        {
            question: "How does profit sharing work?",
            answer: "When another user imports your published layout, Lumashape automatically pays you a portion of that transaction as profit sharing.",
        },
        {
            question: "Do I need design or CAD experience?",
            answer: "No — Lumashape is built to automate the technical work so anyone can create precise, ready-to-cut layouts in minutes.",
        },
        {
            question: "Can I use Lumashape without a laser or cutting system?",
            answer: "Yes. You can still create layouts digitally and have them produced through Lumashape’s order fulfillment option, which includes material and shipping costs.",
        },
        {
            question: "Who can contribute to the ecosystem?",
            answer: "Anyone with a Lumashape account can upload tool scans or publish completed layouts, making it easier for others to stay organized.",
        },
        {
            question: "What makes Lumashape different?",
            answer: "Lumashape unites scanning, layout design, and community sharing into a free, connected platform that rewards creators and streamlines tool organization from start to finish.",
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