import React, { useState, useEffect } from 'react';
import Hero from './../Components/Hero';
import About from './About';
import Testimonial from './Testimonial';
import Contact from './Contact';
import { Footer } from './Footer';
import DoctorImg from '../assets/Doctor.png';
import DoctorsImg from '../assets/Doctors.png';

function Home() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let remaining = 2;
    const done = () => { remaining--; if (remaining <= 0) setLoaded(true); };

    [DoctorImg, DoctorsImg].forEach((src) => {
      const img = new Image();
      img.src = src;
      if (img.complete) {
        done();
      } else {
        img.onload = done;
        img.onerror = done;
      }
    });
  }, []);

  return (
    <>
      {!loaded && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#fff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '20px',
          }}
        >
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#1a8efd', letterSpacing: '-0.5px' }}>
            DocScout
          </span>
          <div style={{
            width: '36px', height: '36px',
            border: '3.5px solid #e5e7eb',
            borderTopColor: '#1a8efd',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <Hero />
        <About />
        <Testimonial />
        <Contact />
        <Footer />
      </div>
    </>
  );
}

export default Home;
