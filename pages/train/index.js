import { useEffect, useState } from 'react';
import Head from 'next/head';
import Spline from '@splinetool/react-spline';

export default function TrainPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Show mobile prompt for small screens
  if (isMobile) {
    return (
      <>
        <Head>
          <title>Train - ISAAC Protocol</title>
          <meta name="description" content="Train high‑fidelity motion models by contributing precise human movement data." />
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
        <title>Train - ISAAC Protocol</title>
        <meta name="description" content="Train high‑fidelity motion models by contributing precise human movement data." />
      </Head>
      
      <div className="min-h-screen bg-gray-900">
        {/* Full screen Spline 3D Hand */}
        <div className="w-full h-screen">
          <Spline
            scene="https://prod.spline.design/HbW5HOB3GbmgVFbh/scene.splinecode" 
          />
        </div>
      </div>
    </>
  );
}
