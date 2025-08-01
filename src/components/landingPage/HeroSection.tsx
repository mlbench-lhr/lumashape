'use client'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { motion } from 'framer-motion'

import 'aos/dist/aos.css'
import Text from '../ui/Text'
import Button from '../ui/Button'
function HeroSection() {
  return (
    <div className="xl:max-w-[1200px] max-w-[90%] flex flex-col items-center justify-center mx-auto">
      <motion.div
        className="md:pt-20 md:pb-20 pt-16 pb-10"
        id="home"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false }}
      >
        <Text as="h1" className="text-center max-w-[70%] md:text-[50px] mx-auto font-bold  md:leading-none leading-[45px]">
          Create Custom 5S Foam Shadowboards.
        </Text>
        <Text
          as="p1"
          className="text-center text-secondary-light mx-auto font-medium md:max-w-[75%] mt-5"
        >
         Lumashape turns photos of your tools into cut-ready layouts no CAD required. Scan, drag, and arrange digitally. Download the DXF or submit for order fulfillment all from a single platform.
        </Text>
        <div className="my-10 flex justify-center">
          <Button
          className='md:px-8 px-6 md:py-3 py-2 text-lg rounded-full'
          >
            Try Lumashape Now
          </Button>
        </div>
        
      </motion.div>
      
    </div>
  )
}

export default HeroSection
