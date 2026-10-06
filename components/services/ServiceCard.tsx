import type { LucideIcon } from 'lucide-react';
import type { AppHref } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextLink } from '@/components/ui/TextLink';
import type { IllustrationKey } from '@/components/solutions/kit/illustrations';
import { MediaFrame } from '@/components/solutions/kit/MediaFrame';

type ServiceCardProps = {
  id: string;
  href: AppHref;
  icon: LucideIcon;
  illustration: IllustrationKey;
  title: string;
  body: string;
  cta: string;
  previewLabel?: string | null;
};

/** Thẻ dịch vụ ở hub /dich-vu: khung minh họa → tiêu đề → 1–2 dòng → link (cả thẻ bấm được). id = neo #<slug VI>. */
export function ServiceCard({ id, href, icon: Icon, illustration, title, body, cta, previewLabel }: ServiceCardProps) {
  return (
    <Card as="article" id={id} interactive padding="none" className="flex h-full scroll-mt-28 flex-col overflow-clip">
      <MediaFrame
        illustration={illustration}
        ratio="4/3"
        sizes="(min-width: 1280px) 300px, (min-width: 768px) 50vw, 100vw"
        className="rounded-none border-0 border-b border-blue-100"
        previewLabel={previewLabel}
      />
      <div className="flex flex-1 flex-col p-6">
        <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
          <Icon size={20} strokeWidth={1.5} />
        </span>
        <h3 className="mt-4 text-h3 text-navy-900">{title}</h3>
        <p className="mt-2 text-small text-slate-600">{body}</p>
        <TextLink href={href} variant="arrow" className="mt-auto pt-6 after:absolute after:inset-0 after:rounded-lg">
          {cta}
        </TextLink>
      </div>
    </Card>
  );
}
