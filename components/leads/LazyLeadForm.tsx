'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { hashOf } from './safe-decode';
import type { LeadB2BProps, LeadTechnicianProps } from './types';

/**
 * Tải form lead KHI CẦN (ngân sách JS tải đầu ≤ 170 KB gz/route, docs/04 NFR-PERF-06): mã form (~10 KB gz) là chunk import
 * động, KHÔNG nằm trong JS tải đầu của trang. Component này nhỏ, chỉ:
 * - hiện `placeholder` do server render (tiêu đề + Gọi · Zalo · email — cũng là trải nghiệm khi tắt JavaScript);
 * - tải form khi khối form còn cách màn hình ~1.200px (IntersectionObserver), khi người dùng chạm vào khối, khi URL có
 *   neo của form lúc vào trang, hoặc khi bấm link tới neo của form (header "Nhận báo giá", thanh dính đáy, CTA trong trang);
 * - với link tới neo: chặn điều hướng, tải xong mới cuộn + focus ô đầu (không cuộn tới khối còn đang đổi chiều cao).
 * Sau khi form đã tải, form tự xử lý neo (useLeadForm) và component này gỡ listener của mình.
 * KHÔNG tải sẵn lúc rảnh sau khi trang tải xong: cổng "trang chủ mobile trước khi cuộn ≤ 600 KB" đo cả 5 s sau load.
 */
type Common = {
  /** Neo trong trang dẫn tới form (không có dấu #). */
  anchors: string[];
  placeholder: ReactNode;
};

type LazyProps = Common &
  (
    | { kind: 'b2b'; formProps: LeadB2BProps }
    | { kind: 'technician'; formProps: LeadTechnicianProps }
    /** Form tắt: không tải gì, chỉ chặn link tới neo để cuộn tới khối liên hệ của CHÍNH trang này (không sang trang chủ). */
    | { kind: 'contact'; formProps?: undefined }
  );

type Activation = { hash: string } | null;
type FormComponent = ComponentType<(LeadB2BProps | LeadTechnicianProps) & { activation: Activation }>;

const LOAD_TIMEOUT_MS = 4000;

/** Neo (không dấu #) của link cùng origin vừa được bấm trái thường; null nếu không phải link cần xử lý. */
function anchorHash(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href*="#"]') : null;
  if (!a || (a.target && a.target !== '_self')) return null;
  try {
    const url = new URL(a.href, window.location.href);
    return url.origin === window.location.origin ? hashOf(url) : null;
  } catch {
    return null;
  }
}

function importForm(kind: 'b2b' | 'technician'): Promise<FormComponent> {
  return kind === 'b2b'
    ? import('./LeadFormB2B').then((m) => m.LeadFormB2B as FormComponent)
    : import('./LeadFormTechnician').then((m) => m.LeadFormTechnician as FormComponent);
}

export function LazyLeadForm(props: LazyProps) {
  const { kind, anchors } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<{ Component: FormComponent } | null>(null);
  const [activation, setActivation] = useState<Activation>(null);
  const loadingRef = useRef<Promise<void> | null>(null);

  const load = useCallback((): Promise<void> => {
    if (kind === 'contact') return Promise.resolve();
    loadingRef.current ??= importForm(kind)
      .then((Component) => setForm({ Component }))
      .catch(() => {
        loadingRef.current = null; // mạng lỗi: lần kích hoạt sau thử lại; placeholder vẫn có Gọi · email
      });
    return loadingRef.current;
  }, [kind]);

  const loaded = form !== null;

  useEffect(() => {
    if (kind !== 'contact') return;
    const hashes = new Set(anchors);
    const onClick = (e: MouseEvent) => {
      const hash = anchorHash(e);
      if (hash === null || !hashes.has(hash)) return;
      e.preventDefault();
      const root = rootRef.current;
      if (!root) return;
      root.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      root.querySelector<HTMLElement>('a[href], button')?.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [kind, anchors]);

  useEffect(() => {
    if (loaded || kind === 'contact') return;
    const root = rootRef.current;
    const hashes = new Set(anchors);
    if (hashes.has(hashOf(window.location))) void load();

    const io =
      'IntersectionObserver' in window && root
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) void load();
            },
            { rootMargin: '1200px 0px' },
          )
        : null;
    if (io && root) io.observe(root);
    else void load();

    const onInteract = () => void load();
    root?.addEventListener('focusin', onInteract);
    root?.addEventListener('pointerdown', onInteract);

    const onClick = (e: MouseEvent) => {
      const hash = anchorHash(e);
      if (hash === null || !hashes.has(hash)) return;
      e.preventDefault();
      const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, LOAD_TIMEOUT_MS));
      void Promise.race([load(), timeout]).then(() => {
        setActivation({ hash });
        // Form chưa tải được (mạng chậm/lỗi): vẫn cuộn tới khối (placeholder có Gọi · email)
        if (!loadingRef.current) rootRef.current?.scrollIntoView({ block: 'start' });
      });
    };
    document.addEventListener('click', onClick, true);

    return () => {
      io?.disconnect();
      root?.removeEventListener('focusin', onInteract);
      root?.removeEventListener('pointerdown', onInteract);
      document.removeEventListener('click', onClick, true);
    };
  }, [anchors, kind, load, loaded]);

  return (
    <div ref={rootRef} data-lead-root={kind === 'contact' ? 'contact' : loaded ? 'ready' : 'placeholder'}>
      {form && props.formProps ? <form.Component {...props.formProps} activation={activation} /> : props.placeholder}
    </div>
  );
}
