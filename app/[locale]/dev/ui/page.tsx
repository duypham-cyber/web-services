import { ArrowRight, Mail, Phone, Search } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { VietnamMap } from '@/components/map/VietnamMap';
import { CountUp } from '@/components/motion/CountUp';
import { Curtain } from '@/components/motion/Curtain';
import { Rise } from '@/components/motion/Rise';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field';
import { Heading } from '@/components/ui/Heading';
import { IconButton } from '@/components/ui/IconButton';
import { KpiTile } from '@/components/ui/KpiTile';
import { Prose } from '@/components/ui/Prose';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TableScroll } from '@/components/ui/TableScroll';
import { TextLink } from '@/components/ui/TextLink';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { devPagesEnabled } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';
import { contrastRatio, readColorTokens } from '@/lib/tokens';
import { CONTRAST_PAIRS } from '@/styles/contrast-pairs';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/dev/ui'>): Promise<Metadata> {
  if (!devPagesEnabled()) notFound();
  const locale = await resolveLocale(params);
  return buildMetadata({
    routeKey: 'dev.ui',
    locale,
    title: 'UI kit (nội bộ)',
    description: 'Trang nội bộ để duyệt design tokens và primitive của Bluebolt Services. Không index.',
  });
}

const VN_TEST = 'ẦẪỆ Ước Hưởng';

// Tên class phải viết đủ (Tailwind không nhận class ghép động)
const RADII = [
  ['rounded-sm · 8', 'rounded-sm'],
  ['rounded-md · 12', 'rounded-md'],
  ['rounded-lg · 20', 'rounded-lg'],
  ['rounded-xl · 28', 'rounded-xl'],
  ['rounded-pill', 'rounded-pill'],
] as const;
const SHADOWS = [
  ['shadow-1', 'shadow-1'],
  ['shadow-2', 'shadow-2'],
  ['shadow-3', 'shadow-3'],
] as const;

const TYPE_SCALE = [
  { token: 'display', cls: 'font-display text-display', spec: 'clamp(2.5rem, 4.6vw, 4.5rem) · LH 1.1 · 700' },
  { token: 'h1', cls: 'font-display text-h1', spec: 'clamp(2rem, 3.4vw, 3.25rem) · LH 1.15 · 700' },
  { token: 'h2', cls: 'text-h2', spec: 'clamp(1.625rem, 2.6vw, 2.5rem) · LH 1.2 · 600' },
  { token: 'h3', cls: 'text-h3', spec: 'clamp(1.25rem, 1.6vw, 1.5rem) · LH 1.3 · 600' },
  { token: 'lead', cls: 'text-lead', spec: 'clamp(1.125rem, 1.4vw, 1.375rem) · LH 1.55 · 500' },
  { token: 'body', cls: 'text-body', spec: '1rem · LH 1.65 · 400' },
  { token: 'small', cls: 'text-small', spec: '0.875rem · LH 1.5 · 400/500' },
  { token: 'kpi', cls: 'font-display text-kpi tabular', spec: 'clamp(2.25rem, 4vw, 3.5rem) · LH 1 · 700 · tabular-nums' },
] as const;

function DemoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-(--surface-border) pt-8">
      <h3 className="eyebrow text-(--surface-accent)">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ComponentsOn({ tone }: { tone: SectionTone }) {
  const dark = tone === 'navy';
  return (
    <div className="flex flex-col gap-12">
      <DemoBlock title="Button · variant × size">
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/lien-he" variant="primary" size="lg">
            Nhận báo giá
          </Button>
          <Button href="/lien-he" variant="primary">
            Nhận báo giá
          </Button>
          <Button href="/lien-he" variant="primary" size="sm">
            Nhận báo giá
          </Button>
          {dark ? (
            <Button href="/doi-tac-tho" variant="on-dark">
              Đăng ký làm đối tác thợ
            </Button>
          ) : (
            <>
              <Button href="/doi-tac-tho" variant="blue" iconEnd={<ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} />}>
                Đặt lịch demo 30 phút
              </Button>
              <Button href="/doi-tac-tho" variant="ghost">
                Đăng ký làm đối tác thợ
              </Button>
            </>
          )}
          <Button variant={dark ? 'on-dark' : 'ghost'} disabled>
            Đã tắt
          </Button>
        </div>
      </DemoBlock>

      <DemoBlock title="Chip · Badge">
        <div className="flex flex-wrap items-center gap-3">
          {dark ? (
            <Chip variant="on-dark">Điều hòa</Chip>
          ) : (
            <>
              <Chip>Điều hòa</Chip>
              <Chip variant="orange">Miền Nam</Chip>
              <Chip variant="neutral">Máy giặt</Chip>
            </>
          )}
          <Badge variant="info">Mới</Badge>
          <Badge variant="warranty">Bảo hành</Badge>
          <Badge variant="success">Đã nghiệm thu</Badge>
          <Badge variant="danger">Quá hạn</Badge>
          <DraftBadge />
          <Badge variant="illustration">Minh họa</Badge>
        </div>
      </DemoBlock>

      <DemoBlock title="Eyebrow · Heading · TextLink · IconButton">
        <Eyebrow>Ba nhóm khách</Eyebrow>
        <Heading level={3} size="h2" className="mt-3">
          Bluebolt làm việc với ai
        </Heading>
        <p className="mt-3 max-w-text text-body text-(--surface-muted)">
          Đoạn văn phụ màu theo tông bề mặt, có{' '}
          <TextLink href="/giai-phap" variant="inline">
            link trong câu
          </TextLink>{' '}
          gạch chân để không chỉ dựa vào màu.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <TextLink href="/mang-luoi" variant="arrow">
            Xem mạng lưới
          </TextLink>
          <IconButton label="Gọi 0902 808 049" externalHref="tel:+84902808049" variant={dark ? 'on-dark' : 'ghost'}>
            <Phone aria-hidden="true" size={22} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Gửi email" externalHref="mailto:contact@bluebolt.services" variant={dark ? 'on-dark' : 'ghost'}>
            <Mail aria-hidden="true" size={22} strokeWidth={1.75} />
          </IconButton>
          {dark ? null : (
            <IconButton label="Tìm kiếm" variant="solid">
              <Search aria-hidden="true" size={20} strokeWidth={1.75} />
            </IconButton>
          )}
        </div>
      </DemoBlock>

      <DemoBlock title="KpiTile (value = null → không render)">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <KpiTile value={1234} locale="vi" label="Thợ đang hoạt động" note="Số minh họa · cập nhật 02/10/2026" animate badge={<Badge variant="illustration">Minh họa</Badge>} />
          <KpiTile value={27} format="of-34" locale="vi" label="Tỉnh/thành có thợ" note="Số minh họa" animate />
          <KpiTile value={96.4} format="percent" locale="vi" label="Tỷ lệ đúng hẹn" note="Số minh họa" />
          <KpiTile value={4} format="hours" unit="giờ" locale="vi" label="Xác nhận lịch trung bình" note="Số minh họa" />
          <KpiTile value={null} locale="vi" label="Ô này không hiện vì value = null" />
        </div>
      </DemoBlock>
    </div>
  );
}

export default async function DevUiPage({ params }: PageProps<'/[locale]/dev/ui'>) {
  if (!devPagesEnabled()) notFound();
  await resolveLocale(params);
  const colors = readColorTokens();

  return (
    <>
      <Section tone="blue-50" aria-labelledby="dev-ui-title">
        <Eyebrow>Nội bộ · noindex</Eyebrow>
        <Heading level={1} id="dev-ui-title" className="mt-3">
          UI kit Bluebolt Services
        </Heading>
        <p className="mt-5 max-w-text text-lead text-(--surface-muted)">
          Design tokens (styles/tokens.css) và primitive (components/ui, components/motion) trên nền sáng và nền navy.
          Trang chỉ chạy khi dev hoặc DEV_PAGES=1.
        </p>
      </Section>

      <Section aria-labelledby="dev-colors">
        <Heading level={2} id="dev-colors">
          Màu (docs/03 mục 11.1)
        </Heading>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(colors).map(([name, hex]) => (
            <li key={name} className="overflow-clip rounded-md border border-slate-300 bg-white">
              <div className="h-16 border-b border-slate-300" style={{ background: hex }} />
              <div className="p-3">
                <p className="text-small font-semibold text-ink-900">{name}</p>
                <p className="text-small tabular text-slate-600">{hex}</p>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="eyebrow mt-12 text-orange-700">Cặp tương phản (tính lại từ tokens.css)</h3>
        <TableScroll label="Bảng cặp tương phản" className="mt-4">
          <table className="w-full min-w-[40rem] border-collapse text-left text-small">
            <thead className="bg-blue-50 text-navy-900">
              <tr>
                <th className="p-3">Mẫu</th>
                <th className="p-3">Chữ / nền</th>
                <th className="p-3">Tài liệu</th>
                <th className="p-3">Tính được</th>
                <th className="p-3">Dùng cho</th>
              </tr>
            </thead>
            <tbody>
              {CONTRAST_PAIRS.map((p) => {
                const fg = colors[p.fg] ?? '#000000';
                const bg = colors[p.bg] ?? '#FFFFFF';
                return (
                  <tr key={`${p.fg}-${p.bg}`} className="border-t border-slate-300">
                    <td className="p-3">
                      {p.min === 0 ? (
                        // Cặp chỉ dùng trang trí (đường kẻ): vẽ đường kẻ, không đặt chữ (axe sẽ báo thiếu tương phản)
                        <span aria-hidden="true" className="block h-0.5 w-16 rounded-pill" style={{ background: fg }} />
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-sm px-3 py-1 font-semibold" style={{ color: fg, background: bg }}>
                          Aa Ước
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-ink-900">
                      {p.fg} / {p.bg}
                    </td>
                    <td className="p-3 tabular">{p.expected.toFixed(2)}</td>
                    <td className="p-3 tabular font-semibold">{contrastRatio(fg, bg).toFixed(2)}</td>
                    <td className="p-3 text-slate-600">{p.usage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section tone="blue-50" aria-labelledby="dev-type">
        <Heading level={2} id="dev-type">
          Chữ (docs/03 mục 11.2) — thử dấu: “{VN_TEST}”
        </Heading>
        <p className="mt-3 max-w-text text-body text-(--surface-muted)">
          Mỗi cỡ heading ép xuống 2 dòng để soát dấu chồng (Ầ, Ẫ, Ệ) không chạm dòng trên. Line-height ≥ 1,1; tracking âm tối đa −0,02em.
        </p>
        <div className="mt-10 flex flex-col gap-10">
          {TYPE_SCALE.map((row) => (
            <div key={row.token} className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
              <div>
                <p className="text-small font-semibold text-navy-900">{row.token}</p>
                <p className="text-small text-slate-600">{row.spec}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <p className={`${row.cls} max-w-[6.5em] text-navy-900`}>{VN_TEST}</p>
                <p className={`${row.cls} text-navy-900`}>Hạ tầng lắp đặt toàn quốc</p>
              </div>
            </div>
          ))}
          <div className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
            <div>
              <p className="text-small font-semibold text-navy-900">eyebrow</p>
              <p className="text-small text-slate-600">0.75rem · UPPERCASE · 0.14em · 600</p>
            </div>
            <Eyebrow>Mạng lưới lắp đặt · {VN_TEST}</Eyebrow>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="dev-light">
        <Heading level={2} id="dev-light">
          Thành phần trên nền sáng
        </Heading>
        <div className="mt-10">
          <ComponentsOn tone="light" />
        </div>
      </Section>

      <Section tone="navy" aria-labelledby="dev-navy">
        <Heading level={2} id="dev-navy">
          Thành phần trên nền navy
        </Heading>
        <div className="mt-10">
          <ComponentsOn tone="navy" />
        </div>
      </Section>

      <Section tone="blue-50" aria-labelledby="dev-cards">
        <Heading level={2} id="dev-cards">
          Card · Field · Prose
        </Heading>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card>
            <Heading level={3}>Card trắng</Heading>
            <p className="mt-2 text-body text-(--surface-muted)">Bo lg 20px, viền slate-300, shadow-1.</p>
          </Card>
          <Card tone="blue-50" interactive>
            <Heading level={3}>Card tương tác</Heading>
            <p className="mt-2 text-body text-(--surface-muted)">Hover nổi shadow-2.</p>
            <TextLink href="/dich-vu" variant="arrow" className="mt-4 after:absolute after:inset-0">
              Cả thẻ bấm được
            </TextLink>
          </Card>
          <Card tone="navy">
            <Heading level={3}>Card navy</Heading>
            <p className="mt-2 text-body text-(--surface-muted)">Chữ, link, focus tự đổi theo tông.</p>
          </Card>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Card padding="lg">
            <form className="flex flex-col gap-6" aria-label="Mẫu trường nhập (chỉ trình bày, không gửi)">
              <Field id="demo-name" label="Họ và tên" required requiredLabel="bắt buộc">
                {(c) => <TextInput autoComplete="name" placeholder="Nguyễn Văn A" {...c} />}
              </Field>
              <Field id="demo-phone" label="Số điện thoại" hint="Ví dụ 0902 808 049" error="Số điện thoại chưa đúng định dạng">
                {(c) => <TextInput type="tel" autoComplete="tel" defaultValue="abc" {...c} />}
              </Field>
              <Field id="demo-province" label="Tỉnh/thành triển khai">
                {(c) => (
                  <Select {...c} defaultValue="">
                    <option value="" disabled>
                      Chọn tỉnh/thành
                    </option>
                    <option value="79">TP. Hồ Chí Minh</option>
                    <option value="01">Hà Nội</option>
                  </Select>
                )}
              </Field>
              <Field id="demo-note" label="Ghi chú">
                {(c) => <TextArea {...c} />}
              </Field>
            </form>
          </Card>
          <Prose>
            <h2>Prose: bài viết và pháp lý</h2>
            <p>
              Khối văn bản dài dùng <code>.prose-bb</code>, rộng tối đa 720px, có <a href="#dev-cards">link gạch chân</a>.
            </p>
            <ul>
              <li>Danh sách có marker xanh</li>
              <li>Không animate nội dung pháp lý</li>
            </ul>
            <h3>Bảng</h3>
            <table>
              <thead>
                <tr>
                  <th>Hạng mục</th>
                  <th>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Bảo hành lắp mới</td>
                  <td>[chờ anh Duy]</td>
                </tr>
              </tbody>
            </table>
          </Prose>
        </div>
      </Section>

      <Section aria-labelledby="dev-motion">
        <Heading level={2} id="dev-motion">
          Motion 2.5D (docs/03 mục 12) — cuộn tới để xem
        </Heading>
        <p className="mt-3 max-w-text text-body text-(--surface-muted)">
          Rise, Curtain, StaggerGrid dùng một IntersectionObserver (MotionRuntime), không GSAP. CountUp ghi textContent qua rAF.
          Reduced-motion: mọi thứ hiện ngay.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <Rise>
            <Card>
              <Heading level={3}>Rise</Heading>
              <p className="mt-2 text-body text-(--surface-muted)">Trượt lên 24px (desktop) / 12px (mobile), 520ms.</p>
            </Card>
          </Rise>
          <Curtain className="aspect-video">
            <div className="size-full bg-linear-to-br from-blue-600 to-navy-900" />
          </Curtain>
          <Card tone="navy">
            <p className="font-display text-kpi tabular text-white">
              <CountUp value={20000} format="integer" locale="vi" />
            </p>
            <p className="mt-2 text-small text-slate-300">CountUp (số minh họa)</p>
          </Card>
        </div>
        <StaggerGrid as="ul" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['Lắp đặt điều hòa', 'Lắp đặt điện máy', 'Bảo trì định kỳ', 'Lắp đặt robot hút bụi'].map((name) => (
            <Card key={name} padding="md">
              <p className="text-body font-semibold text-navy-900">{name}</p>
            </Card>
          ))}
        </StaggerGrid>
      </Section>

      <Section tone="blue-50" aria-labelledby="dev-shape">
        <Heading level={2} id="dev-shape">
          Bo góc · bóng · khoảng cách (docs/03 mục 11.3)
        </Heading>
        <div className="mt-8 flex flex-wrap gap-6">
          {RADII.map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className={`size-20 border-2 border-blue-600 bg-white ${cls}`} />
              <span className="text-small text-slate-600">{name}</span>
            </div>
          ))}
          {SHADOWS.map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className={`size-20 rounded-md bg-white ${cls}`} />
              <span className="text-small text-slate-600">{name}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-end gap-3">
          {[1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((n) => (
            <div key={n} className="flex flex-col items-center gap-2">
              <div className="w-6 bg-orange-500" style={{ height: n * 4 }} />
              <span className="text-small tabular text-slate-600">{n * 4}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="dev-stubs">
        <Heading level={2} id="dev-stubs">
          Stub cho agent khác
        </Heading>
        <p className="mt-3 max-w-text text-body text-(--surface-muted)">
          FilmHero (xem trang chủ) và VietnamMap giữ chữ ký props; agent phim / bản đồ thay ruột.
        </p>
        <div className="mt-8 max-w-sm">
          <VietnamMap locale="vi" title="Bản đồ Việt Nam (stub)" />
        </div>
      </Section>
    </>
  );
}
