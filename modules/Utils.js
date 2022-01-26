export class Utils {
	static _result(v) {
		return this._isFunction(v) ? v() : v;
	}

	static _isFunction(v) {
		return typeof v === 'function';
	}
}
