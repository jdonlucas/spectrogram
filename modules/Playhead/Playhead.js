import {BufferedAudioData} from '../BufferedAudioData/BufferedAudioData.js';

export class Playhead {

	/**
	 * @type {LayeredCanvas}
	 */
	#layeredCanvas;

	/**
	 * @type {HTMLAudioElement}
	 */
	#audioElement;

	/**
	 * @type {BufferedAudioData}
	 */
	#bufferedAudioData;

	/**
	 * @type {CanvasRenderingContext2D}
	 */
	#canvasContext;

	/**
	 * @type {Number}
	 */
	#requestId;

	/**
	 * Draws a playhead (a vertical white line) on canvas when audio is played
	 * @param {LayeredCanvas} layeredCanvas
	 * @param audioElement
	 * @param bufferedAudioData
	 */
	constructor(layeredCanvas, audioElement, bufferedAudioData) {
		this.#layeredCanvas = layeredCanvas;
		this.#canvasContext = layeredCanvas.registerLayer(1);
		this.#audioElement = audioElement;
		this.#bufferedAudioData = bufferedAudioData;
		audioElement.addEventListener('play', async () => {
			this.drawPlayhead();
		});
		audioElement.addEventListener('pause', () => {
			this.pauseDrawingPlayhead();
		});
	}


	drawPlayhead() {
		if (this.#requestId) {
			return;
		}

		this.#requestId = requestAnimationFrame(() => this.#drawPlayhead());
	}

	#drawPlayhead() {
		this.#layeredCanvas.clearLayer(this.#canvasContext);
		this.#canvasContext.fillStyle = 'white';
		this.#canvasContext.fillRect(this.#getXPositionOfPlayhead(), 0, 1, this.#layeredCanvas.getCanvasHeight());
		this.#layeredCanvas.drawLayers();
		this.#requestId = requestAnimationFrame(() => this.#drawPlayhead());
	}

	pauseDrawingPlayhead() {
		cancelAnimationFrame(this.#requestId);
		this.#requestId = undefined;
	}

	/**
	 * @returns {number}
	 */
	#getXPositionOfPlayhead() {
		const channelDataIndex = this.#audioElement.currentTime * this.#bufferedAudioData.getSampleRate();
		return Math.floor(channelDataIndex / BufferedAudioData.FFT_SIZE);
	}
}