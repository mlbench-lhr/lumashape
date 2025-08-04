'use client'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { motion } from 'framer-motion'

import 'aos/dist/aos.css'
import Text from '../ui/Text'
import { div } from 'framer-motion/client'
const WhyChoose = () => {
    return (
        <div className="xl:max-w-7xl max-w-[78%] flex flex-col items-center justify-center mx-auto">
            <div className=" " id="benefits">
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: false }}
                >
                    <Text as="h2" className="text-center mb-3">
                        Why <span className="text-primary">Choose</span> Lumashape
                    </Text>
                    <Text
                        as="p1"
                        className="text-center text-secondary-light mx-auto font-medium max-w-[75%]"
                    >
                        Lumashape makes it easy to create tool drawer foam inserts without manual tracing or CAD work. Scan individual tools, build layouts digitally, and export ready-to-cut files or submit for fulfillment.
                    </Text>
                </motion.div>
                <div className="flex md:flex-row flex-col pt-20 justify-between items-start ">
                    {/* AI powered */}
                    <motion.div
                        className="flex flex-col items-center md:w-1/3"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: false }}
                    >
                        <Image
                            src="/images/icons/LandingPage/AI.svg"
                            alt=""
                            className=""
                            width={120}
                            height={100}
                        />
                        <Text as="h4" className="text-center md:w-[70%] w-[50%] mt-5 mb-2">
                            Order Fullfillment Included
                        </Text>
                        <Text
                            as="p1"
                            className="text-center text-secondary-light mx-auto font-medium max-w-[70%]"
                        >
                            Submit your layout for fulfillment and receive a professionally cut foam insert no equipment needed. Shipping is fast, and quality is guaranteed.
                        </Text>
                    </motion.div>

                    {/* custom offset */}
                    <motion.div
                        className="flex flex-col items-center md:mt-0 mt-10 md:w-1/3"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: false }}
                    >
                        <Image
                            src="/images/icons/LandingPage/access.svg"
                            alt=""
                            className=""
                            width={120}
                            height={100}
                        />
                        <Text as="h4" className="font-bold text-center w-[80%] mt-5 mb-2">
                            Profit Sharing
                        </Text>
                        <Text
                            as="p1"
                            className="text-center text-secondary-light mx-auto max-w-[80%]"
                        >
                            Share your tool scans and layouts with the Lumashape community to reduce redundant scanning and design work. When others import your published layouts, you earn 25% of the import fee turning your contributions into passive income.
                        </Text>
                    </motion.div>
                    {/* access Anytime */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center md:mt-0 mt-10 md:w-1/3"

                    >
                        <Image
                            src="/images/icons/LandingPage/fast.svg"
                            alt=""
                            className=""
                            width={120}
                            height={100}
                        />
                        <Text as="h4" className="font-bold text-center w-[80%] mt-5 mb-2">
                            Customer Support
                        </Text>
                        <Text
                            as="p1"
                            className="text-center text-secondary-light mx-auto font-medium max-w-[80%]"
                        >
                            Support comes directly from the developers behind the software,
                            ensuring fast, expert assistance.
                        </Text>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default WhyChoose