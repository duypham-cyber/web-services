'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import type { LeadType } from '@/lib/leads/rules';
import { fmt, isInAppBrowser, readFilmTier, saveDraft, scrollToAndFocus, takeDraft, track, uuidV4 } from './client-utils';
import { postLead, type LeadClientErrorCode } from './submit';
import type { LeadFormBaseProps } from './types';
import { useTurnstile } from './useTurnstile';
import { captureUtm, readUtm } from './utm';
import { errorFromDetail, validateAll, type FieldError, type FieldErrors } from './validation';

type Status = 'idle' | 'submitting' | 'done' | 'disabled';

const noopSubscribe = () => () => {};

export type NoticeState = {
  tone: 'error' | 'info';
  code: LeadClientErrorCode | 'CONSENT_RESTORED' | 'CAPTCHA_PENDING';
  minutes?: number;
  correlationCode?: string;
  webview?: boolean;
};

type Options<V extends Record<string, unknown>, K extends keyof V & string> = {
  type: LeadType;
  base: LeadFormBaseProps;
  empty: V;
  order: readonly K[];
  validateField: (field: K, values: V) => FieldError | null;
  buildFields: (values: V) => Record<string, unknown>;
  /** Giá trị khôi phục sau 409 (dữ liệu sessionStorage là không tin cậy → hàm này lọc kiểu). */
  restore: (saved: Record<string, unknown>) => Partial<V>;
  /** Thuộc tính analytics thêm (intent của B2B). */
  analytics: () => Record<string, string>;
  /** Neo trong trang dẫn tới form: hash → việc phụ (vd đổi intent). Link có hash này được chặn để cuộn tới form. */
  anchors: Record<string, (() => void) | null>;
  firstFieldId: string;
  /** Link tới neo được bấm TRƯỚC khi form tải xong (LazyLeadForm): áp việc phụ của neo rồi cuộn + focus ô đầu. */
  activation?: { hash: string } | null;
};

/**
 * Luồng chung của form lead (contracts/lead-b2b.md mục 3.1, Rule 7, Rule 11; docs/SRS-LEADS.md mục 5–7):
 * kiểm inline → Turnstile → POST với Idempotency-Key → cảm ơn tại chỗ / lỗi đúng mã / khối liên hệ khi 503.
 */
export function useLeadForm<V extends Record<string, unknown>, K extends keyof V & string>(opts: Options<V, K>) {
  const { type, base } = opts;
  const [values, setValues] = useState<V>(opts.empty);
  const valuesRef = useRef<V>(opts.empty);
  const [errors, setErrors] = useState<FieldErrors<K>>({});
  const [purposes, setPurposes] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  // false ở server và lúc hydrate, true sau đó → nút gửi chỉ bật khi JS đã chạy
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [doneHeight, setDoneHeight] = useState<number | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  const blockRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<string | null>(null);
  const newKeyOnEdit = useRef(false);
  const busyRef = useRef(false);
  const focusTarget = useRef<'field' | 'notice'>('field');
  const optsRef = useRef(opts);
  useLayoutEffect(() => {
    optsRef.current = opts;
  });

  const turnstile = useTurnstile(base.turnstileSiteKey, type, base.locale);

  /** Rule 7: sửa dữ liệu sau một lỗi 4xx → lần gửi sau dùng Idempotency-Key mới. */
  const markEdited = () => {
    if (newKeyOnEdit.current) {
      keyRef.current = null;
      newKeyOnEdit.current = false;
    }
  };

  const setValue = useCallback(<F extends K>(field: F, value: V[F]) => {
    markEdited();
    const next = { ...valuesRef.current, [field]: value };
    valuesRef.current = next;
    setValues(next);
    // Ô đang báo lỗi: kiểm lại ngay để lỗi biến mất khi đã sửa đúng
    setErrors((errs) => {
      if (!errs[field]) return errs;
      const e = optsRef.current.validateField(field, next);
      const copy = { ...errs };
      if (e) copy[field] = e;
      else delete copy[field];
      return copy;
    });
  }, []);

  /** Rời ô: báo lỗi định dạng ngay (ô còn trống thì đợi tới lúc bấm Gửi mới báo "bắt buộc"). */
  const onBlurField = useCallback((field: K) => {
    const current = valuesRef.current;
    const raw = current[field];
    const empty = Array.isArray(raw) ? raw.length === 0 : String(raw ?? '').trim() === '';
    setErrors((errs) => {
      if (empty && !errs[field]) return errs;
      const e = optsRef.current.validateField(field, current);
      const copy = { ...errs };
      if (e) copy[field] = e;
      else delete copy[field];
      return copy;
    });
  }, []);

  const togglePurpose = useCallback((code: string, checked: boolean) => {
    markEdited();
    setPurposes((prev) => ({ ...prev, [code]: checked }));
    if (checked) {
      setErrors((errs) => {
        if (!errs.consent) return errs;
        const copy = { ...errs };
        delete copy.consent;
        return copy;
      });
    }
  }, []);

  const requestFocus = (target: 'field' | 'notice') => {
    focusTarget.current = target;
    setFocusTick((n) => n + 1);
  };

  useEffect(() => {
    if (focusTick === 0) return;
    if (focusTarget.current === 'notice') {
      noticeRef.current?.focus();
      return;
    }
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? noticeRef.current)?.focus();
  }, [focusTick]);

  // Hydrate xong: bật nút gửi, ghi utm lúc vào site, khôi phục dữ liệu sau 409, đọc neo của URL (vd #dat-lich-demo)
  useEffect(() => {
    captureUtm();
    const saved = takeDraft(type);
    if (saved) {
      const next = { ...valuesRef.current, ...optsRef.current.restore(saved) };
      valuesRef.current = next;
      setValues(next);
      setNotice({ tone: 'info', code: 'CONSENT_RESTORED' });
    }
    const applyHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash in optsRef.current.anchors) optsRef.current.anchors[hash]?.();
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [type]);

  // Link "Nhận báo giá" (header, thanh dính đáy, CTA trong trang) trỏ tới neo của form: cuộn tới form của CHÍNH trang
  // này thay vì sang trang khác (SRS mục 4). Next Link bỏ qua điều hướng khi click đã bị preventDefault.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href*="#"]') : null;
      if (!a || (a.target && a.target !== '_self')) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const hash = decodeURIComponent(url.hash.slice(1));
      if (!(hash in optsRef.current.anchors)) return;
      const block = blockRef.current;
      if (!block) return;
      e.preventDefault();
      optsRef.current.anchors[hash]?.();
      const field = block.querySelector<HTMLElement>(`#${optsRef.current.firstFieldId}`);
      const heading = block.querySelector<HTMLElement>('h3[tabindex="-1"]');
      scrollToAndFocus(block, field ?? heading);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!opts.activation) return;
    const o = optsRef.current;
    o.anchors[opts.activation.hash]?.();
    const block = blockRef.current;
    if (block) scrollToAndFocus(block, block.querySelector<HTMLElement>(`#${o.firstFieldId}`));
  }, [opts.activation]);

  /** Lần tương tác đầu tiên với form → mới tải Turnstile. */
  const onFirstInteraction = turnstile.start;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busyRef.current) return;
    const o = optsRef.current;

    const values = valuesRef.current;
    const errs = validateAll(o.order, values, o.validateField);
    const missingConsent = base.consent.purposes.some((p) => p.required && purposes[p.code] !== true);
    if (missingConsent) errs.consent = { key: 'requiredConsent' };
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setNotice({ tone: 'error', code: 'CLIENT_VALIDATION' });
      track('lead_error', { type, code: 'CLIENT_VALIDATION' });
      requestFocus('field');
      return;
    }

    busyRef.current = true;
    setStatus('submitting');
    setNotice(null);
    try {
      const token = await turnstile.getToken();
      if (!token) {
        setNotice({ tone: 'error', code: 'CAPTCHA_PENDING', webview: isInAppBrowser() });
        track('lead_error', { type, code: 'CAPTCHA_FAILED' });
        setStatus('idle');
        requestFocus('notice');
        return;
      }

      keyRef.current ??= uuidV4();
      const body = {
        type,
        fields: o.buildFields(values),
        consent: { version: base.consent.version, purposes: base.consent.purposes.filter((p) => purposes[p.code]).map((p) => p.code) },
        utm: readUtm(),
        pagePath: window.location.pathname,
        locale: base.locale,
        filmTier: readFilmTier(),
        hp: hpRef.current?.value ?? '',
        turnstileToken: token,
      };
      const out = await postLead(base.endpoint, body, keyRef.current);

      if (out.ok) {
        if (!out.replayed) {
          track('lead_submit', { type, locale: base.locale, filmTier: readFilmTier() ?? 'none', ...o.analytics() });
        }
        setDoneHeight(formRef.current?.offsetHeight ?? null);
        setReference(out.reference);
        setStatus('done');
        keyRef.current = null;
        return;
      }

      turnstile.reset();
      track('lead_error', { type, code: out.code });
      const clientError = out.status >= 400 && out.status < 500;
      if (clientError) newKeyOnEdit.current = true;

      switch (out.code) {
        case 'LEADS_DISABLED':
          setStatus('disabled');
          return;
        case 'CONSENT_VERSION_OUTDATED':
          setStatus('idle');
          setNotice({ tone: 'info', code: out.code });
          requestFocus('notice');
          if (saveDraft(type, values)) window.setTimeout(() => window.location.reload(), 1500);
          return;
        case 'VALIDATION_ERROR':
        case 'CONSENT_REQUIRED': {
          const mapped: FieldErrors<K> = {};
          for (const d of out.details) {
            const m = errorFromDetail(d.field, d.code);
            if (m && (m.field === 'consent' || (o.order as readonly string[]).includes(m.field))) {
              mapped[m.field as K | 'consent'] = m.error;
            }
          }
          setErrors(mapped);
          setStatus('idle');
          setNotice({ tone: 'error', code: out.code });
          requestFocus(Object.keys(mapped).length > 0 ? 'field' : 'notice');
          return;
        }
        default:
          setStatus('idle');
          setNotice({
            tone: 'error',
            code: out.code,
            minutes: out.retryAfterSec ? Math.max(1, Math.ceil(out.retryAfterSec / 60)) : 10,
            correlationCode: out.correlationId.replace(/-/g, '').slice(0, 8).toUpperCase(),
          });
          requestFocus('notice');
      }
    } finally {
      busyRef.current = false;
    }
  };

  /** Câu của thông báo cấp form. */
  const noticeText = (n: NoticeState): string => {
    const c = base.copy;
    if (n.code === 'CAPTCHA_PENDING') return c.form.verifyPending;
    if (n.code === 'CONSENT_RESTORED') return c.errors.CONSENT_RESTORED;
    return fmt(c.errors[n.code], {
      phone: base.contact.phoneDisplay,
      minutes: n.minutes ?? 10,
      code: n.correlationCode ?? '',
    });
  };

  return {
    values,
    setValue,
    onBlurField,
    errors,
    purposes,
    togglePurpose,
    status,
    notice,
    noticeText,
    reference,
    hydrated,
    doneHeight,
    onFirstInteraction,
    onSubmit,
    blockRef,
    formRef,
    noticeRef,
    hpRef,
    turnstileRef: turnstile.containerRef,
    turnstileStatus: turnstile.status,
  };
}
