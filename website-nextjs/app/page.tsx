import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import MockupCarousel from '@/components/MockupCarousel'
import Services from '@/components/Services'
import Features from '@/components/Features'
import CTA from '@/components/CTA'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <MockupCarousel />
        <Services />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

