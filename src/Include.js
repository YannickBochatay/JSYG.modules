(function() {
	
	"use strict";
	
	function URLdelimiter(url) { return (url.indexOf('?') == -1) ?  '?' : '&'; }
	
	function getExtension(file) {
		var match = file.match(/\.([a-z]{1,4})$/i);
		return match && match[1];
	}

	var callbackStack = [],
		slice = Array.prototype.slice;
	
	/**
	 * En interne seulement, utiliser la propriété JSYG.include
	 * @private
	 */
	function Include() {}
	
	Include.prototype = {
			
		constructor : Include,
		/**
		 * Liste des fichiers inclus ou à inclure
		 * @type Array
		 */
		files : [],
		/**
		 * Indique si un chargement est en cours
		 * @type Boolean
		 */
		inProgress : false,

		/**
		 * teste si un fichier est déjà chargé ou non
		 * @param file
		 * @returns {Boolean}
		 */
		isIncluded : function(file) {
			
			for (var i=0,N=this.files.length;i<N;i++) {
				if (this.files[i].src == file) return true;
			}
			return false;
		},
		
		/**
		 * Ajoute un fichier à la liste (qui sera chargée à l'appel de la méthode load)
		 * @param file url du fichier (.css ou .js)
		 * @param nocache bool�en, true si on ne veut pas utiliser le cache du navigateur
		 * @returns {Include}
		 */
		add : function(file,nocache) {
			
			var type;
			
			if (this.isIncluded(file)) return this;
						
			if (file.match(/\.css$/)) type = 'css';
			else if (file.match(/\.js$/)) type = 'js';
			else throw new Error(file+' : type de fichier inconnu');
			
			this.files.push({
				src: file,
				nocache:nocache,
				isLoaded:false,
				isPromised:false,
				type:type
			});
						
			return this;
		},
				
		/**
		 * Teste si tous les fichiers ont été chargés
		 * @returns {Boolean}
		 */
		allLoaded : function() {
			
			for (var i=0,N=this.files.length;i<N;i++) {
				if (!this.files[i].isLoaded) return false;
			}
			
			return true;
		},
		
		/**
		 * Charge la liste des fichiers
		 * @param callback fonction à exécuter une fois le chargement terminé
		 * @returns {Include}
		 */	
		load : function(callback) {
			
			var i,N,
				file,files,
				promise,promises = [],
				load = this.load.bind(this);
			
			function fctCallback() { this.isLoaded = true; }
			
			if (callback && (typeof callback == "function")) callbackStack.unshift(callback);
						
			if (this.allLoaded()) {
				
				return new JSYG.Promise(function(resolve) {
					
					setTimeout(function() {
												
						slice.call(callbackStack).forEach(function(callback,i) {
							var ind = callbackStack.indexOf(callback);
							callbackStack.splice(ind,1);
							callback();
						});
						
						if (callbackStack.length !== 0) load(resolve);
						else resolve();
						
					},0);
					
				});
			}
			else {
							
				files = slice.call(this.files);
													
				for (i=0,N=this.files.length;i<N;i++) {
				
					file = files[i];
					
					if (!file.isPromised) {
						
						if (file.type == 'css') promise = JSYG.loadCSSFile(file.src,file.nocache).then(fctCallback.bind(file));
						else if (file.type == 'js') promise = JSYG.loadJSFile(file.src,file.nocache).then(fctCallback.bind(file));
						else throw new Error(file.src+" : type de fichier inconnu");
						
						promises.push(promise);
						file.isPromised = true;
					}
				}
								
				if (promises.length) return JSYG.Promise.all(promises).then(load);
				else return new JSYG.Promise(function(resolve) {
					window.setTimeout(function() { load(resolve); },10);
				});
			}
		}
	};
	
	JSYG.loadJSFile = function(file,nocache) {
		
		return new JSYG.Promise(function(resolve,reject) {
			
			var js = document.createElement('script');
			
			js.async = true;
			
			js.onload = js.onreadystatechange = function() {
				if (this.readyState && (this.readyState != 'loaded' && this.readyState != 'complete') ) return false;
				resolve();
			};
			js.onerror = function() {
				reject(new Error("Erreur de chargement du fichier "+file));
			};
			
			js.src = file + (nocache ? URLdelimiter(file) + Math.random() : '');
			
			document.getElementsByTagName('head').item(0).appendChild(js);
		});
	};
	
	JSYG.loadCSSFile = function(file,nocache) {
		
		return new JSYG.Promise(function(resolve,reject) {
		
			var css,img,head,onloadEvt,url;
			
			url = file + (nocache ? '?'+Math.random() : '');
			
			css = document.createElement('link');
			css.rel = 'stylesheet';
			css.type = 'text/css';
			css.href = url;
			
			head = document.getElementsByTagName('head').item(0);
			
			onloadEvt = ("onload" in css);
			
			if (onloadEvt) css.onload = resolve;
				
			head.appendChild(css);
				
			// http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
			if (!onloadEvt) {
				
				img = document.createElement('img');
				img.onerror = resolve;
				img.src = url;
		    }
		});
	};
	
	/**
	 * Inclusion à la vol�e de fichiers javascript et css 
	 */
	JSYG.include = new Include();
	
	
	/**
	 * Renvoie l'url du fichier javascript courant
	 * @returns {String}
	 */
	JSYG.currentScript = function() {
		
		var error = new Error();
		if (error.fileName) return error.fileName;
		
		var scripts = document.getElementsByTagName("script"),
			currentScript = scripts.item( scripts.length-1 );
		
		return currentScript.src;
	};
	
	/**
	 * Renvoie le répertoire du fichier javascript courant
	 * @returns {String}
	 */
	JSYG.currentPath = function() {
		
		var currentScript = JSYG.currentScript();
		
		return currentScript.substr(0,currentScript.lastIndexOf('/')+1);
	};
	
	/**
	 * Inclus des plugins JSYG ou des fichiers (javascript ou css).
	 * Le nombre d'arguments n'est pas limit� (callback doit toujours être le dernier argument).
	 * @param file fichier ou plugin à inclure
	 * <ul>
	 * <li>Sans extension, charge le plugin correspondant depuis le répertoire JSYG.require.baseURL.</li>
	 * <li>Avec extension (js ou css), charge le fichier correspondant depuis le répertoire courant.</li>
	 * <ul>
	 * @param callback optionnel, fonction a exécuter une fois le(s) fichier(s) chargé(s).
	 * @example JSYG.require("ZoomAndPan","../monFichier.js",function() { alert('ready'); });
	 */
	JSYG.require = function(file) {
		
		var a = arguments,
			callback,
			isPlugin,
			ext,i,N=a.length;
				
		if (typeof a[N-1] == 'function') {
			callback = a[N-1];
			N--;
		}
		else callback = null;
						
		for (i=0;i<N;i++) {
			
			ext = getExtension(a[i]);
			
			isPlugin = a[i].indexOf("plugins") != -1;
						
			if (!ext) {
				
				if (JSYG[ a[i] ]) continue; //le plugin a déjà été chargé sans utiliser JSYG.include
				
				a[i] = JSYG.require.baseURL + a[i];
				
				a[i]+= (isPlugin ? '/' + a[i] : '' ) + '.js'; 
			}
			else if (ext == 'css' && a[i].indexOf('/') === -1) {
				
				if (isPlugin) {
					a[i] = a[i].replace('.'+ext,'');
					a[i] = JSYG.require.baseURL + a[i] + '/' + a[i] + '.css';
				}
			}
						
			JSYG.include.add(a[i],!JSYG.require.useCache);
		}
				
		return JSYG.include.load(callback);
	};
	
	/**
	 * répertoire des plugins
	 */
	JSYG.require.baseURL = JSYG.currentPath();
		
	/**
	 * Utilisation du cache ou non
	 */
	JSYG.require.useCache = true;
	
}());