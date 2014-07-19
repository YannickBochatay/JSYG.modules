define(["JSYG","String"],function(JSYG) {
	
	"use strict";
		
	var rRequire = /^(?:\/\*[\S\s]*?\*\/|\/\/.*?\n|\s)*JSYG\.require\s*\(([\S\s]*?)\)\s*;?\s*/,
		rCallback = /^(?:\/\*[\S\s]*?\*\/|\/\/.*?\n|\s)*JSYG\.require\s*\((?:\s*['"]\S+['"]\s*,)+\s*(function[\s\S]*})\s*\)\s*;?\s*/,
		rUrl = /url\s*\(\s*('|")?([^\/]*?)\1?\s*\)/g,
		rCompileCSS = [ /\/\*[\S\s]*?\*\//g, /\s+/g, / ?([,:;{}]) ?/g, /;}/g ],
		rCleanRequire = [ /\/\*[\s\S]*?\*\//g, /\/\/.*?\n/g, /['"\s]/g ],
		rPlugin = /^\w+$/,
		rFunc = /function\s*\(\s*/,
		rCSSFile = /^\w+\.css$/;

	function Compiler() {
		
		this._jsFiles = [];
		this._cssFiles = [];
		
		this._jsContent = '';
		this._cssContent = '';
	}
	
	Compiler.prototype.constructor = Compiler;
	
	Compiler.prototype.compilation_level = "SIMPLE_OPTIMIZATIONS";
	
	Compiler.prototype.output_info = ["compiled_code","errors"];
	
	Compiler.prototype.output_format = "json";
	
	Compiler.prototype.compileJS = function(str) {
		
		var data = "compilation_level="+this.compilation_level
			+"&output_format="+this.output_format
			+"&js_code="+JSYG.urlencode(str);
		
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
	
	Compiler.prototype.compileCSS = function(str) {
			
		var compiledString = new String(str)
		.replace(rCompileCSS[0],'')
		.replace(rCompileCSS[1],' ')
		.replace(rCompileCSS[2],function(s,s1) { return s1; })
		.replace(rCompileCSS[3],'}')
		.valueOf();
		
		return JSYG.Promise.resolve(compiledString);
	};
	
	Compiler.prototype.get = function(file1,file2,fileN) {
		
		var files = JSYG.makeArray( typeof file1 == "string" ? arguments : file1 ),
			content = '',
			promise = null;
		
		files.forEach(function(file) {
			promise = !promise ? JSYG.Ajax(file) : promise.then(function() { return JSYG.Ajax(file); });
			promise = promise.then(function(fileContent) { return content += fileContent+"\n\n"; });
		});
		
		return promise;
	};
		
	Compiler.prototype._getFullPath = function(file) {
		
		var url = JSYG.require.baseURL,
			separator = url.charAt( url.length - 1 ) == '/' ? '' : '/';
				
		if (rPlugin.test(file)) file = url + separator + file + "/"+file+".js";
		else if (rCSSFile.test(file)) {
			
			var path = file.replace(/\.css$/,'');
			file = url + separator + path + "/" + file;
		}
		
		return file;
	};
	
	Compiler.prototype._getContentFile = function(file) {
		
		file = this._getFullPath(file);
		
		if (file.indexOf(".css") !== -1) return this._getCSSContentFile(file);
		else return this._getJSContentFile(file);
	};
	
	Compiler.prototype._getCSSContentFile = function(file) {

		if (this._cssFiles.indexOf(file) != -1) return;
		
		var content = '',
			path = file.substr(0, file.lastIndexOf('/') +1 ),
			that = this,
			ajax = new JSYG.Ajax({cache:false,url:file});
		
		this._cssFiles.push(file);
		
		return ajax.send().then(function(css) {
			
			//la concaténation implique de changer les urls dans les fichiers css
			content = css.replace(rUrl,function(s,s1,s2) { return "url("+path+s2+")"; });
			
			return that.compileCSS(content).then(function(compiledContent) {
				that._cssContent += compiledContent;
				return compiledContent;
			});
		});
	};
	
	Compiler.prototype._getJSContentFile = function(file) {
		
		if (this._jsFiles.indexOf(file) != -1) return JSYG.Promise.resolve();
		
		var that = this,
			ajax = new JSYG.Ajax({url:file,cache:false});
		
		this._jsFiles.push(file);
		
		return ajax.send().then(function(content) {
						
			var header = content.substr(0,1000),
				matches = rRequire.exec(header),
				files, lastArg, callback = null,
				subFiles = [], promises = [];
			
			if (matches) {
				
				files = matches[1];
				
				subFiles = files
				.replace(rCleanRequire[0],'')
				.replace(rCleanRequire[1],'')
				.replace(rCleanRequire[2],'')
				.split(/,/);
				
				lastArg = subFiles[ subFiles.length - 1 ];
				
				if (rFunc.test(lastArg)) {
					
					subFiles.pop();
					matches = rCallback.exec(content);
					callback = matches[1];
					
					content = content.replace(rCallback,'');
				}
				else content = content.replace(rRequire,'');
				
			}
							
			subFiles.forEach(function(subFile) {
				if (subFile) promises.push( that._getContentFile(subFile) );
			});
			
			return JSYG.Promise.all(promises).then(function() {
								
				that._jsContent += "/*File : " +file +"*/\n" + content + "\n\n";
				if (callback) that._jsContent += '('+callback+'());\n\n';
				return content;
			});
			
		});		
	};
	
	function emptyArray(array) {
		
		while(array.length > 0) array.pop();
	}
	
	function copyArray(arrayLike) {
		
		return Array.prototype.slice.call(arrayLike);
	}
	
	Compiler.prototype._reset = function() {
		
		emptyArray(this._jsFiles);
		emptyArray(this._cssFiles);
		this._jsContent = '';
		this._cssContent = '';
	};
	
	Compiler.prototype._returnResponse = function(jsContent,cssContent) {
		
		var response = {
			js : {
				files : copyArray(this._jsFiles),
				content : jsContent
			},
			css : {
				files : copyArray(this._cssFiles),
				content : cssContent
			}
		};
		
		this._reset();
		
		return response;
	};
	
	Compiler.prototype.build = function(dependency1,dependency2,dependencyN) {
		
		var that = this,
			promises = [],
			jsContent = '';
		
		copyArray(arguments).forEach(function(file) {
			
			var promise = that._getJSContentFile(file)
			.then(function() {
				jsContent+= "/*File : " +file +"*/\n" + content + "\n\n";
			});
			
			promises.push(promise);
		});
		
		JSYG.Promise.all(promises).then(function() { return jsContent; });
	};
	
	Compiler.prototype.processFile = function(file,dontMinify) {
		
		var that = this;
				
		return this._getJSContentFile(file).then(function() {
				
			if (dontMinify) return that._returnResponse(that._jsContent,that._cssContent);
				
			var promises = [];
			
			promises.push( that.compileJS(that._jsContent) );
			promises.push( that.compileCSS(that._cssContent) );
			
			return JSYG.Promise.all(promises).then( function(results) {
				return that._returnResponse(results[0],results[1]);			
			});
		});
	};
	
	Compiler.prototype.toDataURL = function(str) {
		
		return "data:text;base64," + JSYG.base64encode(str);
	};
	
	JSYG.compiler = new Compiler();
	
	return JSYG.compiler;
	
});