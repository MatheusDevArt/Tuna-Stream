import test from 'node:test';
import assert from 'node:assert/strict';
import { getDemoSnapshot } from '../src/data.js';
import { generateReport, getPreviousCompleteWeek, variation, getSuggestions, rate } from '../src/report.js';

test('weekly window is Monday through Sunday and excludes the current partial week', () => {
  assert.deepEqual(getPreviousCompleteWeek('2026-10-02'), { start: '2026-09-21', end: '2026-09-27' });
  assert.deepEqual(getPreviousCompleteWeek('2026-09-28'), { start: '2026-09-21', end: '2026-09-27' });
  assert.deepEqual(getPreviousCompleteWeek('2026-09-27'), { start: '2026-09-14', end: '2026-09-20' });
  assert.deepEqual(getPreviousCompleteWeek('2026-01-01'), { start: '2025-12-22', end: '2025-12-28' });
  assert.throws(() => getPreviousCompleteWeek('2026-02-31'));
});

test('zero and unavailable baselines never produce Infinity or invented percentages', () => {
  assert.equal(variation(12, 0), null);
  assert.equal(variation(0, 0), 0);
  assert.equal(variation(null, 10), null);
  assert.equal(variation(5, 10), -50);
  assert.equal(rate(5, 0), 0);
});

test('report clearly distinguishes illustrative metrics and has three evidence-based suggestions', () => {
  const snapshot = getDemoSnapshot('last-week');
  const text = generateReport(snapshot);
  assert.match(text, /DEMONSTRAÇÃO/);
  assert.match(text, /1\.248 visitas/);
  assert.match(text, /6,9%/);
  assert.equal(getSuggestions(snapshot.current).length, 3);
  assert.doesNotMatch(text, /Infinity|NaN|undefined/);
  assert.deepEqual(getSuggestions({ visits: 0, packages: [] }), []);
});

test('both fixtures have coherent funnel, follower, package and daily totals', () => {
  for (const id of ['last-week', 'previous-week']) {
    const { current, previous } = getDemoSnapshot(id);
    for (const week of [current, previous]) assert.equal(week.dailyVisits.reduce((sum, value) => sum + value, 0), week.visits);
    assert.equal(current.followersGained - current.followersLost, current.netFollowers);
    assert.equal(current.packages.reduce((sum, item) => sum + item.clicks, 0), current.packageClicks);
    assert.equal(current.packages.reduce((sum, item) => sum + item.whatsapp, 0), current.whatsappClicks);
    assert.ok(current.visits >= current.packagesReached && current.packagesReached >= current.packageClicks && current.packageClicks >= current.whatsappClicks);
  }
});
