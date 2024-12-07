import process from 'node:process';
import osName from 'os-name';
import test from 'ava';
import Insight from '../lib/index.js';

const package_ = 'yeoman';
const version = '0.0.0';
const code = 'GA-1234567-1';
const ts = Date.UTC(2013, 7, 24, 22, 33, 44);
const pageviewPayload = {
	path: '/test/path',
	type: 'pageview',
};
const eventPayload = {
	category: 'category',
	action: 'action',
	label: 'label',
	value: 'value',
	type: 'event',
};

const insight = new Insight({
	trackingCode: code,
	packageName: package_,
	packageVersion: version,
});

test('form valid request for pageview', t => {
	const requestObject = insight._getRequestObj(ts, pageviewPayload);
	const parameters = new URLSearchParams(requestObject.body);

	t.is(parameters.get('tid'), code);
	t.is(Number(parameters.get('cid')), Number(insight.clientId));
	t.is(parameters.get('dp'), pageviewPayload.path);
	t.is(parameters.get('cd1'), osName());
	t.is(parameters.get('cd2'), process.version);
	t.is(parameters.get('cd3'), version);
});

test('form valid request for eventTracking', t => {
	const requestObject = insight._getRequestObj(ts, eventPayload);
	const parameters = new URLSearchParams(requestObject.body);

	t.is(parameters.get('tid'), code);
	t.is(Number(parameters.get('cid')), Number(insight.clientId));
	t.is(parameters.get('ec'), eventPayload.category);
	t.is(parameters.get('ea'), eventPayload.action);
	t.is(parameters.get('el'), eventPayload.label);
	t.is(parameters.get('ev'), eventPayload.value);
	t.is(parameters.get('cd1'), osName());
	t.is(parameters.get('cd2'), process.version);
	t.is(parameters.get('cd3'), version);
});

/* eslint-disable ava/no-skip-test */
// Please see contributing.md
test.skip('should show submitted data in Real Time dashboard, see docs on how to manually test', () => {});
/* eslint-enable ava/no-skip-test */
