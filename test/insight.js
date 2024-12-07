import {setTimeout as delay, setImmediate as setImmediatePromise} from 'node:timers/promises';
import sinon from 'sinon';
import test from 'ava';
import Insight from '../lib/index.js';

test('throw exception when trackingCode or packageName is not provided', t => {
	/* eslint-disable no-new */
	t.throws(() => {
		new Insight({});
	}, {instanceOf: Error});

	t.throws(() => {
		new Insight({trackingCode: 'xxx'});
	}, {instanceOf: Error});

	t.throws(() => {
		new Insight({packageName: 'xxx'});
	}, {instanceOf: Error});
	/* eslint-enable no-new */
});

test('forks a new tracker right after track()', async t => {
	const insight = newInsight();
	insight.track('test');

	await setImmediatePromise();

	t.deepEqual(forkedCalls(insight), [
		// A single fork with a single path
		['/test'],
	]);
});

test('only forks once if many pages are tracked in the same event loop run', async t => {
	const insight = newInsight();
	insight.track('foo');
	insight.track('bar');

	await setImmediatePromise();

	t.deepEqual(forkedCalls(insight), [
		// A single fork with both paths
		['/foo', '/bar'],
	]);
});

test('debounces forking every 100 millis (close together)', async t => {
	const insight = newInsight();
	insight.track('0');

	await delay(50);
	insight.track('50');

	await delay(50);
	insight.track('100');

	await delay(50);
	insight.track('150');

	await delay(50);
	insight.track('200');

	await delay(1000);

	t.deepEqual(forkedCalls(insight), [
		// The first one is sent straight away because of the leading debounce
		['/0'],
		// The others are grouped together because they're all < 100ms apart
		['/50', '/100', '/150', '/200'],
	]);
});

test('debounces forking every 100 millis (far apart)', async t => {
	const insight = newInsight();
	insight.track('0');

	await delay(50);
	insight.track('50');

	await delay(50);
	insight.track('100');

	await delay(50);
	insight.track('150');

	await delay(150);
	insight.track('300');

	await delay(50);
	insight.track('350');

	await delay(1000);

	t.deepEqual(forkedCalls(insight), [
		// Leading call
		['/0'],
		// Sent together since there is an empty 100ms window afterwards
		['/50', '/100', '/150'],
		// Sent on its own because it's a new leading debounce
		['/300'],
		// Finally, the last one is sent
		['/350'],
	]);
});

// Return a valid insight instance which doesn't actually send analytics (mocked)
function newInsight() {
	const insight = new Insight({
		trackingCode: 'xxx',
		packageName: 'yeoman',
		packageVersion: '0.0.0',
	});
	insight.optOut = false;
	insight._fork = sinon.stub();
	return insight;
}

// Returns all forked calls, and which paths were tracked in that fork
// This is handy to get a view of all forks at once instead of debugging 1 by 1
// [
//   ['/one', 'two'],       // first call tracked 2 paths
//   ['/three', 'four'],    // second call tracked 2 more paths
// ]
function forkedCalls(insight) {
	return insight._fork.args.map(callArguments =>
		Object.values(callArguments[0].queue).map(q => q.path),
	);
}
