import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { Process } from './components/Process'
import { Prices } from './components/Prices'
import { Portfolio } from './components/Portfolio'
import { WhyUs } from './components/WhyUs'
import { Reviews } from './components/Reviews'
import { Contacts } from './components/Contacts'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <Prices />
        <Portfolio />
        <WhyUs />
        <Reviews />
        <Contacts />
      </main>
      <Footer />
    </div>
  )
}
