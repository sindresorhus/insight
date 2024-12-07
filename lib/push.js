import process from 'node:process';
import ky from 'ky';
import Insight from './index.js';

// Messaged on each debounced `track()`
// Gets the queue, merges is with the previous and tries to upload everything
// If it fails, it will save everything again
process.on('message', async message => {
	const insight = new Insight(message);
	const {config} = insight;
	const queue = config.get('queue') ?? {};

	Object.assign(queue, message.queue);
	config.delete('queue');

	try {
		// Process queue items sequentially
		for (const element of Object.keys(queue)) {
			const [id] = element.split(' ');
			const payload = queue[element];

			const requestObject = insight._getRequestObj(id, payload);

			// Convert request options to ky format
			const kyOptions = {
				method: requestObject.method ?? 'GET',
				headers: requestObject.headers,
				body: requestObject.body,
				searchParams: requestObject.searchParams,
				retry: 0, // Disable retries as we handle failures by saving to queue
			};

			// Wait for each request to complete before moving to the next
			// eslint-disable-next-line no-await-in-loop
			await ky(requestObject.url, kyOptions);
		}
	} catch {
		const existingQueue = config.get('queue') ?? {};
		Object.assign(existingQueue, queue);
		config.set('queue', existingQueue);
	} finally {
		process.exit();
	}
});
