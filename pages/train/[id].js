import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Spline from '@splinetool/react-spline';

export default function TrainCardPage() {
  const router = useRouter();
  const { id } = router.query;

  // Task data based on ID
  const taskData = {
    t1: { title: 'Move', company: 'Atlas Dynamics', pay: '$12/task' },
    t2: { title: 'Press Button', company: 'Prime Motion', pay: '$8/task' },
    t3: { title: 'Open Door', company: 'Keystone Labs', pay: '$10/task' }
  };

  const currentTask = taskData[id] || taskData.t1;

  return (
    <>
      <Head>
        <title>{currentTask.title} - Train</title>
        <meta name="description" content={`Train ${currentTask.title} task`} />
      </Head>
      
      <div className="min-h-screen bg-black flex items-center justify-center">
        {/* 3D Robot Hand */}
        <div className="w-full h-screen">
          <Spline
            scene="https://prod.spline.design/HbW5HOB3GbmgVFbh/scene.splinecode" 
          />
        </div>
      </div>
    </>
  );
}
