import test from 'ava';
import Insight from '../lib';

const pkg = 'yeoman';
const ver = '0.0.0';
const code = 'GA-1234567-1';
const ts = Date.UTC(2013, 7, 24, 22, 33, 44);
const pageviewPayload = {
	path: '/test/path',
	type: 'pageview'
};

const insight = new Insight({
	trackingCode: code,
	trackingProvider: 'yandex',
	packageName: pkg,
	packageVersion: ver
});

test('form valid request', async t => {
	const request = require('request');

	// Test querystrings
	const reqObj = insight._getRequestObj(ts, pageviewPayload);
	const _qs = reqObj.qs;

	t.is(_qs['page-url'], `http://${pkg}.insight/test/path?version=${ver}`);
	t.is(_qs['browser-info'], `i:20130824223344:z:0:t:${pageviewPayload.path}`);

	// Test cookie
	await request(reqObj);

	// Cookie string looks like:
	// [{"key":"name","value":"yandexuid",
	// 	"extensions":["value=80579748502"],"path":"/","creation":...
	const cookieClientId = reqObj.jar.getCookies(reqObj.url)[0].extensions[0].split('=')[1];
	t.is(Number(cookieClientId), Number(insight.clientId));
});
