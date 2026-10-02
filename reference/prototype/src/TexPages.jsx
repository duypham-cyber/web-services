// Các "màn hình" được chụp làm texture cho cảnh 3D (chỉ dùng lúc dựng asset, không vào bundle chính).
// Mọi số trên màn hình là DỮ LIỆU MINH HỌA — có nhãn "Minh họa".
import Hero from './Hero.jsx';
import Bolt from './Bolt.jsx';
import cents from './vn-centroids.json';

const S = {
  bg: '#0b1220', panel: '#111a2e', line: 'rgba(127,170,240,.18)', dim: 'rgba(255,255,255,.6)',
};

const jobs = [
  ['BB-24107', 'Lắp điều hòa 12.000 BTU', 'Thủ Đức, TP.HCM', 'Đang đến', '#2fbf71'],
  ['BB-24106', 'Lắp máy giặt cửa trước', 'Cầu Giấy, Hà Nội', 'Đã nhận', '#7FAAF0'],
  ['BB-24105', 'Treo tivi 65"', 'Hải Châu, Đà Nẵng', 'Chờ giao', '#EF8426'],
  ['BB-24104', 'Lắp điều hòa multi', 'Biên Hòa, Đồng Nai', 'Đang lắp', '#2fbf71'],
  ['BB-24103', 'Bảo dưỡng điều hòa', 'Ninh Kiều, Cần Thơ', 'Hoàn tất', '#94a3b8'],
  ['BB-24102', 'Lắp bình nóng lạnh', 'Lê Chân, Hải Phòng', 'Đã nhận', '#7FAAF0'],
];

function Dispatch() {
  // Tuyến điều phối minh họa: nối vài tỉnh
  const pick = (code) => cents.find((c) => c.code === code) || cents[0];
  const hubs = ['79', '01', '48', '75', '92', '31'].map(pick);
  return (
    <div style={{ width: 1440, height: 900, background: S.bg, color: '#fff', display: 'flex', fontSize: 15 }}>
      <aside style={{ width: 210, background: '#0a1020', borderRight: `1px solid ${S.line}`, padding: '22px 16px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 700, fontSize: 17 }}><Bolt size={26} /> Bluebolt Dispatch</div>
        {['Tổng quan', 'Bản đồ đơn', 'Đơn hàng', 'Kỹ thuật viên', 'Đối tác Hãng', 'Sàn TMĐT', 'Bảo hành', 'Báo cáo'].map((t, i) => (
          <div key={t} style={{ marginTop: i ? 6 : 30, padding: '10px 12px', borderRadius: 8, background: i === 1 ? 'rgba(0,74,173,.45)' : 'transparent', color: i === 1 ? '#fff' : S.dim }}>{t}</div>
        ))}
      </aside>
      <main style={{ flex: 1, padding: 22, display: 'grid', gridTemplateColumns: '1fr 430px', gridTemplateRows: '92px 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / 3', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[['Đơn hôm nay', '128'], ['KTV trực tuyến', '342'], ['Đúng hẹn', '96,4%'], ['Tỉnh có đơn', '27/34']].map(([k, v]) => (
            <div key={k} style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ color: S.dim, fontSize: 13 }}>{k} <span style={{ color: '#7FAAF0' }}>· minh họa</span></div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            </div>
          ))}
        </div>
        <section style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 18, top: 14, fontWeight: 600 }}>Bản đồ đơn hàng · minh họa</div>
          <div style={{ position: 'absolute', left: 70, top: 30, width: 480, height: 800 }}>
            <img src="/vn-map.svg" width="480" height="800" alt="" />
            <svg width="480" height="800" style={{ position: 'absolute', inset: 0 }}>
              {hubs.slice(1).map((h, i) => (
                <path key={i} d={`M${hubs[0].x * 480} ${hubs[0].y * 800} Q ${(hubs[0].x + h.x) * 240 + 140} ${(hubs[0].y + h.y) * 400} ${h.x * 480} ${h.y * 800}`} fill="none" stroke="#EF8426" strokeOpacity=".7" strokeWidth="2" strokeDasharray="6 6" />
              ))}
              {cents.map((c, i) => (
                <g key={c.code}>
                  <circle cx={c.x * 480} cy={c.y * 800} r={8 + (i % 4) * 3} fill="#EF8426" opacity=".18" />
                  <circle cx={c.x * 480} cy={c.y * 800} r="3.6" fill="#FFB778" />
                </g>
              ))}
            </svg>
          </div>
          <div style={{ position: 'absolute', right: 18, bottom: 16, color: S.dim, fontSize: 13 }}>34 tỉnh/thành · dữ liệu minh họa</div>
        </section>
        <section style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Đơn mới nhất</div>
          {jobs.map(([id, t, a, st, col]) => (
            <div key={id} style={{ padding: '13px 0', borderTop: `1px solid ${S.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b style={{ fontWeight: 600 }}>{t}</b>
                <span style={{ color: col, fontWeight: 600, fontSize: 13 }}>● {st}</span>
              </div>
              <div style={{ color: S.dim, fontSize: 13, marginTop: 4 }}>{id} · {a}</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function Phone() {
  return (
    <div style={{ position: 'relative', width: 540, height: 1170, background: '#F2F8FC', color: '#0F172A', padding: '70px 28px 28px', fontSize: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 26 }}><Bolt size={40} /> App Thợ</div>
        <span style={{ background: '#E3F4E8', color: '#1F7A3A', borderRadius: 999, padding: '6px 14px', fontSize: 18, fontWeight: 600 }}>Đang trực</span>
      </div>
      <div style={{ marginTop: 34, fontSize: 18, color: '#A94F00', fontWeight: 600, letterSpacing: '.08em' }}>VIỆC MỚI GẦN BẠN</div>
      <div style={{ marginTop: 14, background: '#fff', borderRadius: 24, padding: 26, boxShadow: '0 10px 30px rgba(10,31,68,.12)' }}>
        <div style={{ fontWeight: 700, fontSize: 30 }}>Lắp điều hòa 12.000 BTU</div>
        <div style={{ color: '#475569', marginTop: 10, lineHeight: 1.5 }}>Thủ Đức, TP.HCM · cách 2,4 km<br />Hẹn 14:00–15:00 hôm nay</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {['Ống đồng 3m', 'Giá đỡ', 'Hút chân không'].map((t) => (
            <span key={t} style={{ background: '#E8F1FC', color: '#004AAD', borderRadius: 999, padding: '6px 12px', fontSize: 17 }}>{t}</span>
          ))}
        </div>
        <div style={{ marginTop: 26, background: '#EF8426', color: '#0A1F44', borderRadius: 16, textAlign: 'center', padding: '20px 0', fontWeight: 700, fontSize: 26 }}>Nhận việc</div>
      </div>
      {['Treo tivi 65" · Quận 7', 'Bảo dưỡng 2 máy lạnh · Bình Thạnh'].map((t) => (
        <div key={t} style={{ marginTop: 16, background: '#fff', borderRadius: 20, padding: '20px 24px', color: '#475569' }}>{t}</div>
      ))}
      <div style={{ marginTop: 30, textAlign: 'center', color: '#64748B', fontSize: 16 }}>Minh họa giao diện</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: '#fff', borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-around', alignItems: 'center', color: '#475569', fontSize: 18 }}>
        {['Việc', 'Lịch', 'Thu nhập', 'Tôi'].map((t, i) => <span key={t} style={{ color: i ? '#475569' : '#004AAD', fontWeight: i ? 400 : 700 }}>{t}</span>)}
      </div>
    </div>
  );
}

export default function TexPage({ which }) {
  document.body.style.margin = '0';
  if (which === 'hero') return <div style={{ position: 'relative', width: '100vw', height: '100vh' }}><Hero asTexture /></div>;
  if (which === 'dispatch') return <Dispatch />;
  if (which === 'phone') return <Phone />;
  return <p>tex=hero|dispatch|phone</p>;
}
