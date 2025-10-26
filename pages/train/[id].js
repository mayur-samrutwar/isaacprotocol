import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import Spline from '@splinetool/react-spline';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';


export default function TrainCardPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isConnected, isConnecting } = useAccount();
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mockup success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [recordingScore, setRecordingScore] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  
  // Pose tracking refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseDetectorRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const visionFilesetRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastVideoTsRef = useRef(0);
  const [isPoseTrackingReady, setIsPoseTrackingReady] = useState(false);
  
  // Robot control state
  const [robotState, setRobotState] = useState({
    rotation: 0,      // -1 (left), 0 (center), 1 (right)
    shoulder: 0,      // -1 (down), 0 (center), 1 (up)
    elbow: 0          // 0 (down), 1 (up) - toggle state
  });
  
  // Gesture tracking refs
  const lastHandPositionsRef = useRef({ left: null, right: null });
  const gestureThresholdsRef = useRef({
    // State detection thresholds - IMPROVED SENSITIVITY
    stateChangeThreshold: 0.1,      // Smaller threshold for more sensitive detection
    towardsScreenThreshold: 0.08,   // More sensitive towards screen detection
    awayFromScreenThreshold: 0.12,  // More sensitive away from screen detection
    
    // Simple vertical control
    verticalThreshold: 50,          // pixels for up/down movement
    
    // Rotation increments - INCREASED FOR MORE MOVEMENT
    rotationIncrement: 30,          // degrees per gesture (doubled from 15)
  });
  
  // Debug and debouncing
  const lastElbowToggleRef = useRef(0);
  const debugInfoRef = useRef({});
  
  // State tracking for rotation detection
  const rotationStateRef = useRef({
    currentState: 'normal', // 'normal', 'towards_screen', 'away_from_screen'
    lastState: 'normal',
    stateChangeTime: 0,
    baselineDistance: null, // Store normal position distance
    clockwiseRotations: 0, // Track how many clockwise rotations we've done
    lastRotationTime: 0
  });

  // Task data based on ID
  const taskData = {
    t1: { title: 'Move', company: 'Atlas Dynamics', pay: '$12/task' },
    t2: { title: 'Press Button', company: 'Prime Motion', pay: '$8/task' },
    t3: { title: 'Open Door', company: 'Keystone Labs', pay: '$10/task' }
  };

  const currentTask = taskData[id] || taskData.t1;

  // Mockup function to show success popup
  const showMockupSuccess = () => {
    // Generate random score between 0.1-0.5
    const score = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
    setRecordingScore(score);
    
    // Generate truncated transaction ID
    const fullTxId = '0x' + Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8);
    const truncatedTxId = fullTxId.substring(0, 8) + '...' + fullTxId.substring(fullTxId.length - 4);
    setTransactionId(truncatedTxId);
    
    // Show success popup
    setShowSuccessPopup(true);
  };

  // Auto-show success popup after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      showMockupSuccess();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

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

  // Simulate keyboard events for robot control
  const simulateKeyDown = (keyCode) => {
    const event = new KeyboardEvent('keydown', {
      key: keyCode,
      code: keyCode,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
  };

  const simulateKeyUp = (keyCode) => {
    const event = new KeyboardEvent('keyup', {
      key: keyCode,
      code: keyCode,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
  };

  // Robot control functions - Simplified for 3D orientation
  const controlRobot = (gesture) => {
    setRobotState(prev => {
      const newState = { ...prev };
      
      // Rotation control (left/right arrow equivalent) - Fixed increments
      if (gesture.rotation !== undefined && gesture.rotation !== prev.rotation) {
        // Release previous rotation key
        if (prev.rotation === 1) {
          simulateKeyUp('ArrowRight');
        } else if (prev.rotation === -1) {
          simulateKeyUp('ArrowLeft');
        }
        
        newState.rotation = gesture.rotation;
        
        // Press new rotation key for fixed duration
        if (gesture.rotation === 1) {
          simulateKeyDown('ArrowRight'); // Clockwise rotation
          setTimeout(() => simulateKeyUp('ArrowRight'), 200); // Hold for 200ms
        } else if (gesture.rotation === -1) {
          simulateKeyDown('ArrowLeft'); // Anticlockwise rotation
          setTimeout(() => simulateKeyUp('ArrowLeft'), 200); // Hold for 200ms
        }
      }
      
      // Elbow toggle (up arrow equivalent) - single press
      if (gesture.elbowToggle) {
        newState.elbow = newState.elbow === 0 ? 1 : 0;
        simulateKeyDown('ArrowUp'); // Elbow toggle
        // Immediately release for toggle behavior
        setTimeout(() => simulateKeyUp('ArrowUp'), 50);
      }
      
      return newState;
    });
  };

  // Analyze gestures from pose data - Focus on 3D arm orientation
  const analyzeGestures = (poses, handLandmarks) => {
    if (!poses || poses.length === 0) return;
    
    const pose = poses[0];
    const keypoints = pose.keypoints;
    
    // Get key points for RIGHT ARM ONLY
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
    const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    
    if (!rightWrist || !rightElbow || !rightShoulder || 
        rightWrist.score < 0.3 || rightElbow.score < 0.3) {
      return;
    }
    
    const thresholds = gestureThresholdsRef.current;
    
    // Calculate movement deltas for vertical control
    const currentRightPos = { x: rightWrist.x, y: rightWrist.y };
    const lastRightPos = lastHandPositionsRef.current.right;
    
    if (!lastRightPos) {
      lastHandPositionsRef.current.right = currentRightPos;
      return;
    }
    
    const rightDeltaY = currentRightPos.y - lastRightPos.y;
    
    // Calculate 3D arm orientation using elbow-wrist line length
    const elbowWristDistance = Math.sqrt(
      Math.pow(rightWrist.x - rightElbow.x, 2) + 
      Math.pow(rightWrist.y - rightElbow.y, 2)
    );
    
    // Normalize distance (0-1 scale based on typical arm length)
    const normalizedDistance = Math.min(elbowWristDistance / 150, 1.0);
    
    // Store debug info
    debugInfoRef.current = {
      elbowWristDistance: elbowWristDistance.toFixed(1),
      normalizedDistance: normalizedDistance.toFixed(2),
      rightDeltaY: rightDeltaY.toFixed(1),
      gesture: {},
      rawWrist: { x: rightWrist.x.toFixed(1), y: rightWrist.y.toFixed(1) },
      rawElbow: { x: rightElbow.x.toFixed(1), y: rightElbow.y.toFixed(1) }
    };
    
    const gesture = {};
    
    // 1. STATE-BASED ROTATION CONTROL
    console.log(`Distance: ${elbowWristDistance.toFixed(1)}px, Normalized: ${normalizedDistance.toFixed(2)}`);
    
    const state = rotationStateRef.current;
    const now = Date.now();
    
    // Initialize baseline distance (normal position)
    if (state.baselineDistance === null) {
      state.baselineDistance = normalizedDistance;
      console.log(`📍 Baseline distance set: ${state.baselineDistance.toFixed(2)}`);
    }
    
    // Determine current state based on distance relative to baseline - IMPROVED SENSITIVITY
    let currentState = 'normal';
    const distanceDiff = normalizedDistance - state.baselineDistance;
    
    if (distanceDiff < -thresholds.towardsScreenThreshold) { // Towards screen (shorter)
      currentState = 'towards_screen';
    } else if (distanceDiff > thresholds.awayFromScreenThreshold) { // Away from screen (longer)
      currentState = 'away_from_screen';
    }
    
    // Detect state changes
    if (currentState !== state.currentState) {
      console.log(`🔄 State change: ${state.currentState} → ${currentState}`);
      state.lastState = state.currentState;
      state.currentState = currentState;
      state.stateChangeTime = now;
    }
    
    // Generate rotation commands based on state transitions - IMPROVED LOGIC
    let detectedRotation = 0;
    
    // Clockwise: when moving towards screen
    if (currentState === 'towards_screen' && state.lastState === 'normal') {
      detectedRotation = 1; // Clockwise
      state.clockwiseRotations++;
      console.log(`🔄 CLOCKWISE: Moving towards screen (${state.clockwiseRotations} total)`);
    }
    // Anticlockwise: when returning to normal from towards_screen
    else if (currentState === 'normal' && state.lastState === 'towards_screen' && state.clockwiseRotations > 0) {
      detectedRotation = -1; // Anticlockwise
      state.clockwiseRotations--;
      console.log(`🔄 ANTICLOCKWISE: Returning to normal (${state.clockwiseRotations} remaining)`);
    }
    
    // Additional: Clockwise when moving away from screen (for better coverage)
    if (currentState === 'away_from_screen' && state.lastState === 'normal') {
      detectedRotation = 1; // Clockwise
      state.clockwiseRotations++;
      console.log(`🔄 CLOCKWISE: Moving away from screen (${state.clockwiseRotations} total)`);
    }
    // Anticlockwise: when returning to normal from away_from_screen
    else if (currentState === 'normal' && state.lastState === 'away_from_screen' && state.clockwiseRotations > 0) {
      detectedRotation = -1; // Anticlockwise
      state.clockwiseRotations--;
      console.log(`🔄 ANTICLOCKWISE: Returning to normal from away (${state.clockwiseRotations} remaining)`);
    }
    
    // Apply rotation with reduced cooldown for smoother control
    if (detectedRotation !== 0 && (now - state.lastRotationTime) > 500) { // Reduced from 1000ms to 500ms
      gesture.rotation = detectedRotation;
      state.lastRotationTime = now;
    } else {
      gesture.rotation = 0;
    }
    
    // 2. SIMPLE VERTICAL CONTROL (Up Arrow Toggle)
    console.log(`Vertical movement: ${rightDeltaY.toFixed(1)}px (threshold: ${thresholds.verticalThreshold})`);
    
    if (Math.abs(rightDeltaY) > thresholds.verticalThreshold && 
        (now - lastElbowToggleRef.current) > 1000) { // 1 second debounce
      if (rightDeltaY < 0) { // Moving up
      gesture.elbowToggle = true;
      lastElbowToggleRef.current = now;
        console.log('⬆️ ELBOW TOGGLE DETECTED');
      }
    }
    
    debugInfoRef.current.gesture = gesture;
    
    // Control robot if gesture detected
    if (Object.keys(gesture).length > 0) {
      controlRobot(gesture);
    }
    
    // Update last positions
    lastHandPositionsRef.current.right = currentRightPos;
  };

  // Detect poses and hands
  const detectPoses = async () => {
    if (!poseDetectorRef.current || !videoRef.current || !canvasRef.current) return;

    try {
      const poses = await poseDetectorRef.current.estimatePoses(videoRef.current);
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      let handLandmarks = null;
      
      // Draw detailed hand landmarks
      if (handLandmarkerRef.current) {
        const now = performance.now();
        lastVideoTsRef.current = now;
        const handResult = handLandmarkerRef.current.detectForVideo(videoRef.current, now);
        
        if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
          handLandmarks = handResult.landmarks;
          drawHands(ctx, handLandmarks);
        }
      }
      
      // Draw arms (shoulders to wrists)
      if (poses && poses.length > 0) {
        drawArms(ctx, poses);
        
        // Analyze gestures for robot control
        analyzeGestures(poses, handLandmarks);
      }
    } catch (err) {
      console.error('Pose detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectPoses);
  };

  // Handle wallet connection state
  useEffect(() => {
    console.log('Train task page - isConnected:', isConnected, 'isConnecting:', isConnecting);
    
    // Add a small delay to ensure wallet state is properly loaded
    const timer = setTimeout(() => {
      setIsWalletLoading(false);
      if (!isConnected) {
        console.log('Redirecting to home - wallet not connected');
        router.push('/');
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [isConnected, isConnecting, router]);

  // Start camera on mount
  useEffect(() => {
    if (!isWalletLoading) {
    startCamera();
    }
  }, [isWalletLoading]);

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

  // Show loading state while checking wallet connection
  if (isWalletLoading) {
    return (
      <>
        <Head>
          <title>{currentTask.title} - Train</title>
          <meta name="description" content={`Train ${currentTask.title} task`} />
        </Head>
        
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-600 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-white/60">Checking wallet connection...</p>
          </div>
        </div>
      </>
    );
  }

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

        {/* Mockup Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]">
            <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Captured Successfully!</h2>
              
              <div className="space-y-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Performance Score</div>
                  <div className="text-3xl font-bold text-green-600">
                    {recordingScore.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Reward Released</div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-sm font-mono text-gray-800">
                      {transactionId}
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="mt-6 w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

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
            
            {/* Robot Control Status */}
            {/* <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm font-mono">
              <div className="space-y-1">
                <div>Rotation: {robotState.rotation === -1 ? 'LEFT ←' : robotState.rotation === 1 ? 'RIGHT →' : 'CENTER'}</div>
                <div>Shoulder: {robotState.shoulder === -1 ? 'DOWN ↓' : robotState.shoulder === 1 ? 'UP ↑' : 'CENTER'}</div>
                <div>Elbow: {robotState.elbow === 1 ? 'UP ↑' : 'DOWN ↓'}</div>
                <div className="text-xs text-gray-300 mt-2">
                  Gesture → Keyboard Events
                </div>
              </div>
            </div> */}

            {/* Debug Info */}
            <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
              <div className="space-y-1">
                <div className="text-blue-300 font-bold">3D Arm Orientation</div>
                <div>Elbow-Wrist Distance: {debugInfoRef.current.elbowWristDistance || '0.0'}px</div>
                <div>Normalized: {debugInfoRef.current.normalizedDistance || '0.00'}</div>
                <div className="text-gray-300 mt-2">
                  Right ΔY: {debugInfoRef.current.rightDeltaY || '0.0'}px (need &gt;50px)
                </div>
                <div className="text-gray-300 mt-2">
                  Wrist: ({debugInfoRef.current.rawWrist?.x || '0'}, {debugInfoRef.current.rawWrist?.y || '0'})
                </div>
                <div className="text-gray-300 mt-2">
                  Elbow: ({debugInfoRef.current.rawElbow?.x || '0'}, {debugInfoRef.current.rawElbow?.y || '0'})
                </div>
                <div className="text-gray-300 mt-2">
                  Gesture: {JSON.stringify(debugInfoRef.current.gesture || {})}
                </div>
                <div className="text-yellow-300 mt-2 text-xs">
                  State: {rotationStateRef.current.currentState} | Baseline: {rotationStateRef.current.baselineDistance?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-green-300 mt-2 text-xs">
                  Clockwise Count: {rotationStateRef.current.clockwiseRotations} | Cooldown: 500ms
                </div>
                <div className="text-blue-300 mt-2 text-xs">
                  Towards: &lt;-0.08 | Normal: ±0.1 | Away: &gt;0.12
                </div>
              </div>
            </div>


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

        {/* Test Buttons - Outside Card */}
        {/* <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg z-40">
          <div className="text-xs font-mono mb-3">Test Keyboard Events:</div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onMouseDown={() => simulateKeyDown('ArrowLeft')}
              onMouseUp={() => simulateKeyUp('ArrowLeft')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-mono"
            >
              ← Left
            </button>
            <button 
              onMouseDown={() => simulateKeyDown('ArrowRight')}
              onMouseUp={() => simulateKeyUp('ArrowRight')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-mono"
            >
              Right →
            </button>
            <button 
              onMouseDown={() => simulateKeyDown('Shift')}
              onMouseUp={() => simulateKeyUp('Shift')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs font-mono"
            >
              ↑ Shift
            </button>
            <button 
              onMouseDown={() => simulateKeyDown('Enter')}
              onMouseUp={() => simulateKeyUp('Enter')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-xs font-mono"
            >
              ↓ Enter
            </button>
            <button 
              onClick={() => {
                simulateKeyDown('ArrowUp');
                setTimeout(() => simulateKeyUp('ArrowUp'), 50);
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-mono col-span-2"
            >
              ↑↑ Elbow Toggle
            </button>
          </div>
        </div> */}
      </div>
    </>
  );
}
