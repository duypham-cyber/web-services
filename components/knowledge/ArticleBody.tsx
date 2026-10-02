import { ImageIcon, Lightbulb, TriangleAlert } from 'lucide-react';
import { DraftBadge } from '@/components/ui/DraftBadge';
import {
  imageVisible,
  isClaimItem,
  type ArticleContent,
  type Block,
  type ListItem,
  type OutlineSection,
  type OutlineStep,
} from '@/content/articles/all';
import type { ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { cn } from '@/lib/cn';
import { InlineText } from './InlineText';
import { MediaFrame } from './MediaFrame';

type Labels = { tip: string; warning: string };

type ArticleBodyProps = {
  content: ArticleContent;
  locale: Locale;
  /** Dàn ý đã lọc claim (content/articles/all.ts articleOutline) — cùng nguồn với mục lục nên #id luôn khớp. */
  outline: OutlineSection[];
  labels: Labels;
};

/**
 * Thân bài /kien-thuc/[slug] (Server Component). Mỗi khối trong content/articles/types.ts → HTML ngữ nghĩa:
 * mục = <section> + H2 · bước = <ol> + H3 (marker số xanh) · câu khẳng định đi qua claim() (production ẩn nếu chưa duyệt,
 * bản xem trước kèm nhãn Nháp). Không dùng .prose-bb (lớp CSS không nằm trong layer nên không ghi đè được kiểu danh sách).
 */
export function ArticleBody({ content, locale, outline, labels }: ArticleBodyProps) {
  return (
    <div className="text-body text-(--surface-fg)">
      {content.intro.length > 0 ? (
        <div className="space-y-6">
          {content.intro.map((block, i) => (
            <BlockView key={i} block={block} locale={locale} labels={labels} />
          ))}
        </div>
      ) : null}
      {outline.map((entry) => (
        <SectionView key={entry.id} entry={entry} locale={locale} labels={labels} />
      ))}
    </div>
  );
}

function SectionView({ entry, locale, labels }: { entry: OutlineSection; locale: Locale; labels: Labels }) {
  const steps = [...entry.steps];
  return (
    <section aria-labelledby={entry.id} className="mt-14 first:mt-0 md:mt-16">
      <h2 id={entry.id} className="text-h2 text-(--surface-heading)">
        {entry.title}
        {entry.draft ? <DraftBadge className="ml-3 align-middle" /> : null}
      </h2>
      <div className="mt-5 space-y-6">
        {entry.section.gate ? <ClaimParagraph id={entry.section.gate} locale={locale} /> : null}
        {entry.section.blocks.map((block, i) =>
          block.type === 'steps' ? (
            <StepsView key={i} steps={steps.splice(0, block.items.length)} locale={locale} labels={labels} />
          ) : (
            <BlockView key={i} block={block} locale={locale} labels={labels} />
          ),
        )}
      </div>
    </section>
  );
}

function StepsView({ steps, locale, labels }: { steps: OutlineStep[]; locale: Locale; labels: Labels }) {
  return (
    <ol className="space-y-10 overflow-clip md:space-y-12">
      {steps.map((entry, i) => (
        <li
          key={entry.id}
          className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[3.5rem_minmax(0,1fr)] md:gap-x-6"
        >
          {i < steps.length - 1 ? (
            <span aria-hidden="true" className="absolute top-14 -bottom-10 left-6 w-px bg-blue-100 md:top-16 md:-bottom-12 md:left-7" />
          ) : null}
          <span
            aria-hidden="true"
            className="relative flex size-12 items-center justify-center rounded-pill bg-blue-600 font-display text-lead font-bold text-white tabular md:size-14"
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 space-y-4 pt-2 md:pt-3">
            <h3 id={entry.id} className="text-h3 text-(--surface-heading)">
              {entry.title}
            </h3>
            {entry.step.blocks.map((block, j) => (
              <BlockView key={j} block={block} locale={locale} labels={labels} />
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ClaimParagraph({ id, locale }: { id: ClaimId; locale: Locale }) {
  const c = claim(id, locale);
  if (!c) return null;
  return (
    <p>
      {c.text}
      {c.draft ? <DraftBadge className="ml-2" /> : null}
    </p>
  );
}

function ListItemView({ item, locale }: { item: ListItem; locale: Locale }) {
  if (isClaimItem(item)) {
    const c = claim(item.claim, locale);
    if (!c) return null;
    return (
      <li>
        {c.text}
        {c.draft ? <DraftBadge className="ml-2" /> : null}
      </li>
    );
  }
  return (
    <li>
      <InlineText text={item[locale]} />
    </li>
  );
}

function BlockView({ block, locale, labels }: { block: Block; locale: Locale; labels: Labels }) {
  switch (block.type) {
    case 'p':
      return (
        <p>
          <InlineText text={block.text[locale]} />
        </p>
      );

    case 'list': {
      // Câu khẳng định bị ẩn (production) → bỏ mục; cả danh sách trống → bỏ cả nhãn
      const visible = block.items.filter((item) => !isClaimItem(item) || claim(item.claim, locale) !== null);
      if (visible.length === 0) return null;
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <div className="space-y-2">
          {block.label ? <p className="font-semibold text-(--surface-heading)">{block.label[locale]}</p> : null}
          <List
            className={cn(
              'space-y-2 pl-6 marker:text-blue-600',
              block.ordered ? 'list-decimal marker:font-semibold' : 'list-disc',
            )}
          >
            {visible.map((item, i) => (
              <ListItemView key={i} item={item} locale={locale} />
            ))}
          </List>
        </div>
      );
    }

    case 'defs': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 rounded-md border border-blue-100 bg-blue-50 p-4">
              {block.ordered ? (
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-pill border border-blue-100 bg-white text-small font-bold text-blue-600 tabular"
                >
                  {i + 1}
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="font-semibold text-(--surface-heading)">
                  <InlineText text={item.term[locale]} />
                </p>
                <p className="mt-1 text-small text-slate-600">
                  <InlineText text={item.text[locale]} />
                </p>
              </div>
            </li>
          ))}
        </List>
      );
    }

    case 'figure':
      if (!imageVisible(block.image, locale)) return null;
      return (
        <figure>
          <MediaFrame
            image={block.image}
            locale={locale}
            sizes="(min-width: 1024px) 720px, 100vw"
            placeholderIcon={ImageIcon}
          />
          {block.caption ? <figcaption className="mt-3 text-small text-slate-600">{block.caption[locale]}</figcaption> : null}
        </figure>
      );

    case 'gallery': {
      const items = block.items.filter((item) => imageVisible(item.image, locale));
      if (items.length === 0) return null;
      return (
        <figure>
          <ul className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <li key={item.image.src}>
                <MediaFrame
                  image={item.image}
                  locale={locale}
                  ratio="4 / 3"
                  sizes="(min-width: 1024px) 360px, 50vw"
                  placeholderIcon={ImageIcon}
                />
                <p className="mt-2 text-small font-medium text-(--surface-heading)">{item.label[locale]}</p>
              </li>
            ))}
          </ul>
          {block.caption ? <figcaption className="mt-3 text-small text-slate-600">{block.caption[locale]}</figcaption> : null}
        </figure>
      );
    }

    case 'callout': {
      const tip = block.tone === 'tip';
      const Icon = tip ? Lightbulb : TriangleAlert;
      return (
        <div
          className={cn(
            'flex gap-3 rounded-md border-l-4 p-4',
            tip ? 'border-blue-600 bg-blue-50' : 'border-orange-700 bg-orange-50',
          )}
        >
          <Icon
            aria-hidden="true"
            size={20}
            strokeWidth={1.75}
            className={cn('mt-0.5 shrink-0', tip ? 'text-blue-600' : 'text-orange-700')}
          />
          <p>
            <strong className={cn('mr-1.5', tip ? 'text-blue-600' : 'text-orange-700')}>
              {tip ? labels.tip : labels.warning}:
            </strong>
            <InlineText text={block.text[locale]} />
          </p>
        </div>
      );
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-orange-500 pl-5 text-lead text-(--surface-heading)">
          <InlineText text={block.text[locale]} />
        </blockquote>
      );

    case 'claim':
      return <ClaimParagraph id={block.id} locale={locale} />;

    case 'steps':
      // Bước luôn nằm trong mục (SectionView) để có #id trong mục lục; ở phần mở bài thì không hỗ trợ.
      return null;
  }
}
