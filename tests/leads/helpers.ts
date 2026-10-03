/**
 * Hạ tầng cho test tích hợp form lead (npm run test:leads): Postgres test THẬT (DATABASE_URL_TEST*), máy chủ siteverify
 * giả và SMTP giả trên 127.0.0.1 (cổng ngẫu nhiên). Không mock DB.
 */
import { createServer as createHttpServer, type Server } from 'node:http';
import { createServer as createNetServer, type AddressInfo, type Server as NetServer } from 'node:net';
import pg from 'pg';

export const DB = {
  app: process.env.DATABASE_URL_TEST ?? '',
  owner: process.env.DATABASE_URL_TEST_OWNER ?? '',
  ops: process.env.DATABASE_URL_TEST_OPS ?? '',
};
export const HAS_DB = Boolean(DB.app && DB.owner && DB.ops);

let ownerPool: pg.Pool | null = null;
export function owner(): pg.Pool {
  ownerPool ??= new pg.Pool({ connectionString: DB.owner, max: 2 });
  return ownerPool;
}
export async function closeOwner() {
  await ownerPool?.end();
  ownerPool = null;
}
export async function truncate() {
  await owner().query('TRUNCATE leads CASCADE');
}
export async function countRows(): Promise<{ leads: number; notifications: number }> {
  const { rows } = await owner().query<{ leads: number; notifications: number }>(
    'SELECT (SELECT count(*)::int FROM leads) AS leads, (SELECT count(*)::int FROM lead_notifications) AS notifications',
  );
  return rows[0] ?? { leads: 0, notifications: 0 };
}

const listen = <T extends Server | NetServer>(server: T) =>
  new Promise<number>((resolve) => server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)));
const closeServer = (server: Server | NetServer) => new Promise<void>((resolve) => server.close(() => resolve()));

/**
 * siteverify giả. Token quyết định kết quả:
 *   ok:<action> → success, hostname lapdattoanquoc.vn, action <action> · host:<action> → hostname evil.example
 *   testkey → success như khóa test thật (hostname example.com, không action, metadata.result_with_testing_key)
 *   bad → invalid-input-response · spent → timeout-or-duplicate · 500 → HTTP 500 · slow → không trả lời (timeout)
 */
export async function startSiteverify() {
  const bodies: Record<string, unknown>[] = [];
  const server = createHttpServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw || '{}') as { response?: string; secret?: string; remoteip?: string };
      bodies.push(body);
      const token = body.response ?? '';
      const send = (status: number, payload: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(payload));
      };
      if (token === 'slow') return; // để client tự timeout
      if (token === '500') return send(500, {});
      if (token === 'bad') return send(200, { success: false, 'error-codes': ['invalid-input-response'] });
      if (token === 'spent') return send(200, { success: false, 'error-codes': ['timeout-or-duplicate'] });
      if (token === 'testkey') {
        return send(200, { success: true, hostname: 'example.com', 'error-codes': [], metadata: { result_with_testing_key: true } });
      }
      const [kind, action] = token.split(':');
      if (kind === 'ok') return send(200, { success: true, hostname: 'lapdattoanquoc.vn', action, 'error-codes': [] });
      if (kind === 'host') return send(200, { success: true, hostname: 'evil.example', action, 'error-codes': [] });
      return send(200, { success: false, 'error-codes': ['invalid-input-response'] });
    });
  });
  const port = await listen(server);
  return {
    url: `http://127.0.0.1:${port}/siteverify`,
    bodies,
    close: () => {
      server.closeAllConnections();
      return closeServer(server);
    },
  };
}

export type CapturedMail = { from: string; to: string[]; data: string };

/** SMTP giả tối thiểu (EHLO/MAIL/RCPT/DATA/QUIT, không TLS, không auth) — đủ cho nodemailer gửi thật qua socket. */
export async function startSmtp() {
  const messages: CapturedMail[] = [];
  const server = createNetServer((socket) => {
    let buffer = '';
    let inData = false;
    let current: CapturedMail = { from: '', to: [], data: '' };
    socket.write('220 fake-smtp ESMTP\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      for (;;) {
        if (inData) {
          const end = buffer.indexOf('\r\n.\r\n');
          if (end === -1) return;
          current.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          messages.push(current);
          current = { from: '', to: [], data: '' };
          inData = false;
          socket.write('250 OK queued\r\n');
          continue;
        }
        const nl = buffer.indexOf('\r\n');
        if (nl === -1) return;
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') socket.write('250-fake-smtp\r\n250 8BITMIME\r\n');
        else if (cmd === 'MAIL') {
          current.from = line;
          socket.write('250 OK\r\n');
        } else if (cmd === 'RCPT') {
          current.to.push(line);
          socket.write('250 OK\r\n');
        } else if (cmd === 'DATA') {
          inData = true;
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
        } else if (cmd === 'QUIT') {
          socket.end('221 Bye\r\n');
        } else if (cmd === 'RSET' || cmd === 'NOOP') socket.write('250 OK\r\n');
        else socket.write('502 Not implemented\r\n');
      }
    });
    socket.on('error', () => {});
  });
  const port = await listen(server);
  return { port, messages, close: () => closeServer(server) };
}

/** Một cổng loopback chắc chắn đóng (mở rồi đóng ngay) — giả lập SMTP sập. */
export async function closedPort(): Promise<number> {
  const server = createNetServer();
  const port = await listen(server);
  await closeServer(server);
  return port;
}

/** Giải mã tiêu đề MIME (=?UTF-8?Q?…?= / =?UTF-8?B?…?=) để kiểm nội dung tiêu đề email. */
export function decodeMimeHeader(value: string): string {
  return value
    .replace(/\?=\s+=\?/g, '?==?')
    .replace(/=\?UTF-8\?([QB])\?([^?]*)\?=/gi, (_m, enc: string, text: string) => {
      if (enc.toUpperCase() === 'B') return Buffer.from(text, 'base64').toString('utf8');
      const bytes = text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_x, h: string) => String.fromCharCode(parseInt(h, 16)));
      return Buffer.from(bytes, 'latin1').toString('utf8');
    });
}

export function headerOf(raw: string, name: string): string {
  const unfolded = raw.split(/\r?\n\r?\n/)[0]?.replace(/\r?\n[ \t]+/g, ' ') ?? '';
  const line = unfolded.split(/\r?\n/).find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line ? decodeMimeHeader(line.slice(name.length + 1).trim()) : '';
}

/** Nội dung đã giải mã (base64 / quoted-printable) của mọi phần text trong email MIME, nối lại để tìm chuỗi. */
export function mailText(raw: string, only?: 'plain' | 'html'): string {
  const out: string[] = [];
  const parts = raw.split(/\r?\n--[^\r\n]+\r?\n/);
  for (const part of parts) {
    const sep = part.search(/\r?\n\r?\n/);
    if (sep === -1) continue;
    const head = part.slice(0, sep).replace(/\r?\n[ \t]+/g, ' ');
    if (!/content-type:\s*text\//i.test(head)) continue;
    if (only && !new RegExp(`content-type:\\s*text/${only}`, 'i').test(head)) continue;
    const body = part.slice(sep).replace(/^\s+/, '').replace(/\r?\n--[^\r\n]*--\s*$/, '');
    const enc = /content-transfer-encoding:\s*([\w-]+)/i.exec(head)?.[1]?.toLowerCase();
    if (enc === 'base64') out.push(Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8'));
    else if (enc === 'quoted-printable') {
      const bytes = body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_m, h: string) => String.fromCharCode(parseInt(h, 16)));
      out.push(Buffer.from(bytes, 'latin1').toString('utf8'));
    } else out.push(body);
  }
  return out.join('\n');
}
