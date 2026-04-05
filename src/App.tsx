/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, ContactShadows, MeshReflectorMaterial, RoundedBox, Html } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { GoogleGenAI, Modality } from "@google/genai";

import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const MESSAGES = [
  "بسم الله الرحمن الرحيم. مرحبًا… أنا كيوي.",
  "أنا مش مجرد أداة بحث… أنا طريقة جديدة تمامًا للتعامل مع سوق العقارات.",
  "بدل ما المستخدم يضيع وقت بين مواقع وإعلانات عشوائية، أنا بفهم احتياجه مباشرة. هو بيكتبلي اللي عايزه بشكل طبيعي… وأنا بتحول لدليل ذكي يوصّله لأقرب اختيار مناسب له — بسرعة، ودقة، ومن غير تعقيد.",
  "أنا مش بعرض وحدات… أنا بقدّم حلول.",
  "قوتي الحقيقية مش بس في إني بسهّل على المستخدم، لكن في إني بخلق حلقة ربط ذكية بينه وبين الشركات العقارية. الشركات بترفع وحداتها عندي… وأنا بضمن إنها توصل للعميل الصح في الوقت الصح، بناءً على فهم حقيقي لاحتياجه، مش مجرد فلترة تقليدية.",
  "وده بيغيّر قواعد اللعبة. السوق حاليًا مليان بيانات… لكن مفيش ذكاء حقيقي بيوجهها. أنا بقدّم الذكاء ده.",
  "أنا ببساطة بحوّل تجربة البحث عن عقار من عملية مرهقة… لرحلة سلسة قائمة على الفهم.",
  "ومع كل مستخدم جديد… أنا بتطور. ومع كل شركة بتنضم… أنا بقوّي المنظومة.",
  "أنا مش جاي أنافس… أنا جاي أعيد تعريف السوق.",
  "واللي هيكون جزء مني من البداية… هيكون جزء من السيطرة على مستقبل العقارات"
];

const CHART_DATA = [
  { name: 'Q1', growth: 0, spread: 0 },
  { name: 'Q2', growth: 15, spread: 10 },
  { name: 'Q3', growth: 45, spread: 35 },
  { name: 'Q4', growth: 90, spread: 70 },
  { name: 'Y2', growth: 180, spread: 150 },
  { name: 'Y3', growth: 350, spread: 300 },
];

function MarketChart() {
  return (
    <div className="w-[450px] h-64 bg-cyan-500/5 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.15)] relative overflow-hidden">
      {/* Holographic Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-cyan-400 font-mono text-xs tracking-widest uppercase">Projected Market Growth</h3>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-magenta-500 animate-pulse delay-75" />
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={CHART_DATA}>
            <defs>
              <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00ffff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff00ff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ff00ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" stroke="#00ffff" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#00ffff" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #00ffff', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="growth" stroke="#00ffff" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" name="النمو المتسارع" />
            <Area type="monotone" dataKey="spread" stroke="#ff00ff" strokeWidth={2} fillOpacity={1} fill="url(#colorSpread)" name="سرعة الانتشار" />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="mt-2 flex justify-between items-center text-[10px] font-mono text-cyan-500/60">
          <span>REAL-TIME DATA FEED</span>
          <span className="animate-pulse">● LIVE</span>
        </div>
      </div>
    </div>
  );
}

// Sound utility using Web Audio API
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;
const audioCache = new Map<number, AudioBuffer>();

const fetchAudioBuffer = async (text: string, retries = 2): Promise<AudioBuffer | null> => {
  if (!audioCtx) return null;
  
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                 (typeof process !== 'undefined' && (process.env as any)?.API_KEY) ||
                 (import.meta.env.VITE_GEMINI_API_KEY);
  if (!apiKey) return null;
  
  const aiInstance = new GoogleGenAI({ apiKey });
  const voices = ['Zephyr', 'Kore', 'Puck', 'Charon'];

  const attempt = async (remaining: number): Promise<AudioBuffer | null> => {
    const currentVoice = voices[(2 - remaining) % voices.length];
    try {
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: text.trim(),
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: currentVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = audioCtx.createBuffer(1, bytes.length / 2, 24000);
        const nowBuffering = audioBuffer.getChannelData(0);
        const dataView = new DataView(bytes.buffer);

        for (let i = 0; i < bytes.length / 2; i++) {
          const sample = dataView.getInt16(i * 2, true);
          nowBuffering[i] = sample / 32768;
        }
        return audioBuffer;
      }
    } catch (error) {
      if (remaining > 0) {
        await new Promise(r => setTimeout(r, 500));
        return attempt(remaining - 1);
      }
    }
    return null;
  };

  return attempt(retries);
};

const playAudioBuffer = (buffer: AudioBuffer): Promise<void> => {
  return new Promise((resolve) => {
    if (!audioCtx) return resolve();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => resolve();
    source.start();
  });
};

const playSound = (type: 'click' | 'blink') => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'blink') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
};

function Room({ lightIntensity }: { lightIntensity: number }) {
  return (
    <group>
      {/* Floor - Polished and Reflective */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
          mirror={0}
        />
      </mesh>

      {/* Back Wall with vertical slats/panels */}
      <group position={[0, 3, -10]}>
        <mesh receiveShadow>
          <planeGeometry args={[50, 15]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
        
        {/* Decorative Vertical Panels */}
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[(i - 10) * 2.5, 0, 0.1]} castShadow>
            <boxGeometry args={[0.2, 15, 0.2]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Side Wall (Left) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-15, 3, 0]} receiveShadow>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#080808" roughness={0.9} />
      </mesh>

      {/* Side Wall (Right) */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[15, 3, 0]} receiveShadow>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#080808" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Robot({ introProgress, isPresenting }: { introProgress: number, isPresenting: boolean }) {
  const [hovered, setHovered] = useState(false);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftLightRef = useRef<THREE.PointLight>(null);
  const rightLightRef = useRef<THREE.PointLight>(null);

  const wasBlinking = useRef(false);

  useFrame((state) => {
    const { mouse, clock } = state;
    
    // Head tracking logic
    if (headRef.current) {
      // Subtle idle sway
      const idleX = Math.sin(clock.elapsedTime * 0.8) * 0.03;
      const idleY = Math.cos(clock.elapsedTime * 0.6) * 0.05;

      const targetRotationX = isPresenting ? idleX : (-mouse.y * 0.3 + idleX);
      const targetRotationY = isPresenting ? idleY : (mouse.x * 0.5 + idleY);
      
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotationX, 0.1);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotationY, 0.1);

      // Subtle breathing scale effect on the head
      const breatheScale = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.01;
      headRef.current.scale.set(breatheScale, breatheScale, breatheScale);
    }

    // Blink logic
    const blinkSpeed = 10;
    const blinkInterval = 4; 
    const isBlinking = Math.sin(clock.elapsedTime * blinkSpeed) > 0.98 && (Math.floor(clock.elapsedTime) % blinkInterval === 0);
    
    // Trigger blink sound
    if (isBlinking && !wasBlinking.current) {
      playSound('blink');
    }
    wasBlinking.current = isBlinking;

    // Intro Eye Logic
    const eyeOpenFactor = THREE.MathUtils.smoothstep(introProgress, 0.2, 0.5);
    const blinkYScale = isBlinking ? 0.1 : 1;

    // Eye hover logic
    const targetScale = hovered ? 1.4 : 1;
    const targetIntensity = hovered ? 5 : 2;
    const lerpFactor = 0.1;

    if (leftEyeRef.current && rightEyeRef.current) {
      const s = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, targetScale, lerpFactor);
      const sy = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetScale * blinkYScale * eyeOpenFactor, 0.5);
      
      leftEyeRef.current.scale.set(s, sy, s);
      rightEyeRef.current.scale.set(s, sy, s);
    }

    if (leftLightRef.current && rightLightRef.current) {
      const lightIntensity = (isBlinking ? 0 : targetIntensity) * eyeOpenFactor;
      leftLightRef.current.intensity = THREE.MathUtils.lerp(leftLightRef.current.intensity, lightIntensity, 0.3);
      rightLightRef.current.intensity = THREE.MathUtils.lerp(rightLightRef.current.intensity, lightIntensity, 0.3);
    }
  });

  return (
    <group 
      position={[0, -0.5, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Pedestal / Base */}
      <group position={[0, -1.5, 0]}>
        <RoundedBox args={[2, 3, 2]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial 
            color="#111" 
            metalness={0.9} 
            roughness={0.4} 
            clearcoat={1}
            clearcoatRoughness={0.1}
            emissive="#110022"
            emissiveIntensity={0.5 * introProgress}
          />
        </RoundedBox>
        
        {/* Glowing Accent Ring - Refined */}
        <mesh position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.03, 16, 100]} />
          <meshStandardMaterial 
            color="#ff00ff" 
            emissive="#ff00ff" 
            emissiveIntensity={4 * introProgress} 
            toneMapped={false}
          />
        </mesh>

        {/* Vertical Detail Lines */}
        {[0, Math.PI/2, Math.PI, -Math.PI/2].map((rot, i) => (
          <mesh key={i} position={[Math.sin(rot)*1.01, 0, Math.cos(rot)*1.01]}>
            <boxGeometry args={[0.02, 2.8, 0.02]} />
            <meshStandardMaterial color="#333" metalness={1} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Body / Neck Structure */}
      <group position={[0, 0.2, 0]}>
        {/* Main Neck - Metallic Chrome */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.25, 0.6, 32]} />
          <meshStandardMaterial color="#888" metalness={1} roughness={0.1} />
        </mesh>
        
        {/* Joint Detail - Dark Industrial */}
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
          <meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.3} />
        </mesh>

        {/* Neck Glowing Ring */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.01, 16, 50]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2 * introProgress} />
        </mesh>
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        {/* Main Head Shell - Premium Metallic Black */}
        <RoundedBox args={[1.6, 1.1, 1]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial 
            color="#050505" 
            metalness={1} 
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </RoundedBox>
        
        {/* Screen/Face Area - Deep Glossy Inset */}
        <group position={[0, 0, 0.45]}>
          <RoundedBox args={[1.4, 0.9, 0.1]} radius={0.05} smoothness={4}>
            <meshStandardMaterial color="#000" roughness={0.05} metalness={1} />
          </RoundedBox>
          
          {/* Eyes - Glowing Orbs */}
          <group position={[0, 0, 0.06]}>
            <mesh ref={leftEyeRef} position={[-0.35, 0.1, 0]}>
              <sphereGeometry args={[0.12, 32, 32]} />
              <meshBasicMaterial color="#ffffff" />
              <pointLight ref={leftLightRef} intensity={0} distance={3} color="#fff" />
            </mesh>
            <mesh ref={rightEyeRef} position={[0.35, 0.1, 0]}>
              <sphereGeometry args={[0.12, 32, 32]} />
              <meshBasicMaterial color="#ffffff" />
              <pointLight ref={rightLightRef} intensity={0} distance={3} color="#fff" />
            </mesh>
          </group>

          {/* Subtle Screen Scanline Effect (Emissive Detail) */}
          <mesh position={[0, -0.35, 0.055]}>
            <planeGeometry args={[1.2, 0.01]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5 * introProgress} />
          </mesh>
        </group>

        {/* Side Detail / Sensors - Brushed Metal */}
        <group position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
            <meshStandardMaterial color="#222" metalness={1} roughness={0.4} />
          </mesh>
          {/* Small Glowing Indicator */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1 * introProgress} />
          </mesh>
        </group>

        <group position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
            <meshStandardMaterial color="#222" metalness={1} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1 * introProgress} />
          </mesh>
        </group>

        {/* Top Antenna/Sensor Detail */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.4]} />
          <meshStandardMaterial color="#111" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function Scene({ isPresenting, messageIndex }: { isPresenting: boolean, messageIndex: number }) {
  const [introProgress, setIntroProgress] = useState(0);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Intro sequence: 0-4 seconds
    const progress = THREE.MathUtils.clamp(t / 4, 0, 1);
    setIntroProgress(progress);
  });

  // Room light intensity fades in after eyes start opening (around 0.5 progress)
  const roomLightIntensity = THREE.MathUtils.smoothstep(introProgress, 0.5, 1);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1, 8]} fov={45} />
      
      {/* Cinematic Lighting - Significantly increased brightness */}
      <ambientLight intensity={0.2 + 0.6 * roomLightIntensity} />
      
      {/* Main Key Light (Window-like) - Doubled intensity */}
      <spotLight 
        position={[-10, 15, 10]} 
        angle={0.4} 
        penumbra={1} 
        intensity={15 * roomLightIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Rim Light (Back-Right) - Boosted for better silhouette */}
      <pointLight position={[10, 5, -5]} color="#00ffff" intensity={25 * roomLightIntensity} />
      
      {/* Fill Light (Left) - Boosted for better visibility */}
      <pointLight position={[-12, 5, 5]} color="#ff00ff" intensity={20 * roomLightIntensity} />
      
      {/* Top Highlight - Increased for overall room clarity */}
      <rectAreaLight
        width={20}
        height={20}
        intensity={8 * roomLightIntensity}
        color="#ffffff"
        position={[0, 15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <Robot introProgress={introProgress} isPresenting={isPresenting} />
        
        {/* Holographic Chart Projection */}
        <AnimatePresence>
          {isPresenting && (messageIndex === 2 || messageIndex === 3) && (
            <group position={[0, 1.2, 1.5]}>
              <Html transform distanceFactor={2} position={[0, 0, 0]}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotateX: 45 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotateX: 45 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="pointer-events-none"
                >
                  <MarketChart />
                </motion.div>
              </Html>
              
              {/* Hologram Base Glow */}
              <mesh position={[0, -0.8, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.1} />
              </mesh>
            </group>
          )}
        </AnimatePresence>
      </Float>

      <Room lightIntensity={roomLightIntensity} />

      <ContactShadows 
        position={[0, -2, 0]} 
        opacity={0.6 * roomLightIntensity} 
        scale={20} 
        blur={2} 
        far={4.5} 
      />

      <OrbitControls 
        enablePan={false} 
        enableRotate={false}
        minDistance={5} 
        maxDistance={15}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
      />
      
      <Environment preset="night" />
    </>
  );
}

export default function App() {
  const [isPresenting, setIsPresenting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(-1);

  const startPresentation = () => {
    playSound('click');
    setIsPresenting(true);
    setMessageIndex(0);
  };

  const nextMessage = () => {
    if (messageIndex < MESSAGES.length - 1) {
      playSound('click');
      setMessageIndex(prev => prev + 1);
    } else {
      endPresentation();
    }
  };

  const prevMessage = () => {
    if (messageIndex > 0) {
      playSound('click');
      setMessageIndex(prev => prev - 1);
    }
  };

  const endPresentation = () => {
    playSound('click');
    setIsPresenting(false);
    setMessageIndex(-1);
  };

  return (
    <main className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas shadows dpr={[1, 2]}>
        <Scene isPresenting={isPresenting} messageIndex={messageIndex} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-12">
        {/* Top Section */}
        <div className="w-full flex justify-end">
          {!isPresenting ? (
            <button
              onClick={startPresentation}
              className="pointer-events-auto px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300 backdrop-blur-md shadow-lg"
            >
              ابدأ العرض التقديمي
            </button>
          ) : (
            <button
              onClick={endPresentation}
              className="pointer-events-auto p-3 bg-white/10 hover:bg-red-500/40 border border-white/20 rounded-full text-white transition-all duration-300 backdrop-blur-md"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Bottom Section - Messages and Controls */}
        <div className="w-full max-w-4xl flex flex-col items-center gap-8 mb-12">
          <AnimatePresence mode="wait">
            {isPresenting && messageIndex >= 0 && (
              <div className="w-full flex items-center justify-between gap-4">
                {/* Prev Button */}
                <button
                  onClick={prevMessage}
                  disabled={messageIndex === 0}
                  className={`pointer-events-auto p-4 rounded-full border border-white/20 backdrop-blur-md transition-all duration-300 ${
                    messageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <ChevronRight size={32} />
                </button>

                {/* Message Content */}
                <motion.div
                  key={messageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center"
                >
                  <p className="text-white text-2xl md:text-3xl font-bold leading-relaxed dir-rtl" dir="rtl">
                    {MESSAGES[messageIndex]}
                  </p>
                  <div className="mt-4 text-white/40 font-mono text-sm">
                    {messageIndex + 1} / {MESSAGES.length}
                  </div>
                </motion.div>

                {/* Next Button */}
                <button
                  onClick={nextMessage}
                  className="pointer-events-auto p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transition-all duration-300"
                >
                  <ChevronLeft size={32} />
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
