import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import type { AppHref } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import type { IllustrationName } from './illustrations';
import { MediaFrame } from './MediaFrame';
import { SectionHeader } from './SectionHeader';

type DoorKey = 'brands' | 'technicians' | 'consumers';

const DOORS: readonly { key: DoorKey; illustration: IllustrationName; href: AppHref; secondaryHref?: AppHref }[] = [
  { key: 'brands', illustration: 'brands', href: '/giai-phap/hang-dien-may', secondaryHref: '/giai-phap/san-tmdt-ban-le' },
  { key: 'technicians', illustration: 'technicians', href: '/doi-tac-tho' },
  { key: 'consumers', illustration: 'consumers', href: '/ho-tro-khach-hang' },
];

/**
 * P1 "BA CỬA VÀO" (docs/03 mục 13.4, contracts/site-shell-p0.md T-HOME) — đích của link "Bỏ qua phần giới thiệu"
 * và của handoff phim: <section id="ba-cua-vao" tabindex="-1"> với H2. Không phụ thuộc hướng hero (phim A+ hay hero
 * bản đồ): section này đứng ngay sau <FilmHero/>.
 * Ảnh và chữ tách vùng (UX-35): khung ảnh ở trên (mobile, ≥1024) hoặc bên trái (768–1023), chữ không đè ảnh.
 */
export async function DoorsSection({ tone }: { tone: SectionTone }) {
  const t = await getTranslations('home');

  return (
    <Section id="ba-cua-vao" tabIndex={-1} tone={tone} aria-labelledby="ba-cua-vao-title" className="outline-none">
      <SectionHeader id="ba-cua-vao-title" eyebrow={t('doors.eyebrow')} title={t('doors.title')} lead={t('doors.lead')} />

      <StaggerGrid as="ul" className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-3" itemClassName="flex">
        {DOORS.map((door) => (
          <Card
            key={door.key}
            interactive
            padding="none"
            className="grid w-full overflow-hidden md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-cols-1 lg:grid-rows-[auto_1fr]"
          >
            <MediaFrame
              illustration={door.illustration}
              ratio="16/10"
              rounded={false}
              pendingLabel={t('media.photoPending')}
              className="md:aspect-auto md:h-full md:min-h-56 lg:aspect-[16/10] lg:h-auto lg:min-h-0"
            />
            <div className="flex flex-col p-6 md:p-8">
              <p>
                <Chip variant="blue">{t(`doors.${door.key}.label`)}</Chip>
              </p>
              <Heading level={3} className="mt-4">
                {t(`doors.${door.key}.title`)}
              </Heading>
              <p className="mt-3 text-body text-(--surface-muted)">{t(`doors.${door.key}.body`)}</p>
              <div className="mt-auto flex flex-col items-start gap-3 pt-6">
                <TextLink href={door.href} variant="arrow" className="after:absolute after:inset-0 after:rounded-lg">
                  {t(`doors.${door.key}.cta`)}
                </TextLink>
                {door.secondaryHref ? (
                  <TextLink href={door.secondaryHref} variant="arrow" className="relative z-10 text-small">
                    {t('doors.brands.secondary')}
                  </TextLink>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </StaggerGrid>
    </Section>
  );
}
