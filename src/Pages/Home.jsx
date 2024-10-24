import React from 'react'
import Hero from './../Components/Hero';
import About from './About';
import Testimonial from './Testimonial';
import Contact from './Contact';
import { Footer } from './Footer';

function Home() {
  return (
    <div>
      <Hero></Hero>
      <About></About>
      <Testimonial></Testimonial>
      <Contact></Contact>
      <Footer></Footer>
    </div>
  )
}

export default Home