import { useState, useEffect } from 'react';
import Hero from './../Components/Hero';
import NearbyMap from './../Components/NearbyMap';
import About from './About';
import Testimonial from './Testimonial';
import Contact from './Contact';
import { Footer } from './Footer';
import DoctorImg from '../assets/Doctor.png';
import DoctorsImg from '../assets/Doctors.png';

const SCROLL_POS_KEY = "docscout_scroll_pos";

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function Home() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [heroRestored, setHeroRestored] = useState(false);
  const loaded = imagesLoaded && heroRestored;

  useEffect(() => {
    let remaining = 2;
    const done = () => { remaining--; if (remaining <= 0) setImagesLoaded(true); };

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

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(SCROLL_POS_KEY, String(window.scrollY));
        ticking = false;
      });
    };
    const flush = () => sessionStorage.setItem(SCROLL_POS_KEY, String(window.scrollY));
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const savedScrollY = sessionStorage.getItem(SCROLL_POS_KEY);
    if (savedScrollY === null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: parseInt(savedScrollY, 10), behavior: "instant" });
    });
  }, [loaded]);

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
        <Hero onRestoreComplete={() => setHeroRestored(true)} />
        <NearbyMap />
        <About />
        <Testimonial />
        <Contact />
        <Footer />
      </div>
    </>
  );
}

export default Home;
