'use client'
import Image from 'next/image'
import React from 'react'
import { useRouter } from 'next/navigation'
// import { useTabContext } from '@/context/TabContsxt'
import Text from '../ui/Text'
import Link from 'next/link'

function Footer() {
  const router = useRouter()
  
  //   const { setActiveTab } = useTabContext()
  //   const handleTabChange = (tab: string) => {
  //     setActiveTab(tab)
  //   }

  const handleSectionNavigation = (sectionId: string) => {
    // Check if we're already on the home page
    if (window.location.pathname === '/' || window.location.pathname === '/home') {
      // If on home page, just scroll to the section
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
      // If on a different page, navigate to home with the section hash
      router.push(`/#${sectionId}`)
    }
  }

  return (
    <div className=''>
      <div className="mt-20 bg-background-light py-5">
        <div className="flex md:flex-row flex-col xl:max-w-[1200px] max-w-[90%] mx-auto md:justify-center lg:gap-60 md:gap-20 xl:gap-70 2xl:gap-100 justify-between">
          {/* left */}
          <div>
            <Image src={"/images/logo/lumashape.svg"} className='md:w-[380px] w-[300px]' width={380} height={70} alt={""} />
            <Text
              as="p1"
              className="font-medium text-secondary-light max-w-[420px] md:mt-10 mt-8"
            >
              Design, share, and order tool inserts in a connected ecosystem.
            </Text>
            <div className="flex gap-6 max-w-[190px] items-center mt-8 md:mt-10">
              <div>
                <a href="https://www.linkedin.com/company/lumashape">
                  <Image
                    className="w-5"
                    src="/images/icons/social/linkedin.svg"
                    alt="LinkedIn"
                    width={30}
                    height={20}
                  />
                </a>
              </div>
              <div className="self-end">
                <a href="https://m.youtube.com/@Lumashape">
                  <Image
                    className="w-5"
                    src="/images/icons/social/youtube.svg"
                    alt="Youtube"
                    width={30}
                    height={20}
                  />
                </a>
              </div>
            </div>
          </div>
          {/* right */}
          <div className="md:mt-0 mt-10">
            <p className="font-semibold md:text-2xl text-xl mb-4">
              Quick Links
            </p>
            <div className="text-secondary-light font-medium md:text-lg text-sm space-y-4 flex flex-col pl-1">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleSectionNavigation('home')
                }}
                className="text-left hover:text-primary cursor-pointer transition-colors"
              >
                Home
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleSectionNavigation('benefits')
                }}
                className="text-left hover:text-primary cursor-pointer transition-colors"
              >
                Benefits
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleSectionNavigation('working')
                }}
                className="text-left hover:text-primary cursor-pointer transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleSectionNavigation('pricing')
                }}
                className="text-left hover:text-primary cursor-pointer transition-colors"
              >
                Pricing
              </button>
              <Link
                href="/faqs"
                className="hover:text-primary cursor-pointer transition-colors"
              >
                FAQ&apos;s
              </Link>
              <Link 
                href="/contact-us"
                className="hover:text-primary cursor-pointer transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
        {/* <hr className="my-5" /> */}
        <div className='w-full h-[1px] bg-gray-300 mt-10 mb-5'></div>
        <div className="w-full flex justify-start xl:max-w-[1200px] max-w-[90%] mx-auto items-center text-center z-50 md:ps-14">
          <Text className="text-center font-normal text-secondary-light text-sm md:text-base">
            Lumashape LLC | © 2025 | All Rights Reserved
          </Text>
        </div>
      </div>
    </div>
  )
  
}

export default Footer