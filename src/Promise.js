//tiré de https://github.com/jakearchibald/es6-promise
define("Promise",["JSYG"],function(JSYG) {
	
	"use strict";
				
	if (window.Promise) {
		JSYG.Promise = window.Promise;
		return JSYG.Promise;
	}
	
	var PENDING = void(0), SEALED = 0, FULFILLED = 1, REJECTED = 2;
	
	var queue = [];
		
	var scheduleFlush = (function() {

		var browserGlobal = (typeof window !== 'undefined') ? window : {},
			BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
		
		// node
		function useNextTick() {
			return function() {
				root.process.nextTick(flush);
			};
		}
		
		function useMutationObserver() {
			
			var iterations = 0,
				observer = new BrowserMutationObserver(flush),
				node = document.createTextNode('');

			observer.observe(node, {
				characterData : true
			});

			return function() {
				node.data = (iterations = ++iterations % 2);
			};
		}

		function useSetTimeout() {
			return function() {
				window.setTimeout(flush, 1);
			};
		}

		function flush() {

			var tuple, callback, i, arg;

			for (i = 0; i < queue.length; i++) {
				tuple = queue[i];
				callback = tuple[0];
				arg = tuple[1];
				callback(arg);
			}

			queue = [];
		}

		// Decide what async method to use to triggering processing of queued
		// callbacks:
		if (typeof root.process !== 'undefined' && {}.toString.call(root.process) === '[object process]')
			return useNextTick();
		else if (BrowserMutationObserver)
			return useMutationObserver();
		else
			return useSetTimeout();

	}());
	
	function asap(callback, arg) {
		
		var length = queue.push([ callback, arg ]);
		
		if (length === 1) scheduleFlush();
	}

	function invokeCallback(settled, promise, callback, detail) {

		var hasCallback = typeof callback == "function",
			value = null, error = null, succeeded;
		
		if (hasCallback) {

			try {
				value = callback(detail);
				succeeded = true;
			} catch (e) {
				succeeded = false;
				error = e;
			}

		} else {
			value = detail;
			succeeded = true;
		}

		if (handleThenable(promise, value))
			return;
		else if (hasCallback && succeeded)
			resolve(promise, value);
		else if (!succeeded)
			reject(promise, error);
		else if (settled === FULFILLED)
			resolve(promise, value);
		else if (settled === REJECTED)
			reject(promise, value);
	}

	function subscribe(parent, child, onFulfillment, onRejection) {

		var subscribers = parent._subscribers,
			length = subscribers.length;

		subscribers[length] = child;
		subscribers[length + FULFILLED] = onFulfillment;
		subscribers[length + REJECTED] = onRejection;
	}

	function publish(promise, settled) {
		
		var child, callback,
			subscribers = promise._subscribers,
			detail = promise._detail,
			i = 0;
		
		for (; i < subscribers.length; i += 3) {
			
			child = subscribers[i];
			callback = subscribers[i + settled];

			invokeCallback(settled, child, callback, detail);
		}

		promise._subscribers = null;
	}

	function handleThenable(promise, value) {

		var then = null, resolved = null;

		try {

			if (promise === value)
				throw new TypeError("A promise callback cannot return that same promise.");

			if (typeof value == "function" || (typeof value === "object" && value !== null)) {

				then = value.then;

				if (typeof then == "function") {
					
					then.call(value, function(val) {
						
						if (resolved) return true;					
						resolved = true;

						if (value !== val)
							resolve(promise, val);
						else
							fulfill(promise, val);

					}, function(val) {

						if (resolved) return true;							
						resolved = true;							
						reject(promise, val);
					});

					return true;
				}
			}
		} catch (error) {
			
			if (resolved) return true;
			reject(promise, error);
			return true;
		}

		return false;
	}

	function resolve(promise, value) {
		
		if (promise === value || !handleThenable(promise, value)) fulfill(promise, value);
	}

	function fulfill(promise, value) {
					
		if (promise._state !== PENDING) return;
		
		promise._state = SEALED;
		promise._detail = value;

		asap(publishFulfillment, promise);
	}

	function reject(promise, reason) {
		
		if (promise._state !== PENDING) return;
		
		promise._state = SEALED;
		promise._detail = reason;

		asap(publishRejection, promise);
	}

	function publishFulfillment(promise) {
		publish(promise, promise._state = FULFILLED);
	}

	function publishRejection(promise) {
		publish(promise, promise._state = REJECTED);
	}
	
	function invokeResolver(resolver,promise) {
		
		function resolvePromise(value) {
			resolve(promise, value);
		}

		function rejectPromise(reason) {
			reject(promise, reason);
		}

		try {
			resolver(resolvePromise, rejectPromise);
		} catch (e) {
			rejectPromise(e);
		}
	}

	JSYG.Promise = function(resolver) {

		if (typeof resolver != "function")
			throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');

		if (!(this instanceof JSYG.Promise)) return new JSYG.Promise(resolver);

		this._subscribers = [];

		invokeResolver(resolver, this);
	};

	JSYG.Promise.prototype = {

		constructor : JSYG.Promise,

		_state : undefined,
		_detail : undefined,
		_subscribers : undefined,
		
		then : function(onFulfillment, onRejection) {

			var promise = this,
				thenPromise = new this.constructor(function() {}),
				callbacks = arguments;

			if (this._state) {
				
				asap(function invokePromiseCallback() {
					invokeCallback(promise._state, thenPromise,
							callbacks[promise._state - 1], promise._detail);
				});
			}
			else subscribe(this, thenPromise, onFulfillment, onRejection);

			return thenPromise;
		},

		'catch' : function(onRejection) {
			return this.then(null, onRejection);
		}
	};

	
	JSYG.Promise.cast = function(object) {
		
		if (object && typeof object === 'object' && object.constructor === this) return object;

		return new JSYG.Promise(function(resolve) {
			resolve(object);
		});
	};
	
	
	/**
	 * @method all
	 * @param {Array} promises
	 * @return {JSYG.Promise} promise that is fulfilled when all `promises` have been
	 *         fulfilled, or rejected if any of them become rejected.
	 */
	JSYG.Promise.all = function(promises) {

		if (!Array.isArray(promises))
			throw new TypeError('You must pass an array to all.');

		return new JSYG.Promise(function(resolve, reject) {

			var results = [], remaining = promises.length, promise;

			if (remaining === 0)
				resolve([]);

			function resolver(index) {
				return function(value) {
					resolveAll(index, value);
				};
			}

			function resolveAll(index, value) {
				results[index] = value;
				if (--remaining === 0) {
					resolve(results);
				}
			}

			for ( var i = 0; i < promises.length; i++) {

				promise = promises[i];

				if (promise && typeof promise.then == "function")
					promise.then(resolver(i), reject);
				else
					resolveAll(i, promise);
			}
		});
	};

	JSYG.Promise.race = function(promises) {

		if (!Array.isArray(promises))
			throw new TypeError('You must pass an array to race.');

		return new JSYG.Promise(function(resolve, reject) {

			var promise;

			for ( var i = 0; i < promises.length; i++) {

				promise = promises[i];

				if (promise && typeof promise.then === 'function')
					promise.then(resolve, reject);
				else
					resolve(promise);
			}
		});
	};

	JSYG.Promise.reject = function(reason) {

		return new JSYG.Promise(function(resolve, reject) {
			reject(reason);
		});
	};

	JSYG.Promise.resolve = function(value) {

		if (value && typeof value === 'object' && value.constructor === JSYG.Promise)
			return value;

		return new JSYG.Promise(function(resolve) {
			resolve(value);
		});
	};
	
	return JSYG.Promise;

});