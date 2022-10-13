export class PromisedWorker {

	/**
	 * Prevents constructing a Worker on the same file twice
	 * @type {Map<String, Worker>}
	 */
	static #workerCache = new Map();

	/**
	 * @type {Worker}
	 */
	#worker;

	constructor(scriptURL) {
		if (!PromisedWorker.#workerCache.has(scriptURL)) {
			PromisedWorker.#workerCache.set(scriptURL, new Worker(scriptURL));
		}

		this.#worker = PromisedWorker.#workerCache.get(scriptURL);
	}

	/**
	 * @param {any} message
	 * @param {[Transferable]} transfer
	 * @returns {Promise<MessageEvent>}
	 */
	async postMessage(message, transfer) {
		this.#worker.postMessage(message, transfer);
		return new Promise(resolve => this.#worker.onmessage = resolve)
	}
}