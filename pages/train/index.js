import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import TaskCard from '@/components/TaskCard';
import Navbar from '@/components/Navbar';

export default function TrainPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();
  const tasks = [
    { id: 't1', title: 'Move Object', company: 'Atlas Dynamics', pay: '$12/task', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }, // 3 days from now
    { id: 't2', title: 'Move Object', company: 'Atlas Dynamics', pay: '$12/task', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }, // 3 days from now
    { id: 't3', title: 'Move Object', company: 'Atlas Dynamics', pay: '$12/task', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }  // 3 days from now
  ];

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
    console.log('Train page - isConnected:', isConnected, 'isConnecting:', isConnecting);
    
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
          <title>Train - ISAAC Protocol</title>
          <meta name="description" content="Train high‑fidelity motion models by contributing precise human movement data." />
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

  return (
    <>
      <Head>
        <title>Train</title>
        <meta name="description" content="Train high‑fidelity motion models by contributing precise human movement data." />
      </Head>
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="h-16"></div>
        <section className="px-6 py-12">
          <div className="max-w-5xl mx-auto pl-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  company={task.company}
                  pay={task.pay}
                  deadline={task.deadline}
                  onClick={() => router.push(`/train/${task.id}`)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
