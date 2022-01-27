export class LayeredCanvas {

	/**
	 * @type {HTMLCanvasElement}
	 */
	#baseCanvas;

	/**
	 * @type {CanvasRenderingContext2D}
	 */
	#baseCanvasContext;

	/**
	 * @type {[CanvasRenderingContext2D]}
	 */
	#layers = [];

	/**
	 * Constructs an object that takes a bunch of offscreen canvases and then draws them in layers.
	 * @param {HTMLCanvasElement} canvas
	 */
	constructor(canvas) {
		this.#baseCanvas = canvas;
		this.#baseCanvasContext = this.#baseCanvas.getContext('2d');
	}

	getCanvasHeight() {
		return this.#baseCanvas.height;
	}

	getCanvasWidth() {
		return this.#baseCanvas.width;
	}

	/**
	 * Unless you want a trailing effect, call this before calling your layers' context methods and {@link drawLayers}
	 */
	clear() {
		for (const layer of this.#layers) {
			layer.clearRect(0, 0, this.#baseCanvas.width, this.#baseCanvas.height);
		}
		this.#baseCanvasContext.clearRect(0, 0, this.#baseCanvas.width, this.#baseCanvas.height);
	};

	#initializeLayer() {
		const canvas = document.createElement('canvas');
		canvas.width = this.#baseCanvas.width;
		canvas.height = this.#baseCanvas.height;
		return canvas.getContext('2d');
	};

	/**
	 * Creates and registers a canvas context to be drawn as its own layer
	 * @param {number} index the draw order
	 * @returns {CanvasRenderingContext2D}
	 */
	registerLayer(index) {
		const layerContext = this.#initializeLayer();
		this.#layers.splice(index, 0, layerContext);
		return layerContext;
	}

	/**
	 * Draws layers in the order dictated by the `index` specified in {@link registerLayer}.
	 * Unless you want a trailing effect, call {@link clear} before calling this.
	 */
	drawLayers() {
		for (const layer of this.#layers) {
			this.#baseCanvasContext.drawImage(layer.canvas, 0, 0);
		}
	};
}
