import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { registerHooks, createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const nextServerUrl = pathToFileURL(require.resolve('next/server')).href;
const src = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next/server') return { url: nextServerUrl, shortCircuit: true };
    let candidate;
    if (specifier.startsWith('@/')) candidate = path.join(src, specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) candidate = fileURLToPath(new URL(specifier, context.parentURL));
    if (candidate && candidate.startsWith(src)) {
      for (const suffix of ['', '.ts', '.tsx']) {
        if (existsSync(candidate + suffix) && /\.tsx?$/.test(candidate + suffix)) return { url: pathToFileURL(candidate + suffix).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && fileURLToPath(url).startsWith(src) && /\.tsx?$/.test(url)) {
      return { format: 'module', source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

const { POST } = await import('../app/api/escrow/route.ts');
const { GET } = await import('../app/api/tax/bir2307/route.ts');
const { calculateTaxWithholding, generateBir2307Voucher } = await import('../lib/tax-calculator.ts');
const { calculateInspectionTimer, transitionMilestone } = await import('../lib/escrow-engine.ts');
const { scanMessageForDisintermediation } = await import('../lib/anti-scam-regex.ts');
const { InspectionTimer } = await import('../components/escrow/InspectionTimer.tsx');
const { BirTaxBreakdownModal } = await import('../components/tax/BirTaxBreakdownModal.tsx');
const { AntiScamBanner } = await import('../components/chat/AntiScamBanner.tsx');
const { useKugiStore } = await import('../lib/store.ts');
const milestone = { id: 'audit-m1', contractId: 'audit-c1', sequenceOrder: 1, title: 'Test', description: 'Audit', escrowDeposit: 10000, withholdingTax: 0, platformFee: 0, netDisbursement: 10000, status: 'ESCROW_LOCKED' };
const action = { type: 'SUBMIT_DELIVERABLE', deliverableFileName: 'audit.zip' };
const request = (body, headers = {}) => new Request('http://localhost/api/escrow', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const taxRequest = (params) => new Request(`http://localhost/api/tax/bir2307?${new URLSearchParams(params)}`);
const payee = { amount: '10000', payee: 'Audit Person', tin: '123-456-789-000' };

test('schema uniquely constrains both idempotency keys', () => {
  const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
  for (const model of ['Milestone', 'EscrowTransaction']) {
    const section = schema.match(new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`));
    assert.match(section[1], /idempotencyKey\s+String\??\s+@unique/);
  }
});

test('body key replays original transition and timestamp', async () => {
  const body = { action, currentMilestone: milestone, idempotencyKey: 'audit-body' };
  const first = await POST(request(body));
  const original = await first.json();
  const replay = await POST(request(body));
  const result = await replay.json();
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('X-Idempotency-Key'), body.idempotencyKey);
  assert.equal(replay.headers.get('X-Idempotency-Replay'), 'true');
  assert.equal(result.idempotentReplay, true);
  assert.deepEqual(result.milestone, original.milestone);
  assert.equal(result.timestamp, original.timestamp);
});

test('concurrent header-key submissions produce exactly one original response', async () => {
  const responses = await Promise.all(Array.from({ length: 20 }, () => POST(request({ action, currentMilestone: milestone }, { 'Idempotency-Key': 'audit-concurrent' }))));
  assert.equal(responses.filter((r) => r.headers.get('X-Idempotency-Replay') !== 'true').length, 1);
  const results = await Promise.all(responses.map((r) => r.json()));
  for (const result of results) assert.deepEqual(result.milestone, results[0].milestone);
});

test('distinct idempotency keys isolate milestone responses', async () => {
  for (const id of ['audit-one', 'audit-two']) {
    const response = await POST(request({ action, currentMilestone: { ...milestone, id }, idempotencyKey: id }));
    assert.equal((await response.json()).milestone.id, id);
    assert.equal(response.headers.get('X-Idempotency-Replay'), null);
  }
});

test('inspection submission starts 72 hours; revision and dispute clear deadline', () => {
  const submitted = transitionMilestone(milestone, action);
  assert.equal(submitted.status, 'UNDER_INSPECTION');
  assert.equal(Date.parse(submitted.inspectionEndAt) - Date.parse(submitted.deliverableSubmittedAt), 72 * 3600000);
  assert.equal(transitionMilestone(submitted, { type: 'REQUEST_REVISION', notes: 'Revise' }).inspectionEndAt, undefined);
  assert.equal(transitionMilestone(submitted, { type: 'FILE_DISPUTE', reason: 'Review' }).inspectionEndAt, undefined);
  assert.equal(calculateInspectionTimer(new Date(Date.now() - 1000).toISOString()).isExpired, true);
});

test('sticky ribbon clears fixed 80px navigation and links to actual workroom details', () => {
  const markup = renderToStaticMarkup(React.createElement(InspectionTimer, { sticky: true, inspectionEndAt: new Date(Date.now() + 72 * 3600000).toISOString() }));
  assert.match(markup, /sticky top-20/);
  assert.match(markup, /72-Hour Inspection Pulse/);
  assert.match(markup, /href="#inspection-details"/);
  const workroom = readFileSync(new URL('../app/messages/[orderId]/page.tsx', import.meta.url), 'utf8');
  assert.match(workroom, /<InspectionTimer[^>]*\ssticky\s*\/>/);
  assert.match(workroom, /id="inspection-details"/);
  assert.match(workroom, /<BirTaxBreakdownModal/);
});

test('repeated suspicious scans stay deterministic and give educational guidance', () => {
  for (let i = 0; i < 5; i++) {
    for (const message of ['Call 09178421920', 'direct gcash', 'telegram @daryl_dev']) {
      const result = scanMessageForDisintermediation(message);
      assert.equal(result.isSuspicious, true);
      assert.match(result.warningMessage, /Safety tip/);
      assert.doesNotMatch(result.warningMessage, /void|violate|100%/i);
    }
  }
  assert.equal(scanMessageForDisintermediation('The blueprint is ready for review.').isSuspicious, false);
});

test('safety banner and live store give guidance without insurance promises', () => {
  useKugiStore.setState({ antiScamAlertTriggered: true, lastScamWarning: scanMessageForDisintermediation('direct gcash').warningMessage });
  const markup = renderToStaticMarkup(React.createElement(AntiScamBanner));
  assert.match(markup, /Kugi Safety Tip/);
  assert.match(useKugiStore.getState().lastScamWarning, /Safety tip/);
  const banner = readFileSync(new URL('../components/chat/AntiScamBanner.tsx', import.meta.url), 'utf8');
  assert.match(banner, /RA 11967/);
  assert.match(banner, /statutory rights still apply/);
  assert.doesNotMatch(markup, /100%|insured|void/i);
  useKugiStore.setState({ antiScamAlertTriggered: false, lastScamWarning: undefined });
});

test('tax applies 1 percent on the 50 percent base and rounds net to cents', () => {
  const tax = calculateTaxWithholding(10000);
  assert.equal(tax.withholdingTaxAmount, 50);
  assert.equal(tax.netFreelancerDisbursement, 9950);
  assert.equal(calculateTaxWithholding(100.01).netFreelancerDisbursement, 99.51);
});

test('declaration only exempts cumulative remittances at or below threshold', () => {
  assert.equal(calculateTaxWithholding(10000, 500000, true).withholdingTaxAmount, 0);
  assert.equal(calculateTaxWithholding(10000, 500001, true).withholdingTaxAmount, 50);
  assert.equal(calculateTaxWithholding(10000, 100000, false).withholdingTaxAmount, 50);
  for (const value of [NaN, Infinity, -1]) assert.throws(() => calculateTaxWithholding(value), RangeError);
});

test('modal exposes a labelled native dialog with editable payee details', () => {
  const markup = renderToStaticMarkup(React.createElement(BirTaxBreakdownModal, { grossAmount: 10000, freelancerName: payee.payee, tinNumber: payee.tin }));
  assert.match(markup, /<dialog[^>]*aria-labelledby="bir-tax-title"/);
  assert.match(markup, /1% on 50% = 0.5%/);
  assert.match(markup, /amount=10000/);
  assert.match(markup, /payee=Audit\+Person/);
  assert.match(markup, /not a signed Form 2307/);
});

test('dossier download preserves requested amount and payee, returns private attachment', async () => {
  const response = await GET(taxRequest(payee));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Disposition'), /attachment/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.voucher.payeeName, payee.payee);
  assert.equal(result.voucher.payeeTin, payee.tin);
  assert.equal(result.voucher.grossAmount, 10000);
  assert.equal(result.voucher.taxWithheld, 50);
  assert.equal(result.status, 'DRAFT');
});

test('legacy modal parameter names preserve amount and payee', async () => {
  const response = await GET(taxRequest({ grossAmount: '20000', payeeName: payee.payee, tin: payee.tin }));
  const result = await response.json();
  assert.equal(result.voucher.grossAmount, 20000);
  assert.equal(result.voucher.taxWithheld, 100);
  assert.equal(result.voucher.payeeName, payee.payee);
});

test('dossier rejects missing, negative, infinite and partly numeric inputs', async () => {
  for (const amount of ['', '-1', 'Infinity', '10abc', '0']) assert.equal((await GET(taxRequest({ ...payee, amount }))).status, 400);
  assert.equal((await GET(taxRequest({ ...payee, payee: '' }))).status, 400);
  assert.equal((await GET(taxRequest({ ...payee, tin: 'invalid' }))).status, 400);
});

test('draft dossiers have unique references and no fabricated payor TIN', () => {
  const create = () => generateBir2307Voucher(payee.payee, payee.tin, '', 10000, 50);
  const a = create();
  assert.notEqual(a.certificateNumber, create().certificateNumber);
  assert.match(a.certificateNumber, /^DRAFT-2307-/);
  assert.equal(a.payorTin, '');
});
