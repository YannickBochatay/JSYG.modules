define("Builder",["JSYG","Utils","Promise","Ajax"],function(JSYG) {
	
	"use strict";
		
	var rDefine = /^(?:\/\*[\S\s]*?\*\/|\/\/.*?\n|\s)*(?:define|require)\s*\((?:\s*['"]\S+['"]\s*,)?(?:\s*\[([\S\s]*?)?\]\s*,)\s*function/;

	function Builder() {
		
		this._files = [];
		this._content = '';
	}
	
	Builder.prototype.baseUrl = ".";
	
	Builder.prototype.constructor = Builder;
	
	Builder.prototype.compilation_level = "SIMPLE_OPTIMIZATIONS";
	
	Builder.prototype.output_info = ["compiled_code","errors"];
	
	Builder.prototype.output_format = "json";
	
	Builder.prototype.compileJS = function(str) {
		
		var data = "compilation_level="+this.compilation_level
			+"&output_format="+this.output_format
			+"&js_code="+encodeURIComponent(str);
		
		this.output_info.forEach(function(info){
			data+="&output_info="+info;
		});
		
		return JSYG.Ajax({
			url:"http://closure-compiler.appspot.com/compile",
			method:"POST",
			cache:true,
			format:"json",
			data:data
		})
		.then(function(results) {
			
			if (results.compiledCode) return results.compiledCode;
			else {
				return JSYG.Promise.reject(results.errors || results);
			}
		});
	};
	
	Builder.prototype._getFullPath = function(file) {
		
		var url = this.baseURL,
			separator = url.charAt( url.length - 1 ) == '/' ? '' : '/';
		
		if (/\.js$/.test(file)) return file;
		else return url + separator + file + '.js';
		
		return file;
	};
		
	Builder.prototype._getContentFile = function(dependency) {
		
		var file = this._getFullPath(dependency);
		
		if (this._files.indexOf(file) != -1) return JSYG.Promise.resolve();
		
		var that = this;
		
		this._files.push(file);
		
		return JSYG.Ajax(file).then(function(content) {
									
			var matches = rDefine.exec(content),
				dependencies = matches && matches[1],
				promise, promises = [];
			
			if (dependencies) {
				
				dependencies = dependencies.replace(/['"\s]/g,'').split(/,/);
								
				dependencies.forEach(function(dependency) {			
					if (!dependency) return;
					promises.push( that._getContentFile(dependency) );
				});
			}
			
			if (!promises.length) {
				content = 'define("'+dependency+'",[],function() {\n'+content+'\n});\n';
				promise = JSYG.Promise.resolve();
			}
			else promise = JSYG.Promise.all(promises);
						
			return promise.then(function() {
				that._content += "/*File : " +file +"*/\n" + content + "\n\n";
				return content;
			});
			
		});		
	};
	
	function copyArray(arrayLike) {
		
		return Array.prototype.slice.call(arrayLike);
	}
	
	Builder.prototype._reset = function() {
		
		this._files.splice(0,this._files.length);
		this._content = '';
	};
	
	Builder.prototype.process = function(dependency1,dependency2,dependencyN) {
		
		var that = this,
			promises = [],
			dependencies = Array.isArray(dependency1) ? dependency1 : copyArray(arguments);
		
		dependencies.forEach(function(dependency) {
			promises.push( that._getContentFile(dependency) );
		});
		
		return JSYG.Promise.all(promises)
		.then(function() {
			
			var files = copyArray(that._files),
				content = "(function() {\n"+that._getLoader() + that._content + "\n";
			
			dependencies.forEach(function(dep) { content+= "require('"+dep+"');\n"; });
			
			content += "}());";
			
			that._reset();
				
			return {
				files :files,
				content:content
			};
		});
	};
	
	Builder.prototype.toDataURL = function(str) {
		
		return "data:text;base64," + JSYG.base64encode(str);
	};
	
	Builder.prototype._getLoader = function() {
		
		var fct = loader.toString(),
			reg = /^function loader\(\) \{([\s\S]+)*?\}$/;
		
		return reg.exec(fct)[1];
	};
	
	Builder.prototype._getLauncher = function() {
		
		return launch.toString();
	};

	function launch(root, factory) {

		var $ = root.jQuery;
		
		if (typeof define == 'function' && define.amd) {
			
			if (!$) {
										
				define(['jquery'], function($) {
					return factory(root,$);
				});
			}
			else define(function() {
				return factory(root,$);
			});
		}
		else factory(root,$);
	}
	
	function loader() {
		
	var define, require;

	(function() {

		var registry = {}, seen = {};

		define = function(name, deps, callback) {
			registry[name] = {
				deps : deps,
				callback : callback
			};
		};

		require = function(name) {

			if (seen[name]) return seen[name];

			seen[name] = {};

			if (!registry[name]) throw new Error("Could not find module " + name);

			var mod = registry[name],
				deps = mod.deps,
				callback = mod.callback,
				reified = [],
				exports = null,
				i, l, value;

			for (i = 0, l = deps.length; i < l; i++) {
				if (deps[i] === 'exports') reified.push(exports = {});
				else reified.push(require(resolve(deps[i])));
			}

			value = callback.apply(this, reified);

			return seen[name] = exports || value;

			function resolve(child) {

				if (child.charAt(0) !== '.') return child;

				var parts = child.split("/"),
					parentBase = name.split("/").slice(0,-1),
					i, l, part;

				for (i = 0, l = parts.length; i < l; i++) {
					part = parts[i];
					if (part === '..') parentBase.pop();
					else if (part === '.') continue;
					else parentBase.push(part);
				}

				return parentBase.join("/");
			}
		};

	})();
	}
	
	JSYG.builder = new Builder();
	
	return JSYG.builder;
});