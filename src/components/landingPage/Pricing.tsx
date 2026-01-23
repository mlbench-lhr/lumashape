'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Text from '../ui/Text'
import { loadStripe } from '@stripe/stripe-js'
import axios from 'axios'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
)

type included = {
  id: number
  text: string
}

type DataItem = {
  id: number
  desc: string
  title: string
  price: string
  price_id: string
  plan_name: string
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
    title: '',
    price: 'Free',
    price_id: '',
    plan_name: 'Free',
    include: [
      {
        id: 1,
        text: 'Unlimited tool Scans',
      },
      {
        id: 2,
        text: 'Create unlimited tool layouts',
      },
      {
        id: 3,
        text: 'Submit layouts for custom cut foam inserts',
      },
      {
        id: 4,
        text: 'Limited DXF downloads',
      },
      {
        id: 5,
        text: 'No payment info required',
      },
    ],
    buttonText: 'Create Free Account',
    height: 70,
    backgroundColor: 'white',
    textColor: 'black',
    buttonColor: '#266CA8',
    buttonTextColor: 'white',
    priceColor: '#111111',
    smallTextColor: '#22222280',
    icon: '/images/icons/LandingPage/Check Circle.svg',
  },
  {
    id: 2,
    desc: 'For Makers',
    title: 'Pro',
    price: '$8/Month',
    price_id: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!,
    plan_name: 'Pro',
    include: [
      {
        id: 1,
        text: 'Everything included in free plan',
      },
      {
        id: 2,
        text: 'Unlimited DXF downloads',
      },
      {
        id: 3,
        text: 'Priority Support',
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

]

function Pricing() {
  const router = useRouter()
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null)

  const handleSubscribe = async (
    price_id: string,
    plan_name: string,
    planId: number,
  ) => {
    setProcessingPlanId(planId)
    
    try {
      if (plan_name === 'Free') {
        // Handle free trial - redirect to signup/login
        router.push('/auth/signup')
        return
      }

      // Check if user is authenticated
      const authToken = localStorage.getItem('auth-token')
      if (!authToken) {
        // Redirect to login if not authenticated
        router.push('/auth/login')
        return
      }

      // Proceed with Stripe checkout
      const res = await axios.post('/api/user/checkout', {
        price_id: price_id,
        plan_name: plan_name,
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.data.sessionId) throw new Error('Missing sessionId from API')

      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to initialize')

      await stripe.redirectToCheckout({ sessionId: res.data.sessionId })
    } catch (error) {
      console.error('Checkout Error:', error)
      // You might want to show an error toast here
    } finally {
      setProcessingPlanId(null)
    }
  }

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
          Start free, upgrade when you need more.
        </Text>
      </motion.div>
      <div className="w-full overflow-hidden">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 justify-stretch items-center mt-12">
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
              <button
                className={`mt-4 py-2 px-4 rounded-full text-center font-semibold ${
                  processingPlanId === item.id || item.title === 'Coming Soon...'
                    ? 'cursor-not-allowed opacity-70'
                    : 'cursor-pointer'
                }`}
                style={{
                  color: item.buttonTextColor,
                  background: item.buttonColor,
                }}
                disabled={processingPlanId === item.id || item.title === 'Coming Soon...'}
                onClick={() => handleSubscribe(item.price_id, item.plan_name, item.id)}
              >
                {processingPlanId === item.id ? 'Processing...' : item.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pricing
