'use client'
import Image from 'next/image'
import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Text from '../ui/Text'
type included = {
  id: number
  text: string
}

type DataItem = {
  id: number
  desc: string
  title: string
  price: string
  include: included[]
  buttonText: string
  height: number
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  priceColor: string
  smallTextColor: string
  icon: string
}

const bilingPlans: DataItem[] = [
  {
    id: 1,
    desc: '',
    title: 'Free Trial',
    price: 'Free',
    include: [
      {
        id: 1,
        text: 'Create & submit foam insert layouts for cutting',
      },
      {
        id: 2,
        text: 'Access to public layout & tool contour library',
      },
      {
        id: 3,
        text: 'No payment info required',
      },
    ],
    buttonText: 'Start Free Trial',
    height: 70,
    backgroundColor: 'white',
    textColor: 'black',
    buttonColor: '#266CA8',
    buttonTextColor: 'white',
    priceColor: '#266CA8',
    smallTextColor: '#22222280',
    icon: '/images/icons/LandingPage/Check Circle.svg',
  },
  {
    id: 2,
    desc: 'For Small Teams',
    title: 'Pro',
    price: '$20/Month',
    include: [
      {
        id: 1,
        text: 'Unlimited DXF downloads',
      },
      {
        id: 2,
        text: 'Full access to DXF customization tools',
      },
      {
        id: 3,
        text: 'Customer Support',
      },
      {
        id: 4,
        text: 'Cancel or modify anytime',
      },
    ],
    buttonText: 'Get Started',
    height: 80,
    backgroundColor: '#266CA8',
    textColor: 'white',
    buttonColor: 'white',
    buttonTextColor: '#266CA8',
    priceColor: 'white',
    smallTextColor: '#FFFFFFB2',
    icon: '/images/icons/LandingPage/White Check Circle.svg',
  },
  {
    id: 3,
    desc: 'For Professionals',
    title: 'Coming Soon...',
    price: '$100/Month',
    include: [
      {
        id: 1,
        text: 'Unlimited DXF downloads',
      },
      {
        id: 2,
        text: 'Share and manage layouts within your team',
      },
      {
        id: 3,
        text: 'Access to custom foam design services',
      },
      {
        id: 4,
        text: 'Add up to 5 users to your organization',
      },
      {
        id: 5,
        text:
          'Exclusive Customer Support',
      },
      {
        id: 6,
        text: 'And more…',
      },
      
    ],
    buttonText: 'Get Started',
    height: 70,
    backgroundColor: 'white',
    textColor: 'black',
    buttonColor: '#266CA8',
    buttonTextColor: 'white',
    priceColor: '#266CA8',
    smallTextColor: '#22222280',
    icon: '/images/icons/LandingPage/Check Circle.svg',
  },
]

function Pricing() {
  const router = useRouter()

  return (
    <div
      className="xl:max-w-[1200px] max-w-[90%] mx-auto md:py-20 mt-12 md:mt-0"
      id="pricing"
    >
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: false }}
      >
        <Text
          as="h2"
          className="font-bold text-center md:max-w-[80%] mx-auto leading-[44px] mb-3"
        >
          <span className="text-primary">Our </span> Pricing Plans
        </Text>
        <Text
          as="p1"
          className="text-center text-secondary-light mx-auto font-medium md:max-w-[90%]"
        >
          Choose a plan that fits your needs, and let&apos;s start designing
          together.
        </Text>
      </motion.div>
      <div className="w-full overflow-hidden">
        <div className="w-full grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-2 justify-stretch items-center mt-12">
          {bilingPlans.map((item) => (
            <motion.div
              key={item.id}
              initial={
                item.id === 1
                  ? { opacity: 0, x: -50 }
                  : item.id === 2
                  ? { opacity: 0, y: 50 }
                  : item.id === 3
                  ? { opacity: 0, x: 50 }
                  : { opacity: 0 }
              }
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className={clsx(
                'border p-6 rounded-3xl flex flex-col border-secondary/12 justify-between mx-auto w-full md:max-w-[386px] max-w-[350px]',
                item.id === 1 && 'h-[600px]',
                item.id === 2 && 'h-[650px]',
                item.id === 3 && 'h-[600px]',
              )}
              style={{
                background: item.backgroundColor,
                color: item.textColor,
              }}
            >
              <div>
                <p
                  className="font-medium text-base"
                  style={{ color: item.smallTextColor }}
                >
                  {item.desc}
                </p>
                <p className="font-semibold text-3xl">{item.title}</p>
                <p className="mt-6">
                  <span
                    className="text-4xl font-semibold"
                    style={{ color: item.priceColor }}
                  >
                    {item.price.includes('/')
                      ? item.price.split('/')[0]
                      : item.price}
                  </span>
                  {item.price.includes('/') && (
                    <span
                      className="text-base font-medium"
                      style={{ color: item.smallTextColor }}
                    >
                      /{item.price.split('/')[1]}
                    </span>
                  )}
                </p>

                <p className="font-semibold text-base mt-5 mb-2">
                  What&apos;s Included
                </p>
                {item.include.map((inc) => (
                  <div key={inc.id} className="flex items-start pb-2">
                    <Image
                      src={item.icon}
                      alt=""
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                    <p
                      className="font-medium text-base"
                      style={{ color: item.smallTextColor }}
                    >
                      {inc.text}
                    </p>
                  </div>
                ))}
              </div>
               {item.title !== 'Free Trial' && (
              <button
                className="mt-4 py-2 px-4 rounded-full text-center font-semibold"
                style={{
                  color: item.buttonTextColor,
                  background: item.buttonColor,
                  cursor:
                    item.title === 'Coming Soon...' ? 'not-allowed' : 'pointer',
                  opacity: item.title === 'Coming Soon...' ? 0.6 : 1,
                }}
                disabled={item.title === 'Coming Soon...'}
                // onClick={() => {
                //   if (item.title !== 'Coming Soon...') {
                //     router.push('/user')
                //   }
                // }}
              >
                {item.buttonText}
              </button>
               )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pricing
