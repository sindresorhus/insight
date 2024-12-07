import test from 'ava';
import {Cookie} from 'tough-cookie';
import Insight from '../lib/index.js';

const package_ = 'yeoman';
const version = '0.0.0';
const code = 'GA-1234567-1';
const ts = Date.UTC(2013, 7, 24, 22, 33, 44);
const pageviewPayload = {
	path: '/test/path',
	type: 'pageview',
};

const insight = new Insight({
	trackingCode: code,
	trackingProvider: 'yandex',
	packageName: package_,
	packageVersion: version,
});

test('form valid request', t => {
	const requestObject = insight._getRequestObj(ts, pageviewPayload);

	const _qs = Object.fromEntries(requestObject.searchParams);

	t.is(_qs['page-url'], `http://${package_}.insight/test/path?version=${version}`);
	t.is(_qs['browser-info'], `i:20130824223344:z:0:t:${pageviewPayload.path}`);

	const cookieHeader = requestObject.headers.Cookie;
	const cookie = Cookie.parse(cookieHeader);
	t.is(Number(cookie.value), Number(insight.clientId));
});
