define(["JSYG","Promise","StdConstruct","Storage","Ajax","DataBase"],function(JSYG) {
	
	function addSlash(url) {
		
		return url.charAt(url.length-1) == '/' ? url : url+'/';
	}
	
	
	JSYG.Model = function() {
		
		this.attributes = {};
	};
	
	JSYG.Model.prototype = {
			
		constructor : JSYG.Model,
		
		name : null,
			
		url : null,
		
		sendJSON : true,
		
		onchange : null,
		onsave : null,
		ondestroy : null,
		onfetch : null,
		
		set : function(name,value) {
			
			if (JSYG.isPlainObject(name)) {
				for (var n in name) this.set(n,name[n]);
				return;
			}
			
			this.attributes[name] = value;
		},
		
		get : function(name) {
			
			return this.attributes[name];
		},
		
		on : function() { JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		
		off : function() { JSYG.StdConstruct.prototype.on.apply(this,arguments); },
		
		trigger : function() { JSYG.StdConstruct.prototype.trigger.apply(this,arguments); },
		
		_getUrl : function() {
			
			if (typeof this.url == "function") return this.url();
			else if (this.url && this.attributes.id) return addSlash(this.url)+id;
			else return this.url;
		},
		
		save : function() {
			
			var that = this,
				id = this.get('id'),
				url = this._getUrl(),
				promise;
			
			if (url) {
				
				promise = JSYG.Ajax({
					url : url,
					method: id ? "PUT" : "POST",
					data: JSON.stringify(this.attributes)
				});
			}
			else {
				
				if (!this.name) throw new Error("Le nom du modèle n'a pas été défini.");
				
				if (id) promise = JSYG.storage.setItem( this.name + id, this.attributes );
				else throw new Error("Ce cas n'a pas encore été implémenté");
			}
			
			return promise.then(function(id) {
				
				that.trigger("save",that,id);
				return id;
			});
		},
		
		fetch : function() {
			
			var that = this,
				id = this.get('id'),
				url = this._getUrl(),
				promise;
			
			if (!id) throw new Error("L'id n'a pas été défini.");
			
			if (url) {
				
				promise = JSYG.Ajax({
					url : url,
					method : "GET"
				});
			}
			else {
				if (!this.name) throw new Error("Le nom du modèle n'a pas été défini.");
				promise = JSYG.storage.getItem( this.name+id );
			}
		
			return promise.then(function(properties) {
				that.set(properties);
				that.trigger("fetch",that,properties);
				return properties;
			});
		},
		
		destroy : function() {
			
			var that = this,
				id = this.get('id'),
				url = this._getUrl(),
				promise;
			
			if (!id) throw new Error("l'id n'a pas été défini.");
		
			if (url) {
				
				promise = JSYG.Ajax({
					url : url,
					method : "DELETE"
				});
			}
			else {
				if (!this.name) throw new Error("Le nom du modèle n'a pas été défini.");
				promise = JSYG.storage.removeItem(this.name+id);
			}
			
			return promise.then(function() {
				that.trigger("destroy",that);
			});
		}
	};
	
	return JSYG.Model;
});