import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCPAGHtmlComments,
  formatCPAGPublishedCommentDate,
  insertCPAGHtmlComments,
} from '@/lib/cpag-html-comment';

test('formats the published date in Framer-style UTC', () => {
  const date = new Date('2026-09-04T10:49:00.000Z');
  assert.equal(formatCPAGPublishedCommentDate(date), 'Sep 4, 2026, 10:49 AM UTC');
});

test('formats midnight and noon without a 0 hour', () => {
  assert.equal(
    formatCPAGPublishedCommentDate(new Date('2026-01-01T00:05:00.000Z')),
    'Jan 1, 2026, 12:05 AM UTC',
  );
  assert.equal(
    formatCPAGPublishedCommentDate(new Date('2026-12-31T12:00:00.000Z')),
    'Dec 31, 2026, 12:00 PM UTC',
  );
});

test('always emits the Made in CPAG comment', () => {
  const html = buildCPAGHtmlComments();
  assert.equal(html, '<!-- Made in CPAG · cpag.in -->');
});

test('adds a Published line when a timestamp is provided', () => {
  const html = buildCPAGHtmlComments('2026-09-04T10:49:00.000Z');
  assert.equal(
    html,
    '<!-- Made in CPAG · cpag.in -->\n<!-- Published Sep 4, 2026, 10:49 AM UTC -->',
  );
});

test('ignores invalid published timestamps', () => {
  assert.equal(buildCPAGHtmlComments('not-a-date'), '<!-- Made in CPAG · cpag.in -->');
});

test('inserts comments after doctype and before html', () => {
  const html = '<!DOCTYPE html><html lang="en"><head></head></html>';
  const stamped = insertCPAGHtmlComments(html, '2026-09-04T10:49:00.000Z');
  assert.equal(
    stamped,
    '<!DOCTYPE html>\n<!-- Made in CPAG · cpag.in -->\n<!-- Published Sep 4, 2026, 10:49 AM UTC -->\n<html lang="en"><head></head></html>',
  );
});

test('normalizes a doctype that already has a newline', () => {
  const html = '<!DOCTYPE html>\n<html lang="en">\n<head></head>\n</html>\n';
  const stamped = insertCPAGHtmlComments(html, '2026-09-04T10:49:00.000Z');
  assert.equal(
    stamped,
    '<!DOCTYPE html>\n<!-- Made in CPAG · cpag.in -->\n<!-- Published Sep 4, 2026, 10:49 AM UTC -->\n<html lang="en">\n<head></head>\n</html>\n',
  );
});

test('insert is idempotent', () => {
  const html = '<!DOCTYPE html><html><head></head></html>';
  const once = insertCPAGHtmlComments(html);
  assert.equal(insertCPAGHtmlComments(once), once);
});

test('inserts before html when doctype is missing', () => {
  const html = '<html><head></head></html>';
  const stamped = insertCPAGHtmlComments(html);
  assert.equal(
    stamped,
    '<!-- Made in CPAG · cpag.in -->\n<html><head></head></html>',
  );
});
