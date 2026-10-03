'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile, render tường minh (contracts/lead-b2b.md mục 6.5):
 * - script challenges.cloudflare.com CHỈ tải ở lần tương tác đầu tiên với form (`start()` gọi từ focusin/pointerdown),
 *   không tải lúc vào trang → không ảnh hưởng LCP/TBT, không có trong HTML (cổng budgets thirdParty);
 * - action = type ('lead_b2b' | 'lead_technician'), refresh-expired 'auto';
 * - sau mọi phản hồi khác 2xx: `reset()` (token dùng một lần).
 * Khung chứa widget có chiều cao đặt sẵn (CSS ở LeadFormParts → TurnstileSlot) để không gây CLS:
 * < 640px dùng kích thước 'compact' (150×140), từ 640px dùng 'flexible' (rộng 100%, cao 65).
 */
type TurnstileOptions = {
  sitekey: string;
  action: string;
  language: string;
  size: 'compact' | 'flexible';
  'refresh-expired': 'auto';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => boolean;
};

type TurnstileApi = {
  render: (el: HTMLElement, options: TurnstileOptions) => string | undefined;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_WIDE_QUERY = '(min-width: 640px)';

let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile_missing')));
    s.onerror = () => {
      loading = null;
      s.remove();
      reject(new Error('turnstile_load_failed'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type TurnstileStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useTurnstile(siteKey: string, action: string, language: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const waitersRef = useRef<((token: string | null) => void)[]>([]);
  const startedRef = useRef(false);
  const [status, setStatus] = useState<TurnstileStatus>('idle');

  const flush = (token: string | null) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    for (const w of waiters) w(token);
  };

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus('loading');
    loadTurnstile()
      .then((api) => {
        const el = containerRef.current;
        if (!el) return;
        const id = api.render(el, {
          sitekey: siteKey,
          action,
          language,
          size: window.matchMedia(TURNSTILE_WIDE_QUERY).matches ? 'flexible' : 'compact',
          'refresh-expired': 'auto',
          callback: (token) => {
            tokenRef.current = token;
            flush(token);
          },
          'expired-callback': () => {
            tokenRef.current = null;
          },
          'error-callback': () => {
            tokenRef.current = null;
            flush(null);
            return true; // đã xử lý: không để Turnstile ném lỗi ra console
          },
        });
        widgetRef.current = id ?? null;
        setStatus('ready');
      })
      .catch(() => {
        startedRef.current = false; // cho phép thử tải lại ở lần tương tác sau
        setStatus('error');
        flush(null);
      });
  }, [siteKey, action, language]);

  /** Token hiện có, hoặc đợi tối đa `timeoutMs` (widget đang giải). null = không có token (lỗi/hết giờ). */
  const getToken = useCallback(
    (timeoutMs = 15_000): Promise<string | null> => {
      if (tokenRef.current) return Promise.resolve(tokenRef.current);
      start();
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          waitersRef.current = waitersRef.current.filter((w) => w !== done);
          resolve(null);
        }, timeoutMs);
        const done = (token: string | null) => {
          window.clearTimeout(timer);
          resolve(token);
        };
        waitersRef.current.push(done);
      });
    },
    [start],
  );

  /** Token đã dùng hoặc bị server từ chối → xin token mới. */
  const reset = useCallback(() => {
    tokenRef.current = null;
    if (window.turnstile && widgetRef.current) window.turnstile.reset(widgetRef.current);
  }, []);

  useEffect(
    () => () => {
      if (window.turnstile && widgetRef.current) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    },
    [],
  );

  return { containerRef, status, start, getToken, reset };
}
