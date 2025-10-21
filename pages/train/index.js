import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import TaskCard from '@/components/TaskCard';
import Navbar from '@/components/Navbar';

export default function TrainPage() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { isConnected } = useAccount();
  const tasks = [
    { id: 't1', title: 'Move', company: 'Atlas Dynamics', pay: '$12/task' },
    { id: 't2', title: 'Press Button', company: 'Prime Motion', pay: '$8/task' },
    { id: 't3', title: 'Open Door', company: 'Keystone Labs', pay: '$10/task' }
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

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
