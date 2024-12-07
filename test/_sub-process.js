import process from 'node:process';
import Insight from '../lib/index.js';

const insight = new Insight({
	packageName: 'yeoman',
	packageVersion: '0.0.0',
	trackingCode: 'GA-1234567-1',
});

if (process.env.permissionTimeout) {
	insight._permissionTimeout = process.env.permissionTimeout;
}

try {
	await insight.askPermission('');
	process.exit(145); // eslint-disable-line unicorn/no-process-exit
} catch (error) {
	console.error(error);
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
}
