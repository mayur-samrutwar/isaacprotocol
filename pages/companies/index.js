import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';

export default function CompaniesPage() {
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
          <title>Companies - ISAAC Protocol</title>
          <meta name="description" content="Companies integrate ISAAC motion intelligence to accelerate humanoid deployment." />
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
        <title>Companies - ISAAC Protocol</title>
        <meta name="description" content="Companies integrate ISAAC motion intelligence to accelerate humanoid deployment." />
      </Head>
      
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="h-16"></div>
        
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold tracking-tight text-black/90 mb-2">
                Companies
              </h1>
              <p className="text-lg text-black/60 mb-8">
                Let's discuss how we can work together.
              </p>
              
              <a
                href="https://cal.com/mayurs/isaac"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <svg 
                  className="w-6 h-6 mr-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                Schedule a Call
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
