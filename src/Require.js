(function() {
	
	"use strict";
	
	if (window.require || window.define) return;
	
	var callbackStack = [],
		slice = Array.prototype.slice,
		files = [],
		inProgress = false,
		preventInfiniteLoop=0,
		currentScript,
		config = {
			baseURL:getCurrentPath(),
			urlArgs:null,
			paths:{}
		};
	
	function URLdelimiter(url) { return (url.indexOf('?') == -1) ?  '?' : '&'; }
	
	function getExtension(file) {
		var match = file.match(/\.([a-z]{1,4})$/i);
		return match && match[1];
	}
	
	/**
	 * teste si un fichier est déjà chargé ou non
	 * @param file
	 * @returns {Boolean}
	 */
	 function isIncluded(file) {
		
		for (var i=0,N=files.length;i<N;i++) {
			if (files[i].src == file) return true;
		}
		return false;
	}
	
	/**
	 * Ajoute un fichier à la liste (qui sera chargée à l'appel de la méthode loadAll)
	 * @param file url du fichier (.css ou .js)
	 */
	 function addFile(file) {
		
		var type;
		
		if (isIncluded(file)) return;
					
		if (file.match(/\.css$/)) type = 'css';
		else if (file.match(/\.js$/)) type = 'js';
		else throw new Error(file+' : type de fichier inconnu');
		
		files.push({
			src: file,
			isLoaded:false,
			isPromised:false,
			type:type
		});
	}
				
	/**
	 * Teste si tous les fichiers ont été chargés
	 * @returns {Boolean}
	 */
	 function allFilesLoaded(files) {
		
		for (var i=0,N=files.length;i<N;i++) {
			if (!files[i].isLoaded) return false;
		}
		
		return true;
	}
	
	 function onfileLoaded(files) {
		 
		 this.isLoaded = true;
			
		if (inProgress && allFilesLoaded(files)) {
			inProgress = false;
			loadAll(); //pour vérifier que d'autres fichiers n'ont pas été ajoutés entre temps
		}
	 }
	 
	 function execCallbackStack() {
		 
		 slice.call(callbackStack).forEach(function(callback,i) {
				
			var ind = callbackStack.indexOf(callback),
				returnValue,
				fileName = callback.fileName,
				i;
			
			if (fileName) {
				
				if (callback.dependencies) {
					for(i=0;i<callback.dependencies.length;i++) {
						if (typeof callback.dependencies[i] == "string") return;
					}
				}
				
				callbackStack.splice(ind,1);
				
				returnValue = callback.apply(null,callback.dependencies);
				
				callbackStack.forEach(function(fct) {
					
					if (!fct.dependencies) return;
					
					var ind = fct.dependencies.indexOf(fileName);
					
					if (ind!=-1) fct.dependencies[ind] = returnValue;
				});
			}
			else {
				
				callbackStack.splice(ind,1);
				callback();
			}
		});
											
		//si des include sont ajoutés dans les callback, on repart pour un tour
		if (callbackStack.length !== 0) loadAll();
	 }
	 /**
	 * Charge la liste des fichiers
	 * @param callback fonction à exécuter une fois le chargement terminé
	 */	
	 function loadAll(callback) {
		
		var currentFiles,file,i,N;
			
		if (callback) callbackStack.unshift(callback);
		
		if (inProgress) return;
					
		if (allFilesLoaded(files)){
			
			preventInfiniteLoop++;
			
			if (preventInfiniteLoop > files.length) throw new Error("Une erreur empêche de charger correctement les modules");
			
			setTimeout(execCallbackStack,0);
		}
		else {
			
			inProgress = true;
			
			currentFiles = slice.call(files);
								
			for (i=0,N=currentFiles.length;i<N;i++) {
			
				file = currentFiles[i];
				
				if (file.type == 'css' && file.isLoaded === false)
					loadCSSFile(file.src,onfileLoaded.bind(file,currentFiles));
				else if (file.type == 'js' && file.isLoaded === false)
					loadJSFile(file.src,onfileLoaded.bind(file,currentFiles));
			}
		}
	}
	
	function loadJSFile(fileName,callback) {
		
		var js = document.createElement('script'),
		body = document.getElementsByTagName('body').item(0);
			
		js.async = true;
		
		js.onload = js.onreadystatechange = function() {
			if (this.readyState && (this.readyState != 'loaded' && this.readyState != 'complete') ) return false;
			callback && callback();
			body.removeChild(js);
		};
		
		js.onerror = function() {
			throw new Error("Erreur de chargement du fichier "+fileName);
		};
		
		js.src = fileName;
		
		body.appendChild(js);
	}
	
	function loadCSSFile(fileName,callback) {
		
		var css,img,head,onloadEvt;
		
		css = document.createElement('link');
		css.rel = 'stylesheet';
		css.type = 'text/css';
		css.href = fileName;
		
		head = document.getElementsByTagName('head').item(0);
		
		onloadEvt = ("onload" in css);
		
		if (onloadEvt) css.onload = callback;
			
		head.appendChild(css);
			
		// http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
		if (!onloadEvt) {
			img = document.createElement('img');
			img.onerror = callback;
			img.src = fileName;
	    }
	}
	
	function getCurrentScript() {
		
		//if (currentScript) return currentScript;
		
		var scripts = document.getElementsByTagName("script");
		return scripts.item( scripts.length-1 );
	}
	
	/**
	 * Renvoie le répertoire du fichier javascript courant
	 * @returns {String}
	 */
	function getCurrentPath() {
		
		var script = getCurrentScript().src;
		return script.substr(0,script.lastIndexOf('/')+1);
	}
	
	var regsNormalize = [ /([^\/:\*\?'"<>\|\\]+)\/\.\.\//g, /\/\.\//g ];
	
	function normalize(path) {
		
		var test;
		
		function replace(s,s1){ if (s1!='..') return '';};
		
		if (path.charAt(0) == ".") path = getCurrentPath() + path;
		
		while (path.indexOf('..') !=-1) {
			
			test = regsNormalize[0].test(path);
						
			if (!test) break;
			
			path = path.replace(regsNormalize[0],replace);
		}
		
		return path.replace(regsNormalize[1],'/');
	}
	
	function require(file) {
		
		var a = slice.call(arguments),
			callback,
			ext,i,N=a.length;
				
		if (typeof a[N-1] == 'function') {
			callback = a[N-1];
			a.pop();
			N--;
		}
		else callback = null;
		
		if (Array.isArray(a[0])) {
			a = a[0];
			N = a.length;
		}
		else if (Array.isArray(a[1])) {
			a = a[1];
			N = a.length;
		}
									
		for (i=0;i<N;i++) {
			
			if(config.paths[a[i]]) a[i] = config.paths[a[i]];
						
			ext = getExtension(a[i]);
						
			if (!ext || ext == "css") {
				
				if (a[i].charAt(0) != "/" && a[i].indexOf("://")==-1) a[i] = config.baseURL + a[i];
				
				if (!ext) a[i]+=".js";
			}
			
			a[i] = normalize(a[i]);
			
			if (require.urlArgs) a[i]+=URLdelimiter(a[i])+config.urlArgs;

			addFile(a[i]);
		}
		
		if (callback) {
			
			callback.dependencies = a;
			callback.fileName = document.currentScript && document.currentScript.src || getCurrentScript();
		}
				
		return loadAll(callback);
	};
		
	require.config = function(obj) {
		
		for (var n in obj) {
			if (config[n]!==undefined) config[n] = obj[n];
		}
	};
			
	window.require = window.define = require;
	
	window.define.amd = {};
	
	var main = getCurrentScript().getAttribute('data-main');
	if (main) require(main);
	main = null;
	
}());