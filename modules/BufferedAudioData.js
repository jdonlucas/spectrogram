import {PromisedWorker} from './PromisedWorker.js';

export class BufferedAudioData {

	static FFT_SIZE = 1024;

	/**
	 * @type {String}
	 */
	#uri;

	/**
	 * @type {AudioContext}
	 */
	#context;

	/**
	 * @type {AudioBuffer}
	 */
	#buffer;

	/**
	 * @type {Uint8Array[]}
	 */
	#frequencyData;

	constructor(uri) {
		this.#uri = uri;
		this.#context = new AudioContext();
	}

	async fetchData() {
		const response = await fetch(this.#uri);
		if (!response.ok) {
			throw new Error("HTTP error, status = " + response.status);
		}

		const arrayBuffer = await response.arrayBuffer();
		this.#buffer = await new Promise((resolve, reject) => {
			this.#context.decodeAudioData(arrayBuffer, resolve, reject);
		});
	}

	getPCMData(channel = 0) {
		return this.#buffer.getChannelData(channel);
	}

	/**
	 * {@link AudioBuffer.prototype.sampleRate}
	 * @returns {number}
	 */
	get sampleRate() {
		return this.#buffer.sampleRate;
	}

	async getFreqData() {
		if (!this.#frequencyData) {
			const channelDataBuffer = this.getPCMData(0).buffer;
			const {data} = await (new PromisedWorker('../FFT.js')).postMessage({
				channelDataBuffer,
				fftSize: BufferedAudioData.FFT_SIZE
			}, [channelDataBuffer]);
			this.#frequencyData = data;
		}

		return this.#frequencyData;
	}
}