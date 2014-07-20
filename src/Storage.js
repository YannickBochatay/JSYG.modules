define("Storage",["JSYG","Promise"],function(JSYG) {
	   
    // Originally found in https://github.com/mozilla-b2g/gaia/blob/e8f624e4cc9ea945727278039b3bc9bcb9f8667a/shared/js/async_storage.js

    var DBNAME = 'localforage',
    	DBVERSION = 1,
    	STORENAME = 'keyvaluepairs',
    	db = null;

    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
    var indexedDB = indexedDB || window.indexedDB || window.webkitIndexedDB ||
                    window.mozIndexedDB || window.OIndexedDB ||
                    window.msIndexedDB;

    function withStore(type, f, reject) {
    	
    	if (!indexedDB) throw new Error("indexedDB is not implemented in your browser");
    	
        if (db) {
            f(db.transaction(STORENAME, type).objectStore(STORENAME));
        } else {
            var openreq = indexedDB.open(DBNAME, DBVERSION);
            openreq.onerror = function withStoreOnError() {
                reject(openreq.error.name);
            };
            openreq.onupgradeneeded = function withStoreOnUpgradeNeeded() {
                // First time setup: create an empty object store
                openreq.result.createObjectStore(STORENAME);
            };
            openreq.onsuccess = function withStoreOnSuccess() {
                db = openreq.result;
                f(db.transaction(STORENAME, type).objectStore(STORENAME));
            };
        }
    }
   
    function Storage() { };
    
    Storage.prototype = {
    	
		driver: 'asyncStorage',
		
		/**
		 * Récupération d'un item à partir de sa clé
		 * @param key {String} nom de la clé
		 * @param callback {Function} fonction de rappel à exécuter quand l'item est récupéré (en argument la valeur de l'item)
		 * @return {JSYG.Promise}
		 */
		getItem:  function getItem(key, callback) {
	        return new JSYG.Promise(function(resolve, reject) {
	            withStore('readonly', function getItemBody(store) {
	                var req = store.get(key);
	                req.onsuccess = function getItemOnSuccess() {
	                    var value = req.result;
	                    if (value === undefined) value = null;
	                    if (callback) callback(value);
	                    resolve(value);
	                };
	                req.onerror = function getItemOnError() {
	                    reject(req.error.name);
	                };
	            }, reject);
	        });
	    },
		
	    /**
	     * Stockage d'un item
	     * @param key {String} nom de la clé
	     * @param value valeur à stocker (type libre)
	     * @param callback {Function} fonction de rappel à exécuter quand l'item est stocké
	     * @return {JSYG.Promise}
	     */
		setItem: function setItem(key, value, callback) {
	        return new JSYG.Promise(function(resolve, reject) {
	            withStore('readwrite', function setItemBody(store) {
	                // Cast to undefined so the value passed to callback/promise is
	                // the same as what one would get out of `getItem()` later.
	                // This leads to some weirdness (setItem('foo', undefined) will
	                // return "null"), but it's not my fault localStorage is our
	                // baseline and that it's weird.
	                if (value === undefined) value = null;
	                
	                var req = store.put(value, key);
	                req.onsuccess = function setItemOnSuccess() {
	                    if (callback) callback(value);
	                    resolve(value);
	                };
	                req.onerror = function setItemOnError() {
	                    reject(req.error.name);
	                };
	            }, reject);
	        });
	    },
		
	    /**
	     * Suppression d'un item
	     * @param key {String} nom de la clé
		 * @param callback {Function} fonction de rappel à exécuter quand l'item est supprimé (en argument la valeur de l'item)
		 * @return {JSYG.Promise}
	     */
		removeItem: function removeItem(key, callback) {
	        return new JSYG.Promise(function(resolve, reject) {
	            withStore('readwrite', function removeItemBody(store) {
	                // We use `['delete']` instead of `.delete` because IE 8 will
	                // throw a fit if it sees the reserved word "delete" in this
	                // scenario. See: https://github.com/mozilla/localForage/pull/67
	                //
	                // This can be removed once we no longer care about IE 8, for
	                // what that's worth.
	                // TODO: Write a test against this? Maybe IE in general? Also,
	                // make sure the minify step doesn't optimise this to `.delete`,
	                // though it currently doesn't.
	                var req = store['delete'](key);
	                req.onsuccess = function removeItemOnSuccess() {
	                    if (callback) callback();
	                    resolve();
	                };
	                req.onerror = function removeItemOnError() {
	                    reject(req.error.name);
	                };
	            });
	        });
	    },
	    
		/**
		 * Suppression de tous les items
		 * @param callback {Function} fonction de rappel à exécuter quand tous les items sont supprimés
		 * @return {JSYG.Promise}
		 */
		clear: function clear(callback) {
	        return new JSYG.Promise(function(resolve, reject) {
	            withStore('readwrite', function clearBody(store) {
	                var req = store.clear();
	                req.onsuccess = function clearOnSuccess() {
	                    if (callback)callback();
	                    resolve();
	                };
	                req.onerror = function clearOnError() {
	                    reject(req.error.name);
	                };
	            }, reject);
	        });
	    },
		
	    /**
	     * Nombre d'items stockés
	     * @param callback {Function} fonction de rappel à exécuter quand le nombre est trouvé (en argument ce nombre)
	     * @return {JSYG.Promise}
	     */
		length: function length(callback) {
	        return new JSYG.Promise(function(resolve, reject) {
	            withStore('readonly', function lengthBody(store) {
	                var req = store.count();
	                req.onsuccess = function lengthOnSuccess() {
	                    if (callback) callback(req.result);
	                    resolve(req.result);
	                };
	                req.onerror = function lengthOnError() {
	                    reject(req.error.name);
	                };
	            });
	        });
	    },
		
	    /**
	     * Récupération de la clé en fonction de son indice
	     * @param n {Number} indice de l'item
	     * @param callback {Function} fonction de rappel à exécuter quand la clé est trouvée (en argument la clé)
	     * @return {JSYG.Promise}
	     */
		key: function key(n, callback) {
	        return new JSYG.Promise(function(resolve, reject) {
	            if (n < 0) {
	                if (callback) callback(null);
	                resolve(null);
	                return;
	            }

	            withStore('readonly', function keyBody(store) {
	                var advanced = false;
	                var req = store.openCursor();
	                req.onsuccess = function keyOnSuccess() {
	                    var cursor = req.result;
	                    if (!cursor) {
	                        // this means there weren't enough keys
	                        if (callback) callback(null);
	                        resolve(null);

	                        return;
	                    }
	                    if (n === 0) {
	                        // We have the first key, return it if that's what they wanted
	                        if (callback) callback(cursor.key);
	                        resolve(cursor.key);
	                    } else {
	                        if (!advanced) {
	                            // Otherwise, ask the cursor to skip ahead n records
	                            advanced = true;
	                            cursor.advance(n);
	                        } else {
	                            // When we get here, we've got the nth key.
	                            if (callback) callback(cursor.key);
	                            resolve(cursor.key);
	                        }
	                    }
	                };

	                req.onerror = function keyOnError() {
	                    reject(req.error.name);
	                };
	            }, reject);
	        });
	    }
    };

    /**
	 * Stockage des données sur le client (utilisation de indexedDB)
	 * @link https://github.com/mozilla-b2g/gaia/blob/e8f624e4cc9ea945727278039b3bc9bcb9f8667a/shared/js/async_storage.js
	 */
    JSYG.storage = new Storage();
    
    return JSYG.storage;
});