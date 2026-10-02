// Cảnh 3D dựng thủ tục: bàn điều phối Bluebolt trong phòng tối ấm.
// Đơn vị: mét. Camera chạy theo tiến độ cuộn (progress 0→1) đọc từ scrollStore.
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, RoundedBox, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { scrollStore, CAMERA_END } from './scrollStore.js';

RectAreaLightUniformsLib.init();

// ---------------- Kích thước chính ----------------
const DESK_Y = 0.74; // mặt bàn
const SCREEN = { w: 0.62, h: 0.34875, x: 0, y: 1.08, z: -0.46 }; // màn hình lớn 16:9
const WALL_Z = -0.78;
const FOV_START = 46;
const FOV_END = 38;

// ---------------- Tiện ích ----------------
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

function useCanvasTexture(draw, w, h, deps = []) {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Vân gỗ óc chó dựng bằng canvas (thay cho texture ảnh — 3D artist sẽ thay bằng PBR thật)
function useWood() {
  return useCanvasTexture((g, w, h) => {
    g.fillStyle = '#4a3324'; g.fillRect(0, 0, w, h);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const y = rnd() * h; const amp = 2 + rnd() * 6; const light = rnd() > 0.5;
      g.strokeStyle = light ? `rgba(120,84,58,${0.08 + rnd() * 0.18})` : `rgba(30,18,10,${0.1 + rnd() * 0.25})`;
      g.lineWidth = 0.6 + rnd() * 2.4; g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.004 + i) * amp + Math.sin(x * 0.02 + i * 3) * 1.2);
      g.stroke();
    }
  }, 1024, 512);
}

// Tường vữa tối có nhiễu nhẹ
function usePlaster() {
  return useCanvasTexture((g, w, h) => {
    g.fillStyle = '#2a2622'; g.fillRect(0, 0, w, h);
    const img = g.getImageData(0, 0, w, h); let seed = 3;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647; const n = (seed / 2147483647 - 0.5) * 14;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  }, 256, 256);
}

// ---------------- Đồ vật ----------------
function Desk() {
  const wood = useWood();
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  return (
    <group>
      <RoundedBox args={[1.7, 0.04, 0.82]} radius={0.012} smoothness={3} position={[0, DESK_Y - 0.02, -0.3]} receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.52} metalness={0} color="#c9b3a2" />
      </RoundedBox>
      {[[-0.8, -0.66], [0.8, -0.66], [-0.8, 0.06], [0.8, 0.06]].map(([x, z], i) => (
        <mesh key={i} position={[x, (DESK_Y - 0.04) / 2, z]}>
          <boxGeometry args={[0.035, DESK_Y - 0.04, 0.035]} />
          <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Monitor({ tex }) {
  const light = useRef();
  useLayoutEffect(() => { light.current.lookAt(SCREEN.x, SCREEN.y, 5); }, []);
  return (
    <group>
      {/* thân + viền */}
      <RoundedBox args={[SCREEN.w + 0.018, SCREEN.h + 0.018, 0.022]} radius={0.006} smoothness={2} position={[SCREEN.x, SCREEN.y, SCREEN.z - 0.012]}>
        <meshStandardMaterial color="#0d0d0f" roughness={0.35} metalness={0.6} />
      </RoundedBox>
      {/* màn hình phát sáng: texture = ảnh chụp hero HTML thật */}
      <mesh position={[SCREEN.x, SCREEN.y, SCREEN.z]}>
        <planeGeometry args={[SCREEN.w, SCREEN.h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* chân đế */}
      <mesh position={[SCREEN.x, (SCREEN.y + DESK_Y) / 2 - 0.05, SCREEN.z - 0.07]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.05, SCREEN.y - DESK_Y - 0.05, 0.016]} />
        <meshStandardMaterial color="#9a9ca3" roughness={0.3} metalness={0.9} />
      </mesh>
      <RoundedBox args={[0.24, 0.008, 0.17]} radius={0.004} position={[SCREEN.x, DESK_Y + 0.004, SCREEN.z - 0.06]}>
        <meshStandardMaterial color="#9a9ca3" roughness={0.3} metalness={0.9} />
      </RoundedBox>
      {/* ánh màn hình hắt lên bàn, laptop, tay... */}
      <rectAreaLight ref={light} args={['#b9ccff', 5.5, SCREEN.w, SCREEN.h]} position={[SCREEN.x, SCREEN.y, SCREEN.z + 0.004]} />
      {/* dải LED cam phía sau màn hình — hắt lên tường (màu thương hiệu) */}
      <BiasLight />
    </group>
  );
}

function BiasLight() {
  const r = useRef();
  useLayoutEffect(() => { r.current.lookAt(SCREEN.x, SCREEN.y + 0.05, WALL_Z - 1); }, []);
  return <rectAreaLight ref={r} args={['#EF8426', 14, SCREEN.w * 0.9, SCREEN.h * 0.8]} position={[SCREEN.x, SCREEN.y, SCREEN.z - 0.03]} />;
}

function Laptop({ tex }) {
  const keys = useRef();
  const light = useRef();
  const lidAngle = -1.86; // ~107° so với thân
  const base = { w: 0.312, d: 0.218, t: 0.013 };
  const pos = [0.0, DESK_Y, -0.02];
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(); let i = 0;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) {
      m.makeTranslation(-0.126 + c * 0.021, base.t + 0.0012, -0.07 + r * 0.019);
      keys.current.setMatrixAt(i++, m);
    }
    keys.current.instanceMatrix.needsUpdate = true;
  }, []);
  useLayoutEffect(() => { light.current.lookAt(0, DESK_Y + 0.4, 1.5); }, []);
  return (
    <group position={pos}>
      <RoundedBox args={[base.w, base.t, base.d]} radius={0.005} smoothness={2} position={[0, base.t / 2, 0]}>
        <meshStandardMaterial color="#b9bcc3" roughness={0.32} metalness={0.85} />
      </RoundedBox>
      <instancedMesh ref={keys} args={[null, null, 65]}>
        <boxGeometry args={[0.017, 0.0015, 0.015]} />
        <meshStandardMaterial color="#121214" roughness={0.6} />
      </instancedMesh>
      <mesh position={[0, base.t + 0.0006, 0.072]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 0.07]} />
        <meshStandardMaterial color="#a4a7ae" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* nắp + màn hình bản đồ đơn hàng */}
      <group position={[0, base.t, -base.d / 2]} rotation={[lidAngle + Math.PI / 2, 0, 0]}>
        <RoundedBox args={[base.w, 0.207, 0.006]} radius={0.004} smoothness={2} position={[0, 0.1035, -0.003]}>
          <meshStandardMaterial color="#b9bcc3" roughness={0.32} metalness={0.85} />
        </RoundedBox>
        <mesh position={[0, 0.1035, 0.0002]}>
          <planeGeometry args={[0.3, 0.197]} />
          <meshStandardMaterial color="#050506" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.105, 0.0006]}>
          <planeGeometry args={[0.288, 0.18]} />
          <meshBasicMaterial map={tex} toneMapped={false} color="#d8d8d8" />
        </mesh>
        <rectAreaLight ref={light} args={['#9fb7ff', 2.2, 0.28, 0.17]} position={[0, 0.105, 0.003]} />
      </group>
    </group>
  );
}

function Phone({ tex }) {
  return (
    <group position={[0.34, DESK_Y, 0.0]} rotation={[0, -0.32, 0]}>
      <RoundedBox args={[0.074, 0.008, 0.156]} radius={0.004} smoothness={2} position={[0, 0.004, 0]}>
        <meshStandardMaterial color="#1b1c20" roughness={0.3} metalness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.0085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.068, 0.148]} />
        <meshBasicMaterial map={tex} toneMapped={false} color="#cfcfcf" />
      </mesh>
    </group>
  );
}

// thanh trụ nối 2 điểm (cánh tay đèn)
function Rod({ a, b, r = 0.007, children }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    return { pos: A.clone().add(B).multiplyScalar(0.5), len: d.length(), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()) };
  }, [a, b]);
  return <mesh position={pos} quaternion={quat}><cylinderGeometry args={[r, r, len, 12]} />{children}</mesh>;
}

const LAMP = { base: [-0.6, DESK_Y, -0.5], elbow: [-0.58, DESK_Y + 0.46, -0.52], head: [-0.4, DESK_Y + 0.5, -0.32] };
function Lamp() {
  const spot = useRef();
  const tgt = useMemo(() => { const o = new THREE.Object3D(); o.position.set(-0.28, DESK_Y, -0.1); return o; }, []);
  const headRef = useRef();
  useLayoutEffect(() => { spot.current.target = tgt; headRef.current.lookAt(-0.28, DESK_Y, -0.1); }, [tgt]);
  const brass = <meshStandardMaterial color="#b08850" roughness={0.35} metalness={0.9} />;
  return (
    <group>
      <primitive object={tgt} />
      <mesh position={[LAMP.base[0], DESK_Y + 0.008, LAMP.base[2]]}><cylinderGeometry args={[0.07, 0.075, 0.016, 32]} />{brass}</mesh>
      <Rod a={LAMP.base} b={LAMP.elbow}>{brass}</Rod>
      <Rod a={LAMP.elbow} b={LAMP.head} r={0.006}>{brass}</Rod>
      <mesh position={LAMP.elbow}><sphereGeometry args={[0.011, 12, 8]} />{brass}</mesh>
      <group position={LAMP.head} ref={headRef}>
        {/* chao đèn hướng trục +z (lookAt) */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[0, -0.02, 0]}><coneGeometry args={[0.065, 0.1, 32, 1, true]} /><meshStandardMaterial color="#1c1a18" roughness={0.5} metalness={0.5} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, -0.045, 0]}><sphereGeometry args={[0.022, 16, 12]} /><meshBasicMaterial color="#ffe2b8" toneMapped={false} /></mesh>
        </group>
      </group>
      <spotLight ref={spot} position={[LAMP.head[0], LAMP.head[1] - 0.02, LAMP.head[2]]} color="#ffb46a" intensity={6} angle={0.8} penumbra={0.85} distance={2.4} decay={1.6} />
    </group>
  );
}

// Máy lạnh treo tường — gợi đúng ngành (lắp đặt điều hòa)
function AirConditioner() {
  return (
    <group position={[-1.05, 1.95, WALL_Z + 0.11]}>
      <RoundedBox args={[0.86, 0.27, 0.2]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color="#f2f0ec" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, -0.1, 0.098]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.76, 0.045, 0.006]} />
        <meshStandardMaterial color="#d3d1cc" roughness={0.5} />
      </mesh>
      <mesh position={[0.33, 0.05, 0.101]}><circleGeometry args={[0.006, 12]} /><meshBasicMaterial color="#4cc3ff" toneMapped={false} /></mesh>
      <mesh position={[0.3, 0.05, 0.101]}><planeGeometry args={[0.025, 0.012]} /><meshBasicMaterial color="#9fe2ff" toneMapped={false} /></mesh>
    </group>
  );
}

// Cửa sổ đêm có rèm lá — ánh thành phố lạnh, tạo chiều sâu
function NightWindow() {
  const tex = useCanvasTexture((g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#0b1730'); grd.addColorStop(1, '#1b2b4a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 140; i++) { g.fillStyle = r() > 0.7 ? 'rgba(255,190,120,.85)' : 'rgba(150,190,255,.55)'; g.fillRect(r() * w, h * 0.45 + r() * h * 0.55, 2 + r() * 3, 2 + r() * 3); }
    for (let y = 0; y < h; y += 14) { g.fillStyle = 'rgba(8,10,14,.82)'; g.fillRect(0, y, w, 9); }
  }, 256, 320);
  return (
    <group position={[1.15, 1.45, WALL_Z + 0.005]}>
      <mesh><planeGeometry args={[0.8, 1.0]} /><meshBasicMaterial map={tex} toneMapped={false} color="#8a93a6" /></mesh>
    </group>
  );
}

// Tranh treo tường: bản đồ mạng lưới (dùng chính vn-map.svg)
function MapPrint() {
  const tex = useTexture('/vn-map.svg');
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={[-0.78, 1.42, WALL_Z + 0.012]}>
      <mesh><boxGeometry args={[0.42, 0.6, 0.02]} /><meshStandardMaterial color="#111" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.0105]}><planeGeometry args={[0.38, 0.56]} /><meshBasicMaterial color="#0c1a36" /></mesh>
      <mesh position={[0, 0.0, 0.011]}><planeGeometry args={[0.3, 0.5]} /><meshBasicMaterial map={tex} transparent color="#8796b8" /></mesh>
    </group>
  );
}

function Mug() {
  return (
    <group position={[-0.3, DESK_Y, 0.02]}>
      <mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.038, 0.034, 0.09, 32]} /><meshStandardMaterial color="#0A1F44" roughness={0.35} /></mesh>
      <mesh position={[0.042, 0.048, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.02, 0.006, 8, 20]} /><meshStandardMaterial color="#0A1F44" roughness={0.35} /></mesh>
    </group>
  );
}

function Khang() {
  const { scene } = useGLTF('/models/khang.glb');
  const obj = useMemo(() => {
    const s = scene.clone(true);
    const box = new THREE.Box3().setFromObject(s); const size = box.getSize(new THREE.Vector3());
    const k = 0.24 / size.y; s.scale.setScalar(k);
    const b2 = new THREE.Box3().setFromObject(s); const c = b2.getCenter(new THREE.Vector3());
    s.position.set(-c.x, -b2.min.y, -c.z);
    return s;
  }, [scene]);
  return <group position={[0.5, DESK_Y, -0.42]} rotation={[0, -0.55, 0]}><primitive object={obj} /></group>;
}

function Room() {
  const plaster = usePlaster();
  plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping; plaster.repeat.set(6, 3);
  return (
    <group>
      <mesh position={[0, 1.5, WALL_Z]}><planeGeometry args={[6, 3]} /><meshStandardMaterial map={plaster} roughness={0.95} color="#8c847c" /></mesh>
      <mesh position={[-1.9, 1.5, 0.5]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3, 3]} /><meshStandardMaterial map={plaster} roughness={0.95} color="#5c5651" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color="#17130f" roughness={0.8} /></mesh>
    </group>
  );
}

// ---------------- Camera rig ----------------
// Khung 1: rộng, chéo góc ~38°, hơi nghiêng như máy cầm tay → dolly-in + xoay về chính diện → màn hình lấp khung.
function CameraRig({ capture, reducedMotion }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const curves = useMemo(() => {
    // khoảng cách để màn hình PHỦ kín khung (cover) ở FOV cuối
    const tv = Math.tan(THREE.MathUtils.degToRad(FOV_END / 2));
    const dH = SCREEN.h / 2 / tv; const dW = SCREEN.w / 2 / (tv * aspect);
    const portrait = aspect < 1;
    // ngang: màn hình PHỦ khung (khớp hero HTML 16:9). Dọc: vừa khít chiều ngang, thấy trọn trang (video mobile)
    const dFill = portrait ? Math.max(dH, dW) * 1.04 : Math.min(dH, dW);
    const k = portrait ? 1.6 : 1; // màn dọc: lùi xa hơn ở khung đầu để thấy đủ bàn
    const end = [SCREEN.x, SCREEN.y + (portrait ? 0.06 : 0), SCREEN.z + dFill];
    const P1 = [0.62 * k, 1.31, 0.72 * k];
    const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const pos = [
      [0.95 * k, 1.44, 0.98 * k],
      P1,
      // màn dọc: điểm giữa nội suy về khung cuối để máy quay chỉ tiến, không lùi lại
      portrait ? lerp3(P1, end, 0.55) : [0.24, 1.18, 0.42],
      portrait ? lerp3(P1, end, 0.85) : [0.04, 1.1, 0.1 + dFill * 0.4],
      end,
    ].map((v) => new THREE.Vector3(...v));
    const tgt = [
      [-0.08, 0.98, -0.36],
      [-0.03, 1.0, -0.42],
      [0, 1.05, -0.46],
      [0, 1.075, -0.46],
      [SCREEN.x, SCREEN.y, SCREEN.z],
    ].map((v) => new THREE.Vector3(...v));
    return { pos: new THREE.CatmullRomCurve3(pos, false, 'centripetal'), tgt: new THREE.CatmullRomCurve3(tgt, false, 'centripetal') };
  }, [aspect]);

  const cur = useRef({ p: scrollStore.progress });
  const v = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3() }), []);
  useFrame((state, dt) => {
    const target = scrollStore.progress;
    // bám mềm (critically damped) — khi chụp bằng chứng thì bám tức thì để khung hình xác định
    cur.current.p = capture ? target : THREE.MathUtils.damp(cur.current.p, target, 6, dt);
    const p = cur.current.p;
    const t = easeInOut(THREE.MathUtils.clamp(p / CAMERA_END, 0, 1));
    curves.pos.getPoint(t, v.p); curves.tgt.getPoint(t, v.t);
    // rung tay: tổng sin lệch pha (giả nhiễu), tắt dần trước chuyển giao, tắt hẳn nếu reduced-motion
    const time = capture ? (window.__t ?? 0) : state.clock.elapsedTime;
    const amp = reducedMotion ? 0 : 1 - smooth(0.62, CAMERA_END, p);
    const n = (a, b, c) => Math.sin(time * a + b) * 0.6 + Math.sin(time * c + b * 2.3) * 0.4;
    v.p.x += n(1.3, 0.2, 2.9) * 0.0035 * amp;
    v.p.y += n(1.7, 1.1, 3.7) * 0.0028 * amp;
    v.t.x += n(0.9, 2.0, 2.3) * 0.004 * amp;
    v.t.y += n(1.1, 0.7, 2.7) * 0.003 * amp;
    camera.position.copy(v.p);
    camera.fov = THREE.MathUtils.lerp(FOV_START, FOV_END, smooth(0, 0.8, t));
    camera.updateProjectionMatrix();
    camera.lookAt(v.t);
    camera.rotateZ(THREE.MathUtils.degToRad(-3.2) * (1 - smooth(0, 0.7, t)) + n(0.8, 0.4, 1.9) * 0.002 * amp);
  });
  return null;
}

function Content() {
  const [hero, dispatch, phone] = useTexture(['/tex/hero.jpg', '/tex/dispatch.jpg', '/tex/phone.jpg']);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const an = gl.capabilities.getMaxAnisotropy();
    for (const t of [hero, dispatch, phone]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = an; t.needsUpdate = true; }
  }, [hero, dispatch, phone, gl]);
  return (
    <>
      <Room />
      <Desk />
      <Monitor tex={hero} />
      <Laptop tex={dispatch} />
      <Phone tex={phone} />
      <Lamp />
      <Mug />
      <MapPrint />
      <AirConditioner />
      <NightWindow />
      <Khang />
      <ContactShadows position={[0, DESK_Y + 0.001, -0.3]} scale={[1.7, 0.82]} resolution={512} blur={2.2} opacity={0.55} far={0.6} frames={1} />
    </>
  );
}

export default function Scene({ capture = false, reducedMotion = false, onReady, parked = false }) {
  return (
    <Canvas
      className="scene-canvas"
      frameloop={parked ? 'never' : 'always'}
      dpr={capture ? 1 : [1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture }}
      camera={{ fov: FOV_START, near: 0.02, far: 20, position: [0.95, 1.44, 0.98] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15;
        scene.background = new THREE.Color('#07090d');
        scene.fog = new THREE.Fog('#07090d', 2.2, 5.5);
        window.__three = { gl, scene };
      }}
    >
      <ambientLight intensity={0.1} color="#ffd2a8" />
      {/* hắt ấm lên tường trái + máy lạnh (đèn hắt trần giả lập) */}
      <pointLight position={[-1.0, 2.4, 0.2]} color="#ffd2a8" intensity={1.4} distance={3.2} decay={1.4} />
      <Suspense fallback={null}>
        <Content />
        <StudioEnv />
        <Ready onReady={onReady} />
      </Suspense>
      <CameraRig capture={capture} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

// Môi trường phản chiếu tự dựng (PMREM từ vài tấm phát sáng) — thay drei <Environment>
// để không kéo theo bộ nạp HDR/EXR (~25 KB gz).
function StudioEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = new THREE.Scene();
    const add = (color, k, pos, sc) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.scale.set(...sc); m.lookAt(0, 0, 0); env.add(m);
    };
    add('#ffd0a0', 3, [-2, 2, 1], [2, 1, 1]);
    add('#a8c0ff', 2, [0, 1, -2], [2, 1, 1]);
    add('#ffffff', 1, [2, 3, 2], [1, 1, 1]);
    const rt = pm.fromScene(env, 0.04);
    scene.environment = rt.texture; scene.environmentIntensity = 0.35;
    return () => { rt.dispose(); pm.dispose(); scene.environment = null; };
  }, [gl, scene]);
  return null;
}

function Ready({ onReady }) {
  useEffect(() => { window.__sceneReady = true; onReady?.(); }, [onReady]);
  return null;
}

useGLTF.preload('/models/khang.glb');
