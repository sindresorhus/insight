import sinon from 'sinon';
import test from 'ava';
import Insight from '../lib/index.js';

const package_ = 'yeoman';
const version = '0.0.0';

let config;
let insight;

test.beforeEach(() => {
	config = {
		get: sinon.spy(() => true),
		set: sinon.spy(),
	};

	insight = new Insight({
		trackingCode: 'xxx',
		packageName: package_,
		packageVersion: version,
		config,
	});
});

test('access the config object for reading', t => {
	t.true(insight.optOut);
	t.true(config.get.called);
});

test('access the config object for writing', t => {
	const sentinel = {};
	insight.optOut = sentinel;
	t.true(config.set.calledWith('optOut', sentinel));
});
