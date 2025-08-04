import Footer from '@/components/landingPage/Footer'
import Header from '@/components/landingPage/Header'
import Text from '@/components/ui/Text'
import React from 'react'

const ContactUs = () => {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">

        <div>
          <Text as="h1" className="text-center max-w-[70%] mx-auto font-bold md:text-[40px] text-[30px]  md:leading-none leading-[45px] mb-4">Get In Touch</Text>
        </div>
        <div>
          <Text as="p1" className="text-center text-secondary-light mx-auto font-medium md:max-w-[75%] mt-5">
            We are here to help you, Our  team would love to hear from you and will get back to you in 24 hours.
          </Text>
        </div>

      </div>
      <Footer />
    </>
  )
}

export default ContactUs