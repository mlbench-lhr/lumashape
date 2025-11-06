import ContactForm from '@/components/landingPage/ContactForm'
import Footer from '@/components/landingPage/Footer'
import Header from '@/components/landingPage/Header'
import Text from '@/components/ui/Text'
import React from 'react'


const page = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24 flex-grow">
                <div
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">

                        {/* Main Heading */}
                        <Text as="h2" className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-4">Get in Touch</Text>

                        {/* Description */}
                        <Text as="p1" className="text-md sm:text-lg text-paragraph max-w-3xl mx-auto mb-8 text-secondary-light leading-relaxed">
                            We’re here to help. Our team would love to hear from you and will get back to you as soon as possible.
                        </Text>

                    </div>
                    <ContactForm/>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default page