import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// WebGL 실패 시 graceful fallback — 프로덕션 빌드에서 silent crash 방지
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// 마우스 좌표 정규화(-1 ~ 1)
function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handle = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);
  return mouse;
}

// ── 귀여운 눈 (마우스 추적 + 깜빡임) ──
function CuteEye({ position, mouse }) {
  const pupilRef = useRef();
  const eyeGroupRef = useRef();
  const blinkTimer = useRef(Math.random() * 3);
  const isBlinking = useRef(false);
  const blinkProgress = useRef(0);

  useFrame((_, delta) => {
    if (!pupilRef.current || !eyeGroupRef.current) return;

    // 눈동자가 마우스를 부드럽게 따라감
    const targetX = mouse.current.x * 0.055;
    const targetY = mouse.current.y * 0.04;
    pupilRef.current.position.x = THREE.MathUtils.lerp(pupilRef.current.position.x, targetX, delta * 6);
    pupilRef.current.position.y = THREE.MathUtils.lerp(pupilRef.current.position.y, targetY, delta * 6);

    // 깜빡임 — scaleY로 구현
    blinkTimer.current += delta;
    if (!isBlinking.current && blinkTimer.current > 3.5 + Math.random() * 2) {
      isBlinking.current = true;
      blinkProgress.current = 0;
      blinkTimer.current = 0;
    }
    if (isBlinking.current) {
      blinkProgress.current += delta * 10;
      const t = blinkProgress.current;
      const scaleY = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2;
      eyeGroupRef.current.scale.y = Math.max(0.05, scaleY);
      if (t >= 1) {
        isBlinking.current = false;
        eyeGroupRef.current.scale.y = 1;
      }
    }
  });

  return (
    <group position={position} ref={eyeGroupRef}>
      {/* 눈 외곽 글로우 (은은한 빛번짐) */}
      <mesh position={[0, 0, -0.01]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={0.3}
          transparent
          opacity={0.2}
        />
      </mesh>
      {/* 눈 본체 (큰 밝은 시안 원) */}
      <mesh>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial
          color="#a5f3fc"
          emissive="#67e8f9"
          emissiveIntensity={0.7}
          roughness={0.15}
        />
      </mesh>
      {/* 눈동자 (큰 어두운 원 — 마우스 추적) */}
      <mesh ref={pupilRef} position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.085, 32, 32]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.3} />
      </mesh>
      {/* 큰 하이라이트 */}
      <mesh position={[0.05, 0.05, 0.14]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>
      {/* 작은 하이라이트 */}
      <mesh position={[-0.03, -0.02, 0.14]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ── 헬멧 (둥근 흰색 머리) ──
function Helmet() {
  return (
    <group>
      {/* 메인 헬멧 — 둥근 구체 */}
      <mesh>
        <sphereGeometry args={[0.72, 64, 64]} />
        <meshStandardMaterial
          color="#e8e0f0"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      {/* 헬멧 하이라이트 (살짝 위에 광택) */}
      <mesh position={[-0.15, 0.25, 0.45]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={0}
        />
      </mesh>
    </group>
  );
}

// ── 바이저 (어두운 얼굴 화면) ──
function Visor({ mouse }) {
  const glowRef = useRef();

  // 은은한 빛 맥동
  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const pulse = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    glowRef.current.emissiveIntensity = pulse;
  });

  return (
    <group position={[0, 0.02, 0.48]}>
      {/* 바이저 배경 — 둥근 사각형 */}
      <RoundedBox args={[0.72, 0.52, 0.2]} radius={0.15} position={[0, 0, 0]}>
        <meshStandardMaterial
          ref={glowRef}
          color="#0f172a"
          roughness={0.1}
          metalness={0.3}
          emissive="#1e293b"
          emissiveIntensity={0.3}
        />
      </RoundedBox>

      {/* 바이저 테두리 광택 */}
      <RoundedBox args={[0.76, 0.56, 0.18]} radius={0.16} position={[0, 0, -0.01]}>
        <meshStandardMaterial
          color="#c4b5fd"
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.4}
        />
      </RoundedBox>

      {/* 귀여운 큰 눈 */}
      <group position={[0, 0.02, 0.12]}>
        <CuteEye position={[-0.18, 0, 0]} mouse={mouse} />
        <CuteEye position={[0.18, 0, 0]} mouse={mouse} />
      </group>
    </group>
  );
}

// ── 안테나 ──
function Antenna() {
  const tipRef = useRef();

  useFrame(({ clock }) => {
    if (!tipRef.current) return;
    // 빛 맥동
    const t = clock.getElapsedTime();
    tipRef.current.emissiveIntensity = 1 + Math.sin(t * 3) * 0.5;
  });

  return (
    <group position={[0, 0.72, 0]}>
      {/* 안테나 봉 */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.025, 0.24, 8]} />
        <meshStandardMaterial color="#c4b5fd" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* 안테나 끝 — 빛나는 구 */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          ref={tipRef}
          color="#4ade80"
          emissive="#4ade80"
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>
      {/* 안테나 글로우 */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color="#4ade80"
          transparent
          opacity={0.15}
          roughness={0}
        />
      </mesh>
    </group>
  );
}

// ── 귀 장식 (헬멧 양쪽 원형 패드) ──
function EarPad({ side }) {
  const x = side === 'left' ? -0.65 : 0.65;
  return (
    <mesh position={[x, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
      <meshStandardMaterial color="#d4d0e0" roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

// ── 몸통 ──
function Body() {
  return (
    <group position={[0, -0.85, 0]}>
      {/* 메인 몸통 */}
      <RoundedBox args={[0.6, 0.45, 0.4]} radius={0.15}>
        <meshStandardMaterial color="#e0d8ec" roughness={0.3} metalness={0.05} />
      </RoundedBox>
      {/* 가슴 장식 라인 */}
      <mesh position={[0, 0.05, 0.21]}>
        <boxGeometry args={[0.25, 0.03, 0.01]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── 팔 ──
function Arm({ side, mouse }) {
  const ref = useRef();
  const isRight = side === 'right';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();

    if (isRight) {
      // 주기적 손 흔들기
      const cycle = Math.sin(t * 0.5);
      if (cycle > 0.7) {
        ref.current.rotation.z = -1.0 + Math.sin(t * 4) * 0.25;
      } else {
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0.15, 0.04);
      }
    } else {
      ref.current.rotation.z = -0.15 + Math.sin(t * 1.2) * 0.04;
    }
  });

  const x = isRight ? 0.42 : -0.42;

  return (
    <group position={[x, -0.75, 0]} ref={ref}>
      {/* 어깨 조인트 */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#d4d0e0" roughness={0.3} />
      </mesh>
      {/* 팔 */}
      <RoundedBox args={[0.1, 0.32, 0.1]} radius={0.04} position={[isRight ? 0.05 : -0.05, -0.18, 0]}>
        <meshStandardMaterial color="#e0d8ec" roughness={0.3} />
      </RoundedBox>
      {/* 손 */}
      <mesh position={[isRight ? 0.05 : -0.05, -0.38, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#d4d0e0" roughness={0.25} />
      </mesh>
    </group>
  );
}

// ── 메인 캐릭터 조립 ──
function TerminalBot({ mouse }) {
  const groupRef = useRef();

  // 마우스 방향으로 부드럽게 회전
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouse.current.x * 0.3,
      delta * 3
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -mouse.current.y * 0.12,
      delta * 3
    );
  });

  return (
    <Float speed={1.5} rotationIntensity={0.06} floatIntensity={0.35}>
      <group ref={groupRef} position={[0, 0.3, 0]}>
        {/* 헬멧 */}
        <Helmet />
        {/* 바이저 */}
        <Visor mouse={mouse} />
        {/* 안테나 */}
        <Antenna />
        {/* 귀 패드 */}
        <EarPad side="left" />
        <EarPad side="right" />
        {/* 몸통 */}
        <Body />
        {/* 팔 */}
        <Arm side="left" mouse={mouse} />
        <Arm side="right" mouse={mouse} />
      </group>
    </Float>
  );
}

// ── 배경 파티클 ──
function FloatingParticles() {
  const count = 25;
  const meshes = useRef([]);

  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2 - 1.5],
      speed: 0.15 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
      scale: 0.015 + Math.random() * 0.025,
    })),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      const d = data[i];
      mesh.position.y = d.pos[1] + Math.sin(t * d.speed + d.offset) * 0.4;
      mesh.rotation.y = t * d.speed * 0.3;
      mesh.rotation.z = t * d.speed * 0.2;
    });
  });

  return (
    <>
      {data.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => (meshes.current[i] = el)}
          position={d.pos}
          scale={d.scale}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#4ade80' : '#818cf8'}
            emissive={i % 3 === 0 ? '#4ade80' : '#818cf8'}
            emissiveIntensity={0.4}
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}
    </>
  );
}

// ── 3D 씬 ──
function Scene() {
  const mouse = useMousePosition();
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 3, 4]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 1, 3]} intensity={0.4} color="#4ade80" />
      <pointLight position={[2, -1, 2]} intensity={0.2} color="#818cf8" />
      <TerminalBot mouse={mouse} />
      <FloatingParticles />
    </>
  );
}

// ── 스크롤 투명도 래퍼 (BrowserOnly 안에서만 렌더링됨) ──
export default function InteractiveCharacter() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handle = () => {
      setOpacity(Math.max(0, 1 - window.scrollY / 500));
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      opacity,
      transition: 'opacity 0.1s ease-out',
      pointerEvents: opacity < 0.1 ? 'none' : 'auto',
    }}>
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
        >
          <Scene />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
