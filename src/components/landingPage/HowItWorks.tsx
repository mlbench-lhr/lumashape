'use client'

import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import { JSX } from 'react'

const Text = ({ as: Component = 'p', className = '', children, ...props }: {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return <Component className={className} {...props}>{children}</Component>
}

type DataItem = {
  id: number
  title?: string
  description?: string
  image?: string
  hasBackground?: boolean
  showButtons?: boolean
}


const data: { left: DataItem[]; right: DataItem[] } = {
  left: [
    {
      id: 1,
      image: '/images/logo/lumashape.svg',
      hasBackground: true,  // ✅ Type now recognized
      showButtons: true     // ✅ Type now recognized
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
      description:
        'Photograph each tool on printer paper. Lumashape detects the contour and saves it to your inventory.',
    },
    {
      id: 4,
      image: '/images/landing/canvas_image.svg',
    },
    {
      id: 6,
      title: 'Download and Fulfill',
      description: 'Export a DXF for cutting, or order a precision-cut foam insert.',
    },
    {
      id: 8,
      image: '/images/icons/LandingPage/howItWorks/Profit.jpg',
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
      className="xl:max-w-[1200px] max-w-[90%] mx-auto md:py-0 pb-2 mt-16"
      id="working"
    >
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: false }}
      >
        <Text as="h2" className="text-4xl font-bold text-center max-w-[80%] mx-auto mb-4">
          <span className="text-blue-600">How </span>It Works
        </Text>
        <Text
          as="p"
          className="text-center text-gray-600 mx-auto md:max-w-[80%] text-lg"
        >
          Lumashape simplifies the file creation process, offering an intuitive and user-friendly experience powered by advanced AI.
        </Text>
      </motion.div>

      <div className="relative hidden md:grid [grid-template-columns:2fr_auto_2fr] gap-10 mt-16 items-start">
        {/* Continuous vertical line */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 lg:bottom-[20%] md:bottom-[15%] bg-[#0000001A]"
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
                <>
                  {item.hasBackground ? (
                    <div className="w-full bg-blue-50 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[280px]">
                      <Image
                        className="w-full max-w-[300px] mb-6 mx-auto"
                        src={item.image}
                        alt={`left-${index}`}
                        width={200}
                        height={100}
                      />
                      {item.showButtons && (
                        <div className="flex gap-3 mt-4 justify-center">
                          <a href="#">
                            <Image
                              src="/images/icons/google-play.svg"
                              alt="Get it on Google Play"
                              width={180}
                              height={80}
                              className="h-15 w-auto"
                            />
                          </a>
                          <a href="#">
                            <Image
                              src="/images/icons/app-store.svg"
                              alt="Download on the App Store"
                              width={180}
                              height={80}
                              className="h-15 w-auto"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Image
                      className="w-full"
                      src={item.image}
                      alt={`left-${index}`}
                      width={300}
                      height={100}
                    />
                  )}
                </>

              ) : (
                <div className="text-left w-full">
                  <Text as="h4" className="text-xl font-semibold mb-2">
                    {item.title}
                  </Text>
                  <Text as="p" className="font-medium text-gray-600">
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
                  <Text as="h4" className="text-xl font-semibold mb-2">
                    {data.right[index]?.title}
                  </Text>
                  <Text as="p" className="font-medium text-gray-600">
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
                        <div>
                          {item.hasBackground ? (
                            <div className="bg-blue-50 rounded-3xl flex items-center justify-center">
                              <Image
                                src={item.image}
                                alt="image"
                                width={150}
                                height={75}
                                className="mb-4"
                              />
                              {item.showButtons && (
                                <div className="flex flex-col gap-2 w-full">
                                  <a href="#" className="block">
                                    <Image
                                      src="/images/icons/google-play.svg"
                                      alt="Get it on Google Play"
                                      width={120}
                                      height={35}
                                      className="h-9 w-auto mx-auto"
                                    />
                                  </a>
                                  <a href="#" className="block">
                                    <Image
                                      src="/images/icons/app-store.svg"
                                      alt="Download on the App Store"
                                      width={120}
                                      height={35}
                                      className="h-9 w-auto mx-auto"
                                    />
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Image
                              src={item.image}
                              alt="image"
                              width={300}
                              height={100}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                      )}
                      {item.title && (
                        <div className="my-3">
                          <Text as="h4" className="text-lg font-semibold mb-1">
                            {item.title}
                          </Text>
                          <Text
                            as="p"
                            className="font-medium text-base text-gray-600 max-w-[500px]"
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