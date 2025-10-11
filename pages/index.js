import { useEffect, useState } from 'react';
import Head from 'next/head';
import LeftMenu from '../components/LeftMenu';
import CustomConnectButton from '../components/CustomConnectButton';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  useEffect(() => {
    // Load the Spline viewer script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.10.77/build/spline-viewer.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Show mobile prompt for small screens
  if (isMobile) {
    return (
      <>
        <Head>
          <title>ISAAC Protocol - Motion Intelligence for Robots</title>
          <meta name="description" content="Perform precise actions. Your movement trains high‑fidelity control models at scale. Earn rewards." />
        </Head>
        
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            
            <div className="space-y-6">
              <p className="text-lg text-black/60 leading-relaxed">
                This app is optimized for desktop browsers. 
                Your robot overlords demand a proper screen!
              </p>
            
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>ISAAC Protocol - Motion Intelligence for Robots</title>
        <meta name="description" content="Perform precise actions. Your movement trains high‑fidelity control models at scale. Earn rewards." />
      </Head>
      
      <div className="min-h-screen bg-white text-black scroll-smooth">
      <LeftMenu />
      
      {/* Connect Button */}
      <div className="fixed top-6 right-6 z-50">
        <CustomConnectButton />
      </div>
      
      {/* White overlay to hide Spline watermark */}
      <div className="absolute bottom-4 right-4 w-40 h-12 bg-white z-40 rounded-md"></div>
      
      <div id="home" className="flex flex-col items-center justify-center pt-10 md:pt-16">
        <spline-viewer 
          url="https://prod.spline.design/sXUn1mneJhZQ7kXH/scene.splinecode"
          className="w-full h-screen"
        />
      {/* Headline and subtext */}
      <div className="mt-4 md:mt-6 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-black/80">
          Motion intelligence for robots
        </h1>
        <p className="mt-5 text-lg md:text-xl text-black/60 font-normal">
          Perform precise actions. Your movement trains high‑fidelity control models at scale. Earn rewards.
        </p>
      </div>
      {/* Scroll down button removed */}
      </div>
      {/* About section for left menu anchor */}
      <section id="train" className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <p className="text-base md:text-lg text-black/60">
            Train high‑fidelity motion models by contributing precise human movement data.
          </p>
        </div>
      </section>
      <section id="companies" className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <p className="text-base md:text-lg text-black/60">
            Companies integrate ISAAC motion intelligence to accelerate humanoid deployment.
          </p>
        </div>
      </section>
      <section id="about" className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <p className="text-base md:text-lg text-black/60">
            We build motion intelligence for next‑generation humanoid robots.
          </p>
        </div>
      </section>
      </div>

      <style jsx>{`
        spline-viewer {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>
    </>
  );
}
