/**
Tracking providers.

Each provider is a function(id, path) that should return options object for ky() call. It will be called bound to Insight instance object.
*/

const payload = {
	// Google Analytics — https://www.google.com/analytics/
	google(id, payload) {
		const now = Date.now();

		const queryParameters = new URLSearchParams({
			// GA Measurement Protocol API version
			v: '1',

			// Hit type
			t: payload.type,

			// Anonymize IP
			aip: '1',

			tid: this.trackingCode,

			// Random UUID
			cid: this.clientId,

			cd1: this.os,

			// GA custom dimension 2 = Node Version, scope = Session
			cd2: this.nodeVersion,

			// GA custom dimension 3 = App Version, scope = Session (temp solution until refactored to work w/ GA app tracking)
			cd3: this.appVersion,

			// Queue time - delta (ms) between now and track time
			qt: now - Number.parseInt(id, 10),

			// Cache busting, need to be last param sent
			z: now,
		});

		// Set payload data based on the tracking type
		if (payload.type === 'event') {
			queryParameters.set('ec', payload.category); // Event category
			queryParameters.set('ea', payload.action); // Event action

			if (payload.label) {
				queryParameters.set('el', payload.label); // Event label
			}

			if (payload.value) {
				queryParameters.set('ev', payload.value); // Event value
			}
		} else {
			queryParameters.set('dp', payload.path); // Document path
		}

		return {
			url: 'https://ssl.google-analytics.com/collect',
			method: 'POST',
			// GA docs recommend body payload via POST instead of querystring via GET
			body: queryParameters.toString(),
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
			},
		};
	},

	// Yandex.Metrica - https://metrica.yandex.com
	yandex(id, payload) {
		const ts = new Date(Number.parseInt(id, 10))
			.toISOString()
			.replaceAll(/[-:T]/g, '') // Remove `-`, `:`, and `T`
			.replace(/\..*$/, ''); // Remove milliseconds

		const {path} = payload;

		// Query parameters for Yandex.Metrica
		const queryParameters = new URLSearchParams({
			wmode: '3', // Web mode
			ut: 'noindex', // User type
			'page-url': `http://${this.packageName}.insight${path}?version=${this.packageVersion}`,
			'browser-info': `i:${ts}:z:0:t:${path}`,
			// Cache busting
			rn: Date.now(),
		});

		const url = `https://mc.yandex.ru/watch/${this.trackingCode}`;

		return {
			url,
			method: 'GET',
			searchParams: queryParameters,
			headers: {
				Cookie: `yandexuid=${this.clientId}`,
			},
		};
	},
};

export default payload;
