import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero.jsx';
import Bolt from './Bolt.jsx';
import { scrollStore, CAMERA_END, HANDOFF_IN, HANDOFF_FULL } from './scrollStore.js';

gsap.registerPlugin(ScrollTrigger);
// three/R3F nằm trong chunk riêng: chỉ tải khi thật sự render cảnh 3D (desktop, không reduced-motion)
const Scene = lazy(() => import('./Scene.jsx'));

const q = new URLSearchParams(location.search);
const CAPTURE = q.has('capture'); // chế độ chụp bằng chứng: không làm mượt, thời gian rung tay do script cấp
const FORCE = q.get('mode');
if (q.has('clean')) document.documentElement.classList.add('clean'); // ẩn lớp chữ DOM khi chụp poster/video // 'scene' | 'video' | 'still' — ép chế độ để kiểm thử

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function useMode() {
  const [mode] = useState(() => {
    if (FORCE) return FORCE;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'still';
    // MOBILE: không chạy WebGL; dùng video dựng sẵn từ CHÍNH cảnh 3D (hero-mobile.mp4), cuộn = tua video
    if (matchMedia('(max-width: 767px)').matches) return 'video';
    return 'scene';
  });
  return mode;
}

export default function App() {
  const mode = useMode();
  return (
    <>
      {/* Bỏ qua phim: nhảy tới mốc SAU phim (phần tử đích nhìn thấy được), không trỏ vào H1 đang ẩn trong lớp handoff */}
      <a className="skip-link" href="#ba-cua-vao">Bỏ qua phần giới thiệu ↓</a>
      {mode === 'still' ? <StillIntro /> : <CameraIntro mode={mode} />}
      <After />
    </>
  );
}

function TopBar() {
  return (
    <header className="film-topbar">
      <a className="wordmark" href="#"><Bolt /> Bluebolt Services <small>· Lắp đặt toàn quốc</small></a>
      <a className="btn btn-orange" href="tel:0902808049">Gọi 0902 808 049</a>
    </header>
  );
}

// prefers-reduced-motion: ảnh poster tĩnh + hero HTML ngay bên dưới, không có chuyển động theo cuộn
function StillIntro() {
  return (
    <>
      <div className="scene-sticky" style={{ position: 'relative' }}>
        <img className="scene-poster" src="/poster.jpg" alt="Bàn điều phối Bluebolt trong phòng tối, màn hình hiển thị trang Bluebolt Services" />
        <TopBar />
      </div>
      <div style={{ position: 'relative', height: '100vh' }}><Hero /></div>
    </>
  );
}

function CameraIntro({ mode }) {
  const track = useRef();
  const handoff = useRef();
  const caption = useRef();
  const media = useRef();
  const video = useRef();
  const topbar = useRef();
  const [parked, setParked] = useState(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const apply = (p) => {
      scrollStore.progress = p;
      const h = smooth(HANDOFF_IN, HANDOFF_FULL, p);
      handoff.current.style.opacity = h;
      handoff.current.style.pointerEvents = h > 0.5 ? 'auto' : 'none';
      media.current.style.opacity = 1 - smooth(HANDOFF_FULL - 0.02, HANDOFF_FULL + 0.03, p);
      // màn hình trong cảnh đã có nav riêng → ẩn thanh trên trước khi lấp khung, tránh 2 thanh nav chồng nhau
      const tb = 1 - smooth(0.55, 0.72, p);
      topbar.current.style.opacity = tb;
      topbar.current.style.visibility = tb < 0.02 ? 'hidden' : 'visible';
      const c = 1 - smooth(0.04, 0.22, p);
      caption.current.style.opacity = c;
      caption.current.style.transform = `translateY(${(1 - c) * -12}px)`;
      setParked(p > HANDOFF_FULL + 0.04);
      const v = video.current;
      // Gom tua theo rAF và bỏ qua khi video đang seeking, tránh dồn hàng đợi tua trên iOS
      if (v && v.duration) {
        v.__target = Math.min(1, p / CAMERA_END) * (v.duration - 0.05);
        if (!v.__raf) v.__raf = requestAnimationFrame(() => {
          v.__raf = 0;
          if (!v.seeking) v.currentTime = v.__target;
        });
      }
    };
    const st = ScrollTrigger.create({ trigger: track.current, start: 'top top', end: 'bottom bottom', onUpdate: (s) => apply(s.progress) });
    apply(st.progress);
    window.__applyProgress = apply;
    return () => st.kill();
  }, []);

  return (
    <div className="scene-track" ref={track}>
      <div className="scene-sticky">
        <div ref={media} style={{ position: 'absolute', inset: 0 }}>
          {/* poster hiện ngay (LCP), cảnh 3D phủ lên khi sẵn sàng */}
          {!ready && <img className="scene-poster" src={mode === 'video' ? '/poster-mobile.jpg' : '/poster.jpg'} alt="" fetchPriority="high" />}
          {mode === 'scene' && (
            <Suspense fallback={null}>
              <SceneHost parked={parked} onReady={() => setReady(true)} />
            </Suspense>
          )}
          {mode === 'video' && (
            // Video được encode GOP ngắn (keyframe dày) để tua theo cuộn mượt
            <video ref={video} className="scene-video" src="/hero-mobile.mp4" muted playsInline preload="auto" poster="/poster-mobile.jpg"
              onLoadedData={() => setReady(true)} aria-hidden="true"
              onSeeked={(e) => { const v = e.currentTarget; if (v.__target != null && Math.abs(v.currentTime - v.__target) > 0.04) v.currentTime = v.__target; }} />
          )}
        </div>
        <div ref={topbar}><TopBar /></div>
        <div className="film-caption" ref={caption}>
          <b>Phòng điều phối Bluebolt</b>
          Nơi mỗi đơn lắp đặt được giao đúng kỹ thuật viên gần nhất.
          <div className="scroll-hint"><i /> Cuộn để vào màn hình</div>
        </div>
        <div className="handoff" ref={handoff} style={{ opacity: 0, display: q.has('hideHandoff') ? 'none' : undefined }}>
          <Hero />
        </div>
        <span className="proto-tag">Prototype · cảnh dựng thủ tục</span>
      </div>
    </div>
  );
}

function SceneHost({ parked, onReady }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div style={{ position: 'absolute', inset: 0, visibility: parked ? 'hidden' : 'visible' }}>
      <Scene capture={CAPTURE} reducedMotion={reduced} onReady={onReady} parked={parked} />
    </div>
  );
}

function After() {
  return (
    <section className="after" id="ba-cua-vao" aria-labelledby="ai-title">
      <div className="after-inner">
        <div className="eyebrow">Ba nhóm khách, một mạng lưới</div>
        <h2 id="ai-title">Bluebolt làm việc với ai</h2>
        <div className="cards">
          <div className="card"><h3>Hãng điện máy</h3><p>Phủ lắp đặt và bảo hành theo tiêu chuẩn Hãng, một đầu mối cho nhiều tỉnh.</p></div>
          <div className="card"><h3>Sàn TMĐT</h3><p>Đơn từ sàn được nhận và giao kỹ thuật viên theo khu vực giao hàng.</p></div>
          <div className="card"><h3>Kỹ thuật viên</h3><p>Nhận việc gần nơi ở qua app, quy trình và bảng giá rõ ràng.</p></div>
        </div>
        <p className="note">Prototype chỉ dựng phần hero "máy quay tiến vào màn hình". Nội dung, số liệu và logo là tạm thời, chờ anh Duy xác nhận.</p>
      </div>
    </section>
  );
}
