import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import ts from 'typescript';

registerHooks({
  load(url, context, next) {
    if (url.endsWith('.tsx')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText,
    };
    return next(url, context);
  },
});
const { computeSHA256 } = await import('./escrow/DeliverableUploader.tsx');
const { compressImage } = await import('./verification/PhilSysUploader.tsx');

function stub(t, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, value });
  t.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name]);
}

test('SHA-256 hashes actual bytes using known vectors', async () => {
  assert.equal(await computeSHA256(new File(['abc'], 'a')), 'sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await computeSHA256(new File([], 'empty')), 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const { createHash } = await import('node:crypto');
  const bytes = new Uint8Array([0, 255, 128, 10]);
  assert.equal(await computeSHA256(new File([bytes], 'binary')), 'sha256:' + createHash('sha256').update(bytes).digest('hex'));
});

test('hashing rejects oversized input before reading and unavailable Web Crypto', async t => {
  await assert.rejects(computeSHA256({ size: 200 * 1024 * 1024 + 1, arrayBuffer() { throw Error('must not read'); } }), /200MB/);
  stub(t, 'crypto', undefined);
  await assert.rejects(computeSHA256(new File(['a'], 'a')), /HTTPS/);
});

function browser(t, { sizes = [800000], type = 'image/jpeg', decodeError = false, context = true, nullBlob = false, readError = false, width = 4000, height = 2000 } = {}) {
  const calls = [], revoked = [], previews = [];
  t.mock.method(URL, 'createObjectURL', () => 'blob:test');
  t.mock.method(URL, 'revokeObjectURL', value => revoked.push(value));
  stub(t, 'Image', class {
    naturalWidth = width; naturalHeight = height;
    set src(value) { queueMicrotask(() => decodeError ? this.onerror() : this.onload()); }
  });
  stub(t, 'FileReader', class {
    readAsDataURL(blob) {
      previews.push(blob);
      this.result = 'data:image/jpeg;base64,test';
      queueMicrotask(() => readError ? this.onerror() : this.onload());
    }
  });
  const canvas = {
    width: 0, height: 0,
    getContext() { return context ? { fillRect() {}, drawImage() {} } : null; },
    toBlob(cb, mime, quality) {
      calls.push({ width: this.width, height: this.height, mime, quality });
      const size = sizes[Math.min(calls.length - 1, sizes.length - 1)];
      cb(nullBlob ? null : new Blob([new Uint8Array(size)], { type }));
    },
  };
  stub(t, 'document', { createElement() { return canvas; } });
  return { calls, revoked, previews };
}
const photo = () => new File([new Uint8Array(2000000)], 'id.png', { type: 'image/png' });

test('compression rejects exact 1MB, retries quality then dimensions, previews accepted blob', async t => {
  const state = browser(t, { sizes: [1500000, 1000000, 1000000, 900000] });
  const result = await compressImage(photo());
  assert.equal(result.blob.type, 'image/jpeg');
  assert.equal(result.compressedSize, 900000);
  assert.equal(result.width, 1440);
  assert.equal(result.height, 720);
  assert.equal(result.compressionRatioPercent, 55);
  assert.deepEqual(state.calls.map(c => c.quality), [0.85, 0.7, 0.55, 0.55]);
  assert.equal(state.previews[0], result.blob);
  assert.deepEqual(state.revoked, ['blob:test']);
});

test('small images retain dimensions', async t => {
  browser(t, { width: 400, height: 800, sizes: [1000] });
  const result = await compressImage(photo());
  assert.equal(result.width, 400);
  assert.equal(result.height, 800);
});

test('nonimages and empty inputs are rejected', async () => {
  await assert.rejects(compressImage(new File(['x'], 'x.pdf', { type: 'application/pdf' })), /non-empty image/);
  await assert.rejects(compressImage(new File([], 'x.png', { type: 'image/png' })), /non-empty image/);
});

for (const [name, options, message] of [
  ['decode failure', { decodeError: true }, /decoded/],
  ['missing canvas', { context: false }, /unavailable/],
  ['failed encoder', { nullBlob: true }, /encode/],
  ['unsupported JPEG', { type: 'image/png' }, /JPEG/],
  ['preview failure', { readError: true }, /preview/],
  ['oversized output', { sizes: [1000000] }, /below 1MB/],
]) {
  test('compression reports ' + name + ' and releases source URL', async t => {
    const state = browser(t, options);
    await assert.rejects(compressImage(photo()), message);
    assert.deepEqual(state.revoked, ['blob:test']);
    assert.ok(state.calls.length <= 12);
  });
}
