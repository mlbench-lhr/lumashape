import Banner from "@/components/landingPage/Banner";
import Footer from "@/components/landingPage/Footer";
import Header from "@/components/landingPage/Header";
import HeroSection from "@/components/landingPage/HeroSection";
import HowItWorks from "@/components/landingPage/HowItWorks";
import Layout from "@/components/landingPage/Layout";
import Pricing from "@/components/landingPage/Pricing";
import WhyChoose from "@/components/landingPage/WhyChoose";
import Image from "next/image";

export default function Home() {
  return (
    <div>
    <Layout>
  
      <Banner />
      <HeroSection />
      <WhyChoose/>
      <HowItWorks />  
      <Pricing/>
    
    </Layout>
    </div>
  );
}
