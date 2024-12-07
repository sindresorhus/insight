import process from 'node:process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import childProcess from 'node:child_process';
import {randomUUID} from 'node:crypto';
import osName from 'os-name';
import Conf from 'conf';
import chalk from 'chalk';
import debounce from 'lodash.debounce';
import inquirer from 'inquirer';
import providers from './providers.js';

const DEBOUNCE_MS = 100;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Insight {
	#queue = {};
	#permissionTimeout = 30;
	#debouncedSend;

	constructor(options = {}) {
		const {pkg: package_ = {}} = options;

		// Deprecated options
		// TODO: Remove these at some point in the future
		if (options.packageName) {
			package_.name = options.packageName;
		}

		if (options.packageVersion) {
			package_.version = options.packageVersion;
		}

		if (!options.trackingCode || !package_.name) {
			throw new Error('trackingCode and pkg.name required');
		}

		this.trackingCode = options.trackingCode;
		this.trackingProvider = options.trackingProvider ?? 'google';
		this.packageName = package_.name;
		this.packageVersion = package_.version ?? 'undefined';
		this.os = osName();
		this.nodeVersion = process.version;
		this.appVersion = this.packageVersion;
		this.config = options.config ?? new Conf({
			projectName: package_.name,
			configName: `insight-${this.packageName}`,
			defaults: {
				clientId: options.clientId ?? Math.floor(Date.now() * Math.random()),
			},
		});

		this.#debouncedSend = debounce(this.#send.bind(this), DEBOUNCE_MS, {leading: true});
	}

	get optOut() {
		return this.config.get('optOut');
	}

	set optOut(value) {
		this.config.set('optOut', value);
	}

	get clientId() {
		return this.config.get('clientId');
	}

	set clientId(value) {
		this.config.set('clientId', value);
	}

	#save() {
		setImmediate(() => {
			this.#debouncedSend();
		});
	}

	#send() {
		const pending = Object.keys(this.#queue).length;
		if (pending === 0) {
			return;
		}

		this._fork(this.#getPayload());
		this.#queue = {};
	}

	// For testing.
	_fork(payload) {
		// Extracted to a method so it can be easily mocked
		const cp = childProcess.fork(path.join(__dirname, 'push.js'), {silent: true});
		cp.send(payload);
		cp.unref();
		cp.disconnect();
	}

	#getPayload() {
		return {
			queue: {...this.#queue},
			packageName: this.packageName,
			packageVersion: this.packageVersion,
			trackingCode: this.trackingCode,
			trackingProvider: this.trackingProvider,
		};
	}

	// For testing.
	_getRequestObj(...arguments_) {
		return providers[this.trackingProvider].apply(this, arguments_);
	}

	track(...arguments_) {
		if (this.optOut) {
			return;
		}

		const path = '/' + arguments_.map(element =>
			String(element).trim().replace(/ /, '-'),
		).join('/');

		// Timestamp isn't unique enough since it can end up with duplicate entries
		this.#queue[`${Date.now()} ${randomUUID()}`] = {
			path,
			type: 'pageview',
		};
		this.#save();
	}

	trackEvent(options) {
		if (this.optOut) {
			return;
		}

		if (this.trackingProvider !== 'google') {
			throw new Error('Event tracking is supported only for Google Analytics');
		}

		if (!options?.category || !options?.action) {
			throw new Error('`category` and `action` required');
		}

		// Timestamp isn't unique enough since it can end up with duplicate entries
		this.#queue[`${Date.now()} ${randomUUID()}`] = {
			category: options.category,
			action: options.action,
			label: options.label,
			value: options.value,
			type: 'event',
		};

		this.#save();
	}

	async askPermission(message) {
		const defaultMessage = `May ${chalk.cyan(this.packageName)} anonymously report usage statistics to improve the tool over time?`;

		if (!process.stdout.isTTY || process.argv.includes('--no-insight') || process.env.CI) {
			return;
		}

		const prompt = inquirer.prompt({
			type: 'confirm',
			name: 'optIn',
			message: message ?? defaultMessage,
			default: true,
		});

		// Set a 30 sec timeout before giving up on getting an answer
		let permissionTimeout;
		const timeoutPromise = new Promise(resolve => {
			permissionTimeout = setTimeout(() => {
				// Stop listening for stdin
				prompt.ui.close();

				// Automatically opt out
				this.optOut = true;
				resolve(false);
			}, this.#permissionTimeout * 1000);
		});

		const promise = (async () => {
			const {optIn} = await prompt;

			// Clear the permission timeout upon getting an answer
			clearTimeout(permissionTimeout);

			this.optOut = !optIn;
			return optIn;
		})();

		// Return the result of the prompt if it finishes first otherwise default to the timeout's value.
		return Promise.race([promise, timeoutPromise]);
	}
}

export default Insight;
