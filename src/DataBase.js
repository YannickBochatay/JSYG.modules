require(["JSYG","StdConstruct","Promise"],function(JSYG,StdConstruct,Promise) {
	return;
	"use strict";
	
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB,
		IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
		IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	
	JSYG.DataBase = function(name) {
		
		this.name = name;
		
		this.db = null;
		
		this.schema = null;
		
		this.version = 1;
	};
	
	JSYG.DataBase.prototype = new JSYG.StdConstruct();
	
	JSYG.DataBase.prototype.onopen = null;
	
	JSYG.DataBase.prototype.onupgrade = null;
	
	JSYG.DataBase.prototype.onerror = null;
	
	JSYG.DataBase.prototype.ondelete = null;
	
	JSYG.DataBase.prototype.createQuery = function(objectStoreName) {
		
		return new JSYG.DataBase.Query(this.db,objectStoreName);
	};
		
	JSYG.DataBase.prototype.open = function() {
		
		if (!indexedDB) throw new Error("IndexedDB n'est pas implémenté dasn votre navigateur");
		if (!this.name) throw new Error("Aucun nom de base n'a été défini");
		
		var request = indexedDB.open(this.name, this.version),
			that = this;
		
		request.onupgradeneeded = function(e) {
			
		    that.db = e.target.result;
		    that.trigger("upgrade",that.db,e);
		};
		  
		return new JSYG.Promise(function(resolve,reject) {
			 
			request.onsuccess = function(e) {
				that.db = e.target.result;
				that.trigger("open",that.db,e);
				resolve(that.db);
			};

			request.onerror = function(e) {
				that.trigger("error",that.db,e);
				reject(e);
			};
		});		
	};
	
	JSYG.DataBase.prototype["delete"] = function() {
		
		if (!this.name) throw new Error("Aucun nom de base n'a été défini");
		
		var request = indexedDB.deleteDatabase(this.name),
			that = this;
				
		return new JSYG.Promise(function(resolve,reject) {
			 
			request.onsuccess = function(e) {
				that.db = null;
				that.trigger("delete",null,e);
				resolve(e);
			};

			request.onerror = function(e) {
				that.trigger("error",that.db,e);
				reject(e);
			};
		});
	};
	
	JSYG.DataBase.prototype.close = function() {
		
		this.db.close();
	};
	
	JSYG.DataBase.prototype.setSchema = function(schemaFct) {
		
		var that = this;
		
		this.on("upgrade",function(e) {
			schemaFct.call(that.db,e);
		});
	};
	
	JSYG.DataBase.Query = function(db,storeObjectName) {
		
		this._db = db;
		this._storeObjectName = storeObjectName;
		this._index = null;
		this._bounds = {};
		this._distinct = false;
		this._desc;
	};
	
	JSYG.DataBase.Query.prototype = {
		
		index : function(indexName) {
			
			this._index = indexName;
			
			return this;
		},
		
		lowerBound : function(value,strict) {
			
			this._bounds.min = value;
			this._bounds.minStrict = strict;
			return this;
		},
				
		upperBound : function(value,strict) {
			
			this._bounds.max = value;
			this._bounds.maxStrict = strict;
			return this;
		},
		
		distinct : function() {
			
			this._distinct = true;
			
			return this;
		},
		
		desc : function() {
			
			this._desc = true;
			
			return this;
		},
		
		exec : function() {
			
			var transaction = this._db.transaction(this._storeObjectName),
				objectStore = transaction.objectStore(this._storeObjectName),
				index = this._index && objectStore.index(this._index),
				keyRange, cursor,
				resul = [],
				methodNext;
			
			if (this._bounds.min != null && this._bounds.max != null)
				keyRange = IDBKeyRange.bound( this._bounds.min, this._bounds.max, this._bounds.minStrict || false, this._bounds.maxStrict || false);
			else if (this._bounds.min != null) {
				keyRange = IDBKeyRange.lowerBound( this._bounds.min, this._bounds.minStrict || false);
			}
			else if (this._bounds.max != null) {
				keyRange = IDBKeyRange.upperBound( this._bounds.max, this._bounds.maxStrict || false);
			}
			
			methodNext = (this._desc ? "prev" : "next") + (this._distinct ? "unique" : "");
						
			cursor = (index ? index : objectStore).openCursor(keyRange, methodNext);
						
			cursor.onsuccess = function(e) {
				
				var cursor = e.target.result;
				
				if (cursor) {
					if (cursor.value) resul.push(cursor.value);					
					cursor["continue"]();
				}
			};
			
			return new JSYG.Promise(function(resolve,reject) {
				
				transaction.oncomplete = function() { resolve(resul); };
				
				transaction.onerror = function(e) {
					that.db.trigger("error",that.db,e);
					reject(e);
				};
			});
		}
	};
	
	return JSYG.DataBase;
	
});