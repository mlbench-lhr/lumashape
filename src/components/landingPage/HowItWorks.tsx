'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import Text from '../ui/Text'
type DataItem = {
  id: number
  title?: string
  description?: string
  image?: string
}

const data: { left: DataItem[]; right: DataItem[] } = {
  left: [
    {
      id: 1,
      image: '/images/icons/LandingPage/howItWorks/preview.webp',
    },
    {
      id: 3,
      title: 'Build Your Layout',
      description:
        'Drag tools into the layout builder and customize your design with rotation, text, finger holes, cut depths, and more.',
    },
    {
      id: 5,
      image: '/images/icons/LandingPage/howItWorks/save.webp',
      
    },
    {
        id: 7,
       title: 'Share and Earn',
       description: 'Publish your layouts to the community and earn 25% when others import them.',
    }
  ],
  right: [
    {
      id: 2,
      title: 'Scan Your Tools',
      description: `Photograph each tool on printer paper. Lumashape detects the contour and saves it to your inventory.`,
    },
    {
      id: 4,
      image: '/images/icons/LandingPage/howItWorks/Layout.webp',
    },
    {
      id: 6,
      title: 'Download and Fulfill',
      description: `Export a DXF for cutting, or order a precision-cut foam insert.`,
    },
    {
      id: 8,
      image: '/images/icons/LandingPage/howItWorks/Earnings.webp', // Add your fourth step image
    }
  ],
}

const desiredOrder = [1, 2, 3, 4, 5, 6, 7, 8]

const combinedArray = [...data.left, ...data.right].sort(
  (a, b) => desiredOrder.indexOf(a.id) - desiredOrder.indexOf(b.id),
)
const stepImages = ['one', 'two', 'three', 'four']

function HowItWorks() {
  return (
    <div
      className="xl:max-w-[1200px] max-w-[90%] mx-auto  md:py-0 pb-2 mt-16"
      id="working"
    >
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: false }}
      >
        <Text as="h2" className="text-center max-w-[80%] mx-auto mb-1">
          <span className="text-primary">How </span>It Works
        </Text>
        <Text
          as="p1"
          className="text-center text-secondary-light mx-auto md:max-w-[80%]"
        >
          Lumashape simplifies the file creation process, offering an intuitive and user-friendly experience powered by advanced AI.
        </Text>
      </motion.div>
      <div className="relative hidden md:grid [grid-template-columns:2fr_auto_2fr] gap-10 mt-16 items-start ">
        {/* Continuous vertical line that spans from just below image 1 to just above image 3 */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 lg:bottom-[20%] md:bottom-[15%] bg-[#0000001A] "
          style={{ top: '96px', width: '3px' }}
        ></div>

        {data.left.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* Left Section */}
            <motion.div
              className="flex justify-end items-center relative z-10"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false }}
            >
              {item.image ? (
                <Image
                  className="w-full"
                  src={item.image}
                  alt={`left-${index}`}
                  width={300}
                  height={100}
                />
              ) : (
                <div className="text-left w-full">
                  <Text as="h4" className="font-semibold mb-1">
                    {item.title}
                  </Text>
                  <Text as="p1" className="font-medium text-secondary-light">
                    {item.description}
                  </Text>
                </div>
              )}
            </motion.div>

            {/* Center Section (Step Images) */}
            <motion.div
              className="flex flex-col justify-center relative z-10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: false }}
            >
              <Image
                className="w-24 h-24"
                src={`/images/icons/LandingPage/howItWorks/${stepImages[index]}.svg`}
                alt={`step-${stepImages[index]}`}
                width={96}
                height={96}
              />
            </motion.div>

            {/* Right Section */}
            <motion.div
              className="flex justify-start items-start relative z-10"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false }}
            >
              {data.right[index]?.image ? (
                <Image
                  className="w-full"
                  src={data.right[index].image}
                  alt={`right-${index}`}
                  width={300}
                  height={100}
                />
              ) : (
                <div className="text-left w-full">
                  <Text as="h4" className="font-semibold mb-1">
                    {data.right[index]?.title}
                  </Text>
                  <Text as="p1" className="font-medium text-secondary-light">
                    {data.right[index]?.description}
                  </Text>
                </div>
              )}
            </motion.div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-[10px] justify-center mx-auto mt-10 md:hidden">
        {/* line */}
        <div className="flex flex-col -ml-5">
          {[
            { img: '/images/icons/LandingPage/howItWorks/one.svg', indices: [1, 2] },
            { img: '/images/icons/LandingPage/howItWorks/two.svg', indices: [3, 4] },
            { img: '/images/icons/LandingPage/howItWorks/three.svg', indices: [5, 6] },
            { img: '/images/icons/LandingPage/howItWorks/four.svg', indices: [7, 8] },
          ].map(({ img, indices }, i) => (
            <div key={i} className="flex items-start">
              {/* Image */}
              <div className="flex flex-col items-center">
                <Image
                  className="z-10 h-full w-2/3 mx-auto"
                  src={img}
                  alt={`step-${i + 1}`}
                  width={35}
                  height={100}
                />
                {/* Line except for last */}
                {i < 3 && (
                  <Image
                    className="z-0 h-full opacity-60 mx-auto"
                    src="/images/icons/LandingPage/howItWorks/line.svg"
                    alt="centerline"
                    width={5}
                    height={80}
                  />
                )}
              </div>

              {/* Data */}
              <div className="">
                {combinedArray
                  .filter((_, index) => indices.includes(index + 1))
                  .map((item) => (
                    <div key={item.id} className="mb-5">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt="image"
                          width={300}
                          height={100}
                          className="object-cover w-full h-full"
                        />
                      )}
                      {item.title && (
                        <div className="my-3">
                          <Text as="h4" className="font-semibold mb-1">
                            {item.title}
                          </Text>
                          <Text
                            as="p1"
                            className="font-medium text-base text-secondary-light max-w-[500px]"
                          >
                            {item.description}
                          </Text>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HowItWorks