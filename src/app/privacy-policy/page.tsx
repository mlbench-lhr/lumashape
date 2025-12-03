'use client'

import Header from '@/components/landingPage/Header'
import Footer from '@/components/landingPage/Footer'

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-screen">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-600 text-lg">Last Updated: [Insert Date]</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-10 text-gray-700 leading-relaxed">
          <div className="bg-gray-50 border-l-4 border-gray-900 p-6 mb-8">
            <p className="text-base leading-relaxed">
              {`Lumashape LLC ("Lumashape," "we," "our," or "us") provides a mobile application and web-based platform that enable users to scan tools, generate contours, design foam layouts, publish designs publicly, and place custom manufacturing orders (collectively, the "Service"). This Privacy Policy describes how we collect, use, disclose, store, and protect your information when you access or use the Service.`}
            </p>
            <p className="mt-4 text-base leading-relaxed">
              By accessing or using Lumashape, you acknowledge that you have read, understood, and agree to be bound by the terms of this Privacy Policy. If you do not agree with these practices, please do not use our Service.
            </p>
          </div>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900">1.1 Information You Provide Directly</h3>
            <p className="mb-4">We collect information that you voluntarily provide to us when you use the Service, including:</p>
            <ul className="space-y-3 ml-6">
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Account Information:</span>
                  <span className="text-gray-700"> Your name, email address, username, password, and profile settings when you create an account.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Public Profile Content:</span>
                  <span className="text-gray-700"> Tool contours, layout designs, uploaded images, and profile information you choose to publish. You have the option to appear anonymously using an auto-generated username.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Design and Project Data:</span>
                  <span className="text-gray-700"> Images you upload, tool scans captured through the mobile application, tool metadata, contour edits, layout designs, and any assets you create within the Service.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Payment Information:</span>
                  <span className="text-gray-700"> Payment data is processed securely by Stripe, Inc., our third-party payment processor. Lumashape does not store complete credit card numbers or other sensitive payment credentials on our servers.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Communications:</span>
                  <span className="text-gray-700"> Emails, messages, or attachments you send to our customer support team or through the Service.</span>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">1.2 Information Collected Automatically</h3>
            <p className="mb-4">When you access or use the Service, we automatically collect certain information about your device and usage patterns, including:</p>
            <ul className="space-y-3 ml-6">
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Usage Data:</span>
                  <span className="text-gray-700"> Information about your interactions with the Service, including pages viewed, features used, time spent on the platform, and access times.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Device Information:</span>
                  <span className="text-gray-700"> IP address, browser type and version, device model, operating system, mobile device identifiers, and other technical information.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Cookies and Tracking Technologies:</span>
                  <span className="text-gray-700"> {`We use cookies, web beacons, and similar technologies for authentication, analytics, and to improve the Service's functionality and user experience.`}</span>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect for the following purposes:</p>
            <ul className="space-y-3 ml-6">
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To provide, operate, maintain, and improve the Lumashape platform and its features</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To generate tool contours and foam layout designs based on your specifications</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To process orders, payments, and transactions through our payment processor, Stripe</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To enable users to publish tool contours and layouts to our public community (when you choose to do so)</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To communicate with you regarding account updates, transactional notices, technical alerts, and customer support responses</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To enhance platform performance, develop new features, and improve security measures</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To detect, prevent, and address fraudulent, unauthorized, or illegal activity</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">To conduct research and analysis using aggregated or anonymized data to improve our algorithms and product development</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">3. Public Content and Publishing</h2>
            <p className="mb-4">Lumashape includes optional public-facing features that allow users to share their work with the community. Users may choose to:</p>
            <ul className="space-y-3 ml-6 mb-4">
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">Publish tool contours for others to view and use</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">Publish completed layout designs to showcase their work</span>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <span className="text-gray-700">Display a custom username or appear anonymously with an auto-generated identifier</span>
              </li>
            </ul>
            <p className="bg-amber-50 border-l-4 border-amber-500 p-4">
              <span className="font-semibold text-gray-900">Important:</span> Published content may be visible to other users and the general public. You retain control over your published content and may remove or unpublish it at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">4. How We Share Your Information</h2>
            <p className="mb-6 font-semibold text-gray-900">We do not sell your personal information to third parties.</p>
            <p className="mb-4">We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900 mt-6">4.1 Service Providers</h3>
            <p className="mb-3">We engage trusted third-party service providers to perform functions and provide services to us, including:</p>
            <ul className="space-y-2 ml-6 mb-4">
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Payment processing (Stripe, Inc.)</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Cloud hosting and infrastructure services</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Data storage and database management</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Analytics and performance monitoring</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Manufacturing and order fulfillment partners</span></li>
            </ul>
            <p className="text-gray-700">These service providers are contractually obligated to protect your information and may only use it to perform services on our behalf.</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900 mt-6">4.2 Manufacturing and Fulfillment Partners</h3>
            <p className="text-gray-700 mb-4">When you place a custom manufacturing order, we share only the information necessary to manufacture and deliver your product, such as design specifications, shipping address, and order details.</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900 mt-6">4.3 Legal Requirements and Protection</h3>
            <p className="text-gray-700">We may disclose your information if required to do so by law or in response to valid requests by public authorities. We may also disclose information when we believe it is necessary to:</p>
            <ul className="space-y-2 ml-6 mt-3">
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Comply with legal obligations, court orders, or legal processes</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Enforce our Terms of Service and other agreements</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Protect the rights, property, or safety of Lumashape, our users, or the public</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Detect, prevent, or address fraud, security, or technical issues</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">5. Data Storage and Security</h2>
            <p className="mb-4">We implement industry-standard security measures to protect your information, including:</p>
            <ul className="space-y-3 ml-6 mb-4">
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Encryption in Transit:</span>
                  <span className="text-gray-700"> All data transmitted between your device and our servers is encrypted using HTTPS/TLS protocols.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Secure Password Storage:</span>
                  <span className="text-gray-700"> Passwords are hashed using industry-standard cryptographic algorithms.</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Payment Security:</span>
                  <span className="text-gray-700"> {`All payment processing is handled by Stripe's PCI-DSS compliant infrastructure.`}</span>
                </div>
              </li>
              <li className="flex">
                <span className="mr-3 text-gray-400">•</span>
                <div>
                  <span className="font-semibold text-gray-900">Access Controls:</span>
                  <span className="text-gray-700"> Internal access to user data is restricted to authorized personnel on a need-to-know basis.</span>
                </div>
              </li>
            </ul>
            <p className="bg-blue-50 border-l-4 border-blue-500 p-4 text-gray-700">
              <span className="font-semibold text-gray-900">Please Note:</span> No method of transmission over the internet or electronic storage is completely secure. While we strive to protect your information using commercially acceptable means, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">6. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900">6.1 Account Access and Updates</h3>
            <p className="mb-4 text-gray-700">You may access, review, and update your account information at any time through your account settings or by contacting us directly.</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900">6.2 Public Content Control</h3>
            <p className="mb-4 text-gray-700">You have complete control over the content you publish. You may unpublish or delete your tool contours or layout designs from public visibility at any time.</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900">6.3 Data Deletion Requests</h3>
            <p className="mb-4 text-gray-700">You may request deletion of your personal data or closure of your entire account by contacting us at <span className="font-semibold">support@lumashape.com</span>. We will respond to your request within a reasonable timeframe in accordance with applicable law. Please note that certain information may be retained as required by law or for legitimate business purposes.</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900">6.4 Marketing Communications</h3>
            <p className="mb-4 text-gray-700">You may opt out of receiving promotional emails from us by following the unsubscribe instructions in those emails. Please note that you will continue to receive transactional and service-related communications.</p>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-900">6.5 Cookie Preferences</h3>
            <p className="text-gray-700">You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of the Service.</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">{`7. Children's Privacy`}</h2>
            <p className="mb-3 text-gray-700">The Service is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13.</p>
            <p className="text-gray-700">If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete that information as quickly as possible. If you believe we have collected information from a child under 13, please contact us immediately at <span className="font-semibold">support@lumashape.com</span>.</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">8. International Data Transfers</h2>
            <p className="mb-3 text-gray-700">Lumashape operates in the United States. If you are accessing the Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate.</p>
            <p className="text-gray-700">By using the Service, you consent to the transfer of your information to countries outside of your country of residence, which may have different data protection laws than your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">9. Data Retention</h2>
            <p className="text-gray-700">We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When determining retention periods, we consider:</p>
            <ul className="space-y-2 ml-6 mt-3 mb-3">
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">The nature and sensitivity of the information</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">The purposes for which we process the information</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Legal and regulatory obligations</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">Potential disputes or legal claims</span></li>
            </ul>
            <p className="text-gray-700">After the retention period expires, we will securely delete or anonymize your personal information.</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">10. Changes to This Privacy Policy</h2>
            <p className="mb-3 text-gray-700">We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes, we will:</p>
            <ul className="space-y-2 ml-6 mb-3">
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">{`Update the "Last Updated" date at the top of this Privacy Policy`}</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">{`Post the revised Privacy Policy on our website and through the Service`}</span></li>
              <li className="flex"><span className="mr-3 text-gray-400">•</span><span className="text-gray-700">{`Notify you of material changes via email or through a prominent notice on the Service`}</span></li>
            </ul>
            <p className="text-gray-700">Your continued use of the Service after any changes indicates your acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.</p>
          </section>

          <section className="bg-gray-900 text-white p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-6">11. Contact Us</h2>
            <p className="mb-4">If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <div className="space-y-2">
              <p className="font-semibold text-lg">Lumashape LLC</p>
              <p>Email: <a href="mailto:support@lumashape.com" className="underline hover:text-gray-300">support@lumashape.com</a></p>
            </div>
            <p className="mt-6 text-gray-300 text-sm">We will respond to your inquiry within a reasonable timeframe.</p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}