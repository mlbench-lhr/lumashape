'use client'
import Image from 'next/image'
import React from 'react'
// import { useTabContext } from '@/context/TabContsxt'
import Text from '../ui/Text'
import Link from 'next/link'
function ContactUsFooter() {
//   const { setActiveTab } = useTabContext()
//   const handleTabChange = (tab: string) => {
//     setActiveTab(tab)
//   }
  return (
    <div className=''>
      <div className="mt-20 bg-background-light py-5">
        <div className="flex md:flex-row flex-col xl:max-w-[1200px] max-w-[90%] mx-auto md:justify-center lg:gap-60 md:gap-20 xl:gap-70 2xl:gap-100 justify-between">
          {/* left */}
          <div>
            <Image src={"/images/logo/lumashape.svg"} width={380} height={70} alt={""} />
            <Text
              as="p1"
              className="font-medium text-secondary-light max-w-[420px] md:mt-10 mt-8"
            >
              Effortlessly create precise DXF files for manufacturing custom
              tool drawer inserts with AI-powered automation. Simplify your
              workflow and take tool organization to the next level. Start your
              free trial today!
            </Text>
            <div className="flex gap-6 max-w-[190px] items-center mt-8 md:mt-10">
              <div>
                <a href="https://www.linkedin.com/company/lumashape">
                  <Image
                    className="w-5"
                    src="/images/icons/social/linkedin.svg"
                    alt="Flowbite Logo"
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
                    alt="Flowbite Logo"
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
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault()
                //   handleTabChange('/home')
                  document.getElementById('home')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                Home
              </a>
              <a
                href="#benefits"
                onClick={(e) => {
                  e.preventDefault()
                //   handleTabChange('/benefits')
                  document.getElementById('benefits')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                Benefits
              </a>
              {/* <a
                href="#sample"
                onClick={(e) => {
                  e.preventDefault()
                  handleTabChange('/sample')
                  document.getElementById('sample')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                Samples
              </a> */}
              <a
                href="#working"
                onClick={(e) => {
                  e.preventDefault()
                //   handleTabChange('/working')
                  document.getElementById('working')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault()
                //   handleTabChange('/pricing')
                  document.getElementById('pricing')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                Pricing
              </a>
              <a
                href="#faqs"
                onClick={(e) => {
                  e.preventDefault()
                //   handleTabChange('/faqs')
                  document.getElementById('faqs')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                FAQ&apos;s
              </a>
              <Link href="Contact_Us">Contact Us</Link>
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

export default ContactUsFooter
