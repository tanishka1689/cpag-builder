/**
 * Stamp published HTML so View Source starts like Framer:
 *
 *   <!DOCTYPE html>
 *   <!-- Made in CPAG · cpag.in -->
 *   <!-- Published … -->
 *   <html>
 *
 * React cannot emit comment nodes before `<html>`, so we insert them on
 * the Node HTTP response. Next.js gzip-compresses HTML first; we wrap
 * `write` after that middleware so we stamp uncompressed HTML and never
 * touch compressed bytes (rewriting gzip as UTF-8 blanks the page).
 */

import { Server, ServerResponse } from 'http';
import { rememberCPAGPublishedAt, stampHtmlDocument } from './cpag-html-comment';

const PUBLISHED_AT_REFRESH_MS = 30_000;
const PATCHED = Symbol.for('cpag.html-stamp');
const WRAPPED = Symbol.for('cpag.html-stamp-wrapped');

/** Load publish time in this isolate so the stamp can include the Published line. */
export async function startCPAGPublishedAtRefresh(): Promise<void> {
  const refresh = async () => {
    try {
      const { getSettingByKey } = await import('./repositories/settingsRepository');
      const value = await getSettingByKey('published_at');
      rememberCPAGPublishedAt(typeof value === 'string' ? value : null);
    } catch {
      rememberCPAGPublishedAt(null);
    }
  };

  await refresh();
  const timer = setInterval(() => {
    void refresh();
  }, PUBLISHED_AT_REFRESH_MS);
  timer.unref?.();
}

type WriteCallback = (error?: Error | null) => void;

type StampedResponse = ServerResponse & {
  [WRAPPED]?: boolean;
  __cpagStampState?: 'pending' | 'done' | 'skip';
  __cpagStampBuffer?: string;
};

function isBuilderOrAssetUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return (
    path.startsWith('/cpag')
    || path.startsWith('/_next')
    || path.startsWith('/api')
    || path.startsWith('/a/')
  );
}

function isGzipChunk(chunk: unknown): boolean {
  if (typeof chunk === 'string' || chunk == null) return false;
  const buf = Buffer.isBuffer(chunk)
    ? chunk
    : chunk instanceof Uint8Array
      ? Buffer.from(chunk)
      : null;
  return Boolean(buf && buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b);
}

function chunkToHtmlText(chunk: unknown, encoding?: BufferEncoding): string | null {
  if (typeof chunk === 'string') return chunk;
  if (isGzipChunk(chunk)) return null;
  if (Buffer.isBuffer(chunk)) return chunk.toString(encoding || 'utf8');
  if (chunk instanceof Uint8Array) return Buffer.from(chunk).toString(encoding || 'utf8');
  return null;
}

function shouldSkip(res: StampedResponse): boolean {
  if (res.__cpagStampState === 'skip' || res.__cpagStampState === 'done') {
    return true;
  }

  const req = res.req as { url?: string } | undefined;
  if (isBuilderOrAssetUrl(req?.url)) {
    res.__cpagStampState = 'skip';
    return true;
  }

  const contentType = res.getHeader('content-type');
  if (contentType && !String(contentType).includes('text/html')) {
    res.__cpagStampState = 'skip';
    return true;
  }

  return false;
}

function stampChunk(res: StampedResponse, chunk: unknown, encoding?: BufferEncoding): unknown {
  if (chunk === undefined || isGzipChunk(chunk) || shouldSkip(res)) {
    return chunk;
  }

  const text = chunkToHtmlText(chunk, encoding);
  if (text === null) {
    return chunk;
  }

  const combined = `${res.__cpagStampBuffer ?? ''}${text}`;
  const hasDoctype = /<!DOCTYPE html>/i.test(combined);
  const hasHtml = /<html\b/i.test(combined);

  if (!hasDoctype && !hasHtml) {
    // Only hold a split `<!DOCTYPE` prefix — never buffer unknown / compressed bytes.
    if (combined.length < 32 && /^\s*<!/i.test(combined)) {
      res.__cpagStampState = 'pending';
      res.__cpagStampBuffer = combined;
      return null;
    }
    const leftover = res.__cpagStampBuffer;
    res.__cpagStampState = 'skip';
    res.__cpagStampBuffer = undefined;
    return leftover ? combined : chunk;
  }

  res.__cpagStampState = 'done';
  res.__cpagStampBuffer = undefined;
  return stampHtmlDocument(combined);
}

/**
 * Stamping grows the document, so a Content-Length measured from the unstamped
 * HTML truncates the response. Vercel serves prerendered and ISR pages as a
 * single buffer with the header preset, so this path is the norm on cloud —
 * self-hosted streams SSR chunked and never hits it. Correct the header when
 * the whole body is known, otherwise drop it and let the response be chunked.
 */
function syncContentLength(res: StampedResponse, payload: unknown, isFinal: boolean): void {
  // Only a stamped body changed size; skipped and compressed responses must
  // keep the length the caller declared.
  if (res.__cpagStampState !== 'done') {
    return;
  }

  if (res.headersSent || res.getHeader('content-length') === undefined) {
    return;
  }

  if (isFinal && typeof payload === 'string') {
    res.setHeader('content-length', Buffer.byteLength(payload, 'utf8'));
    return;
  }

  res.removeHeader('content-length');
}

function flushBuffer(res: StampedResponse): string | undefined {
  const leftover = res.__cpagStampBuffer;
  res.__cpagStampBuffer = undefined;
  if (res.__cpagStampState === 'pending') {
    res.__cpagStampState = 'skip';
  }
  return leftover;
}

type LooseWrite = (
  chunk?: unknown,
  encodingOrCb?: BufferEncoding | WriteCallback,
  maybeCb?: WriteCallback,
) => boolean;

function callWrite(
  write: LooseWrite,
  chunk: unknown,
  encodingOrCb?: BufferEncoding | WriteCallback,
  maybeCb?: WriteCallback,
): boolean {
  if (typeof encodingOrCb === 'function') {
    return write(chunk, encodingOrCb);
  }
  if (typeof encodingOrCb === 'string' && maybeCb) {
    return write(chunk, encodingOrCb, maybeCb);
  }
  if (typeof encodingOrCb === 'string') {
    return write(chunk, encodingOrCb);
  }
  return write(chunk);
}

function wrapResponse(res: StampedResponse): void {
  if (res[WRAPPED] || res.writableEnded) {
    return;
  }
  res[WRAPPED] = true;

  const innerWrite = res.write.bind(res);
  const innerEnd = res.end.bind(res);

  res.write = function (
    chunk?: unknown,
    encodingOrCb?: BufferEncoding | WriteCallback,
    maybeCb?: WriteCallback,
  ) {
    const encoding = typeof encodingOrCb === 'string' ? encodingOrCb : undefined;
    const callback = typeof encodingOrCb === 'function' ? encodingOrCb : maybeCb;
    const stamped = stampChunk(this, chunk, encoding);

    if (stamped === null) {
      callback?.();
      return true;
    }

    syncContentLength(this, stamped, false);

    return callWrite(innerWrite as LooseWrite, stamped, encodingOrCb, maybeCb);
  };

  res.end = function (
    chunk?: unknown,
    encodingOrCb?: BufferEncoding | WriteCallback,
    maybeCb?: WriteCallback,
  ) {
    const encoding = typeof encodingOrCb === 'string' ? encodingOrCb : undefined;
    const callback = typeof encodingOrCb === 'function' ? encodingOrCb : maybeCb;
    const chunkIsCallback = typeof chunk === 'function';
    const hasChunk = chunk !== undefined && !chunkIsCallback;

    let payload: unknown;
    if (hasChunk) {
      const stamped = stampChunk(this, chunk, encoding);
      payload = stamped === null ? flushBuffer(this) : stamped;
    } else {
      payload = flushBuffer(this);
    }

    const endCb = chunkIsCallback ? chunk as WriteCallback : callback;

    syncContentLength(this, payload, true);

    if (payload === undefined) {
      if (endCb) {
        return innerEnd(endCb);
      }
      return innerEnd();
    }
    if (encoding && endCb) {
      return innerEnd(payload, encoding, endCb);
    }
    if (endCb) {
      return innerEnd(payload, endCb);
    }
    if (encoding) {
      return innerEnd(payload, encoding);
    }
    return innerEnd(payload);
  };
}

export function patchHtmlResponseStamp(): void {
  const proto = Server.prototype as typeof Server.prototype & {
    [PATCHED]?: boolean;
  };
  if (proto[PATCHED]) {
    return;
  }
  proto[PATCHED] = true;

  const originalEmit = proto.emit;
  proto.emit = function (this: Server, event: string | symbol, ...args: unknown[]) {
    if (event === 'request') {
      const res = args[1] as StampedResponse | undefined;
      // Next.js installs gzip on `write` synchronously in the request
      // listener. Wait until that finishes so we wrap the uncompressed side.
      queueMicrotask(() => {
        if (res) wrapResponse(res);
      });
    }
    return Reflect.apply(originalEmit, this, [event, ...args]);
  };
}
