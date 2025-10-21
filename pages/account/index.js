import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';

export default function AccountPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { address, isConnected, isConnecting } = useAccount();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle wallet connection state
  useEffect(() => {
    console.log('Account page - isConnected:', isConnected, 'isConnecting:', isConnecting);
    
    // Add a small delay to ensure wallet state is properly loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isConnected) {
        console.log('Redirecting to home - wallet not connected');
        router.push('/');
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [isConnected, isConnecting, router]);

  // Show loading state while checking connection
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Account - ISAAC Protocol</title>
          <meta name="description" content="Manage your ISAAC Protocol account and view your earnings." />
        </Head>
        
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-black rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-black/60">Checking wallet connection...</p>
          </div>
        </div>
      </>
    );
  }

  // Show mobile prompt for small screens
  if (isMobile) {
    return (
      <>
        <Head>
          <title>Account - ISAAC Protocol</title>
          <meta name="description" content="Manage your ISAAC Protocol account and view your earnings." />
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

  const formatAddress = (addr) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleVerifyHuman = () => {
    // Simulate verification process
    setIsVerified(true);
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'history', label: 'History' }
  ];

  const mockHistory = [
    { id: 1, task: 'Move', company: 'Atlas Dynamics', amount: '$12', date: '2024-01-15', status: 'Completed' },
    { id: 2, task: 'Press Button', company: 'Prime Motion', amount: '$8', date: '2024-01-14', status: 'Completed' },
    { id: 3, task: 'Open Door', company: 'Keystone Labs', amount: '$10', date: '2024-01-13', status: 'Completed' }
  ];

  return (
    <>
      <Head>
        <title>Account - ISAAC Protocol</title>
        <meta name="description" content="Manage your ISAAC Protocol account and view your earnings." />
      </Head>
      
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="h-16"></div>
        
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold tracking-tight text-black/90">
                Account
              </h1>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-black text-black'
                        : 'border-transparent text-black/60 hover:text-black/80 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex items-center space-x-1">
                      <span className="text-black/90 font-mono text-sm">{formatAddress(address)}</span>
                      {isVerified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Earnings Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-black/70">Total Earned</h3>
                      <svg className="w-5 h-5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-black/90 mb-1">$30</div>
                    <div className="text-sm text-black/60">3 tasks completed</div>
                  </div>

                  {/* Tasks Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-black/70">Tasks</h3>
                      <svg className="w-5 h-5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-black/90 mb-1">3</div>
                    <div className="text-sm text-black/60">Completed</div>
                  </div>
                </div>

                {/* Verification Button */}
                {!isVerified && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-black/90 mb-2">Complete Verification</h3>
                      <p className="text-black/60 mb-4">
                        Verify that you're a human to access training tasks
                      </p>
                      <button
                        onClick={handleVerifyHuman}
                        className="px-6 py-3 bg-black text-white rounded-lg font-medium transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/20"
                      >
                        Verify Human
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-black/90 mb-6">Training History</h2>
                  
                  <div className="space-y-3">
                    {mockHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {item.task.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-black/90">{item.task}</h3>
                            <p className="text-sm text-black/60">{item.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-black/90">{item.amount}</div>
                          <div className="text-sm text-black/60">{item.date}</div>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
