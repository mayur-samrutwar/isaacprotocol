import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

export default function RoboticHand() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const handRef = useRef(null);
  const animationRef = useRef(null);
  
  // Hand control refs
  const baseRef = useRef(null);
  const elbowRef = useRef(null);
  const wristRef = useRef(null);
  const fingersRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a); // Dark grey background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup - improved for better polish
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Add rim light for better definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(-5, 2, -5);
    scene.add(rimLight);

    // Materials - improved for better polish
    const blackMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      shininess: 150,
      specular: 0x333333,
      reflectivity: 0.1
    });

    const orangeMaterial = new THREE.MeshPhongMaterial({
      color: 0xff5500,
      shininess: 120,
      specular: 0xff3300,
      emissive: 0x220000
    });

    // Create robotic hand
    const hand = new THREE.Group();
    handRef.current = hand;
    
    // Store references to joint groups for control
    const baseGroup = new THREE.Group();
    const elbowGroup = new THREE.Group();
    const wristGroup = new THREE.Group();
    const fingerGroups = [];

    // Base (circular with orange accent)
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
    const base = new THREE.Mesh(baseGeometry, blackMaterial);
    base.position.y = -2;
    base.castShadow = true;
    baseGroup.add(base);

    // Base orange accent ring
    const baseAccentGeometry = new THREE.TorusGeometry(1.1, 0.05, 8, 16);
    const baseAccent = new THREE.Mesh(baseAccentGeometry, orangeMaterial);
    baseAccent.position.y = -1.85;
    baseGroup.add(baseAccent);
    
    hand.add(baseGroup);

    // Lower arm segment
    const lowerArmGeometry = new THREE.BoxGeometry(0.8, 2, 0.6);
    const lowerArm = new THREE.Mesh(lowerArmGeometry, blackMaterial);
    lowerArm.position.set(0, -0.5, 0);
    lowerArm.castShadow = true;
    baseGroup.add(lowerArm);

    // Elbow joint
    const elbowGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12);
    const elbow = new THREE.Mesh(elbowGeometry, blackMaterial);
    elbow.position.set(0, 0.5, 0);
    elbow.rotation.z = Math.PI / 2;
    elbow.castShadow = true;
    elbowGroup.add(elbow);

    // Elbow orange accent rings
    const elbowAccentGeometry = new THREE.TorusGeometry(0.35, 0.03, 8, 16);
    const elbowAccent1 = new THREE.Mesh(elbowAccentGeometry, orangeMaterial);
    elbowAccent1.position.set(-0.35, 0.5, 0);
    elbowAccent1.rotation.z = Math.PI / 2;
    elbowGroup.add(elbowAccent1);

    const elbowAccent2 = new THREE.Mesh(elbowAccentGeometry, orangeMaterial);
    elbowAccent2.position.set(0.35, 0.5, 0);
    elbowAccent2.rotation.z = Math.PI / 2;
    elbowGroup.add(elbowAccent2);
    
    baseGroup.add(elbowGroup);

    // Upper arm segment
    const upperArmGeometry = new THREE.BoxGeometry(0.6, 2.5, 0.5);
    const upperArm = new THREE.Mesh(upperArmGeometry, blackMaterial);
    upperArm.position.set(0, 1.75, 0);
    upperArm.castShadow = true;
    hand.add(upperArm);

    // Upper arm orange stripe
    const upperArmStripeGeometry = new THREE.BoxGeometry(0.65, 0.1, 0.55);
    const upperArmStripe = new THREE.Mesh(upperArmStripeGeometry, orangeMaterial);
    upperArmStripe.position.set(0, 1.75, 0);
    hand.add(upperArmStripe);

    // Wrist joint
    const wristGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
    const wrist = new THREE.Mesh(wristGeometry, blackMaterial);
    wrist.position.set(0, 3, 0);
    wrist.rotation.z = Math.PI / 2;
    wrist.castShadow = true;
    hand.add(wrist);

    // Wrist orange accent
    const wristAccentGeometry = new THREE.TorusGeometry(0.25, 0.02, 8, 16);
    const wristAccent = new THREE.Mesh(wristAccentGeometry, orangeMaterial);
    wristAccent.position.set(0, 3, 0);
    wristAccent.rotation.z = Math.PI / 2;
    hand.add(wristAccent);

    // Forearm segment
    const forearmGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const forearm = new THREE.Mesh(forearmGeometry, blackMaterial);
    forearm.position.set(0, 3.75, 0);
    forearm.castShadow = true;
    hand.add(forearm);

    // Forearm orange accent
    const forearmAccentGeometry = new THREE.BoxGeometry(0.45, 0.08, 0.45);
    const forearmAccent = new THREE.Mesh(forearmAccentGeometry, orangeMaterial);
    forearmAccent.position.set(0, 3.75, 0);
    hand.add(forearmAccent);

    // Gripper hub
    const gripperHubGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
    const gripperHub = new THREE.Mesh(gripperHubGeometry, blackMaterial);
    gripperHub.position.set(0, 4.5, 0);
    gripperHub.castShadow = true;
    hand.add(gripperHub);

    // Gripper hub orange accent
    const gripperHubAccentGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
    const gripperHubAccent = new THREE.Mesh(gripperHubAccentGeometry, orangeMaterial);
    gripperHubAccent.position.set(0, 4.5, 0);
    hand.add(gripperHubAccent);

    // Create fingers (3 conical elements)
    const fingerPositions = [
      { x: 0.3, y: 4.5, z: 0 },
      { x: -0.15, y: 4.5, z: 0.25 },
      { x: -0.15, y: 4.5, z: -0.25 }
    ];

    fingerPositions.forEach((pos, index) => {
      // Finger rod
      const fingerRodGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
      const fingerRod = new THREE.Mesh(fingerRodGeometry, blackMaterial);
      fingerRod.position.set(pos.x, pos.y + 0.15, pos.z);
      fingerRod.castShadow = true;
      hand.add(fingerRod);

      // Finger tip (conical)
      const fingerTipGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
      const fingerTip = new THREE.Mesh(fingerTipGeometry, blackMaterial);
      fingerTip.position.set(pos.x, pos.y + 0.35, pos.z);
      fingerTip.rotation.x = Math.PI;
      fingerTip.castShadow = true;
      hand.add(fingerTip);

      // Finger orange accent ring
      const fingerAccentGeometry = new THREE.TorusGeometry(0.05, 0.01, 6, 12);
      const fingerAccent = new THREE.Mesh(fingerAccentGeometry, orangeMaterial);
      fingerAccent.position.set(pos.x, pos.y + 0.15, pos.z);
      hand.add(fingerAccent);
    });

    // Add orange cubes for reference
    const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const cube1 = new THREE.Mesh(cubeGeometry, orangeMaterial);
    cube1.position.set(-3, -1.5, -2);
    cube1.castShadow = true;
    scene.add(cube1);

    const cube2 = new THREE.Mesh(cubeGeometry, orangeMaterial);
    cube2.position.set(-2.5, -1.5, -2);
    cube2.castShadow = true;
    scene.add(cube2);

    scene.add(hand);

    // Add OrbitControls for camera control
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.target.set(0, 2, 0);

    // Keyboard controls for hand joints
    const handleKeyPress = (event) => {
      const step = 0.1; // Rotation step
      
      switch(event.key.toLowerCase()) {
        // Base rotation
        case 'q':
          baseGroup.rotation.y += step;
          break;
        case 'e':
          baseGroup.rotation.y -= step;
          break;
          
        // Elbow joint
        case 'w':
          elbowGroup.rotation.x += step;
          break;
        case 's':
          elbowGroup.rotation.x -= step;
          break;
          
        // Wrist joint
        case 'a':
          wristGroup.rotation.z += step;
          break;
        case 'd':
          wristGroup.rotation.z -= step;
          break;
          
        // Finger controls
        case '1':
          if (fingerGroups[0]) fingerGroups[0].rotation.z += step;
          break;
        case '2':
          if (fingerGroups[1]) fingerGroups[1].rotation.z += step;
          break;
        case '3':
          if (fingerGroups[2]) fingerGroups[2].rotation.z += step;
          break;
          
        // Reset
        case 'r':
          baseGroup.rotation.set(0, 0, 0);
          elbowGroup.rotation.set(0, 0, 0);
          wristGroup.rotation.set(0, 0, 0);
          fingerGroups.forEach(finger => finger.rotation.set(0, 0, 0));
          break;
      }
    };

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Add keyboard listener
    window.addEventListener('keydown', handleKeyPress);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      // Clear refs to prevent double rendering
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      handRef.current = null;
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
}
