import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Spline from '@splinetool/react-spline';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

export default function TrainCardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pose tracking refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseDetectorRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const visionFilesetRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastVideoTsRef = useRef(0);
  const [isPoseTrackingReady, setIsPoseTrackingReady] = useState(false);

  // Task data based on ID
  const taskData = {
    t1: { title: 'Move', company: 'Atlas Dynamics', pay: '$12/task' },
    t2: { title: 'Press Button', company: 'Prime Motion', pay: '$8/task' },
    t3: { title: 'Open Door', company: 'Keystone Labs', pay: '$10/task' }
  };

  const currentTask = taskData[id] || taskData.t1;

  // Initialize pose detection
  const initializePoseDetection = async () => {
    try {
      setIsLoading(true);
      // Initialize TensorFlow.js
      await tf.ready();
      await tf.setBackend('webgl');
      
      // Load MoveNet model for arms only
      const poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
      );
      
      poseDetectorRef.current = poseDetector;
      
      // Initialize MediaPipe Hand Landmarker for detailed fingers
      if (typeof window !== 'undefined' && !handLandmarkerRef.current) {
        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        visionFilesetRef.current = fileset;
        
        try {
          handLandmarkerRef.current = await vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
              delegate: 'GPU'
            },
            numHands: 2,
            runningMode: 'VIDEO',
            minHandDetectionConfidence: 0.2,
            minHandPresenceConfidence: 0.2,
            minTrackingConfidence: 0.2
          });
        } catch (error) {
          // Try with CPU instead of GPU
          handLandmarkerRef.current = await vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
              delegate: 'CPU'
            },
            numHands: 2,
            runningMode: 'VIDEO',
            minHandDetectionConfidence: 0.2,
            minHandPresenceConfidence: 0.2,
            minTrackingConfidence: 0.2
          });
        }
      }
      
      setIsPoseTrackingReady(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing pose detection:', err);
      setIsLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = async () => {
          // Set canvas size to match video
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          
          await initializePoseDetection();
          detectPoses();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsLoading(false);
    }
  };

  // Draw hand landmarks (detailed fingers)
  const drawHands = (ctx, handsLandmarks) => {
    const connections = [
      // Thumb
      [0,1],[1,2],[2,3],[3,4],
      // Index
      [0,5],[5,6],[6,7],[7,8],
      // Middle
      [0,9],[9,10],[10,11],[11,12],
      // Ring
      [0,13],[13,14],[14,15],[15,16],
      // Pinky
      [0,17],[17,18],[18,19],[19,20]
    ];

    handsLandmarks.forEach(points => {
      // Draw connections
      ctx.strokeStyle = 'rgba(0, 255, 127, 0.9)';
      ctx.lineWidth = 2;
      connections.forEach(([a,b]) => {
        const pa = points[a];
        const pb = points[b];
        const ax = pa.x * canvasRef.current.width;
        const ay = pa.y * canvasRef.current.height;
        const bx = pb.x * canvasRef.current.width;
        const by = pb.y * canvasRef.current.height;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      });
      
      // Draw keypoints
      points.forEach(p => {
        const x = p.x * canvasRef.current.width;
        const y = p.y * canvasRef.current.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 127, 0.9)';
        ctx.fill();
      });
    });
  };

  // Draw arm connections (shoulders to wrists)
  const drawArms = (ctx, poses) => {
    if (!poses || poses.length === 0) return;

    const pose = poses[0];
    const keypoints = pose.keypoints;

    // Draw arm keypoints
    const armKeypoints = ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'];
    armKeypoints.forEach((keypointName) => {
      const keypoint = keypoints.find(kp => kp.name === keypointName);
      if (keypoint && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 127, 0.9)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw arm connections only
    const armConnections = [
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist']
    ];

    ctx.strokeStyle = 'rgba(255, 0, 127, 0.8)';
    ctx.lineWidth = 4;

    armConnections.forEach(([startName, endName]) => {
      const startPoint = keypoints.find(kp => kp.name === startName);
      const endPoint = keypoints.find(kp => kp.name === endName);
      
      if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });
  };

  // Detect poses and hands
  const detectPoses = async () => {
    if (!poseDetectorRef.current || !videoRef.current || !canvasRef.current) return;

    try {
      const poses = await poseDetectorRef.current.estimatePoses(videoRef.current);
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Draw arms (shoulders to wrists)
      if (poses && poses.length > 0) {
        drawArms(ctx, poses);
      }
      
      // Draw detailed hand landmarks
      if (handLandmarkerRef.current) {
        const now = performance.now();
        lastVideoTsRef.current = now;
        const handResult = handLandmarkerRef.current.detectForVideo(videoRef.current, now);
        
        if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
          drawHands(ctx, handResult.landmarks);
        }
      }
    } catch (err) {
      console.error('Pose detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectPoses);
  };

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>{currentTask.title} - Train</title>
        <meta name="description" content={`Train ${currentTask.title} task`} />
      </Head>
      
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        {/* 3D Robot Hand */}
        <div className="w-full h-screen">
          <Spline
            scene="https://prod.spline.design/HbW5HOB3GbmgVFbh/scene.splinecode" 
          />
        </div>

        {/* Meeting Card - Single Card that Expands/Minimizes */}
        <div 
          onClick={() => setIsCardExpanded(!isCardExpanded)}
          className={`fixed z-50 transition-all duration-500 ease-in-out cursor-pointer ${
            isCardExpanded 
              ? 'bottom-6 right-6 w-[90vw] h-[85vh]' 
              : 'bottom-6 right-6 w-48 h-32'
          }`}
        >
          <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
            {/* Hidden video element */}
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />
            
            {/* Canvas for pose tracking */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Minimize/Close button - only show when expanded */}
            {isCardExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCardExpanded(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
