import qs from 'querystring'; // eslint-disable-line unicorn/prefer-node-protocol, no-restricted-imports
import {osInfo} from 'systeminformation';
import test from 'ava';
import Insight from '../lib/index.js';

const pkg = 'yeoman';
const ver = '0.0.0';
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
	packageName: pkg,
	packageVersion: ver,
});

const osName = async () => {
	const osData = await osInfo();
	return process.platform === 'darwin'
		? osData.codename
		: osData.distro;
};

test('form valid request for pageview', async t => {
	const requestObject = await insight._getRequestObj(ts, pageviewPayload);
	const _qs = qs.parse(requestObject.body);

	t.is(_qs.tid, code);
	t.is(Number(_qs.cid), Number(insight.clientId));
	t.is(_qs.dp, pageviewPayload.path);

	t.is(_qs.cd1, await osName());
	t.is(_qs.cd2, process.version);
	t.is(_qs.cd3, ver);
});

test('form valid request for eventTracking', async t => {
	const requestObject = await insight._getRequestObj(ts, eventPayload);
	const _qs = qs.parse(requestObject.body);

	t.is(_qs.tid, code);
	t.is(Number(_qs.cid), Number(insight.clientId));
	t.is(_qs.ec, eventPayload.category);
	t.is(_qs.ea, eventPayload.action);
	t.is(_qs.el, eventPayload.label);
	t.is(_qs.ev, eventPayload.value);
	t.is(_qs.cd1, await osName());
	t.is(_qs.cd2, process.version);
	t.is(_qs.cd3, ver);
});

/* eslint-disable ava/no-skip-test */
// Please see contributing.md
test.skip('should show submitted data in Real Time dashboard, see docs on how to manually test', () => {});
/* eslint-enable ava/no-skip-test */
