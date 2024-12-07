import process from 'node:process';
import {execa} from 'execa';
import test from 'ava';

test('skip in TTY mode', async t => {
	const error = await t.throwsAsync(execa('node', ['./test/_sub-process.js']));
	t.is(error.exitCode, 145);
});

test('skip when using the --no-insight flag', async t => {
	const error = await t.throwsAsync(execa('node', ['./test/_sub-process.js', '--no-insight'], {
		stdio: 'inherit',
	}));
	t.is(error.exitCode, 145);
});

test('skip in CI mode', async t => {
	const {CI} = process.env;
	process.env.CI = true;

	const error = await t.throwsAsync(execa('node', ['./test/_sub-process.js'], {
		stdio: 'inherit',
	}));
	t.is(error.exitCode, 145);

	process.env.CI = CI;
});

test('skip after timeout', async t => {
	const {CI} = process.env;
	const {permissionTimeout} = process.env;

	process.env.CI = true;
	process.env.permissionTimeout = 0.1;

	const error = await t.throwsAsync(execa('node', ['./test/_sub-process.js'], {
		stdio: 'inherit',
	}));
	t.is(error.exitCode, 145);

	process.env.CI = CI;
	process.env.permissionTimeout = permissionTimeout;
});
