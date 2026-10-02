import Bolt from './Bolt.jsx';
import cents from './vn-centroids.json';

// Hero HTML thật = đích "chuyển giao" khi màn hình trong cảnh lấp khung.
// Cùng component này được chụp làm texture màn hình lớn (?tex=hero, 1600×900) → hai bên khớp nhau.
export default function Hero({ asTexture = false }) {
  const Tag = asTexture ? 'div' : 'section';
  return (
    <Tag className="hero" aria-labelledby={asTexture ? undefined : 'hero-title'}>
      <div className="hero-stage">
        <nav className="hero-nav" aria-label="Điều hướng chính">
          <a className="wordmark" href="#"><Bolt /> Bluebolt Services</a>
          <ul>
            <li>Dịch vụ</li><li>Bảng giá</li><li>Mạng lưới KTV</li><li>Đối tác</li><li>Tin tức</li>
          </ul>
          <a className="btn btn-orange" href="tel:0902808049">Gọi 0902 808 049</a>
        </nav>
        <div className="hero-copy">
          <div className="eyebrow">Mạng lưới kỹ thuật viên toàn quốc</div>
          <h1 id={asTexture ? undefined : 'hero-title'}>Lắp đặt điện máy <em>toàn quốc</em></h1>
          <p className="hero-sub">
            Một đầu mối điều phối kỹ thuật viên lắp đặt điều hòa, điện máy cho Hãng, Sàn TMĐT,
            đội thợ và khách lẻ. Nhận đơn, giao đúng người, theo dõi đến khi bàn giao.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-orange" href="#lien-he">Gửi yêu cầu lắp đặt</a>
            <a className="btn btn-ghost" href="#ky-thuat-vien">Đăng ký làm kỹ thuật viên</a>
          </div>
          <div className="pillars">
            <div className="pillar"><b>Nhanh</b><span>Điều phối KTV gần nhất theo khu vực</span></div>
            <div className="pillar"><b>Chuẩn</b><span>Quy trình lắp đặt theo tiêu chuẩn Hãng</span></div>
            <div className="pillar"><b>Minh bạch</b><span>Bảng giá công khai theo vùng</span></div>
          </div>
        </div>
        <div className="hero-map" aria-hidden="true">
          <img src="/vn-map.svg" alt="" width="600" height="1000" />
          {cents.map((c) => (
            <span key={c.code} className="dot" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }} />
          ))}
        </div>
        <div className="job-card" aria-hidden="true">
          <div className="row"><b>Lắp điều hòa 12.000 BTU</b><span className="chip chip-ok">KTV đang đến</span></div>
          <p>Thủ Đức, TP.HCM · Hẹn 14:00–15:00</p>
          <div className="row" style={{ marginTop: 'calc(var(--u)*.6)' }}>
            <span style={{ color: '#475569' }}>Đơn từ Sàn TMĐT</span><span className="chip chip-demo">Minh họa</span>
          </div>
        </div>
      </div>
    </Tag>
  );
}
