(function() {
	
	"use strict";
	
	/**
	 * création de miniatures de la collection (éléments SVG uniquement).
	 * @param width largeur des miniatures ou null pour proportionelle à height
	 * @param height hauteur des miniatures ou null pour proportionelle à width
	 * @returns {JSYG} collection JSYG dont les éléments sont des canvas SVG
	 * @example new JSYG('#myShape').createThumb().appendTo('body')
	 */
	JSYG.prototype.createThumb = function(width,height) {
		
		var thumbs = [];
		
		this.each(function() {
		
			if (!this.isSVG()) return;
			
			if (!this.attr('id')) this.attr('id','thumb'+JSYG.rand(0,999999));
			
			var dim, use;
			
			try {
				dim = this.getDim();
				if (this.getTag() == 'svg') { dim.x = dim.y = 0; }
				
			} catch(e) {
				use = new JSYG('<use>').href('#'+this.id()).css("visibility","hidden").appendTo(this.offsetParent());
				dim = use.getDim();
				use.remove();
			}
					
			var svg = new JSYG('<svg>').viewBox(dim);
			
			if (width == null && height == null) { width = dim.width; height = dim.height; }
			else if (width == null) width = dim.width * height / dim.height;
			else if (height == null) height = dim.height * width / dim.width;

			svg.setDim({width:width,height:height});
			
			svg.append(new JSYG('<use>').href('#'+this.id()));
			
			thumbs.push(svg[0]);
			
		},true);
		
		return new JSYG(thumbs);
	};
	
	/**
	 * Fixe la valeur du flou gaussien de la collection ou récupère la valeur du premier élément.
	 * @param stdDeviation optionnel, valeur du flou (0 pas de flou)
	 * @returns valeur du flou si stdDeviation n'est pas défini, la collection JSYG sinon.
	 */
	JSYG.prototype.gaussianBlur = function(stdDeviation) {
		
		if (!this.isSVG()) throw new TypeError("méthode SVG uniquement");
		
		if (!this[0].parentNode) throw new Error("Il faut d'abord attacher l'élément à l'arbre DOM.");
		
		var root = this.offsetParent(),
			defs,id,reg,filter,feGauss,
			others;
		
		
		filter = this.css("filter");
		
		if (filter) {
			
			reg = /url\((['"]?)(#\w+)\1\)/.exec(filter);
						
			if (reg) {
			
				id = reg[2];
				
				feGauss = root.find(id+" feGaussianBlur");
								
				if (feGauss.length) {
					
					if (stdDeviation == null) {
						
						stdDeviation = feGauss.attr("stdDeviation");
						return Number(stdDeviation) || 0;
					}
					else {
												
						//vérifie qu'il n'y a pas d'autres éléments (hors collection) qui utilisent ce filtre
						others = root.find("*[filter='url("+id+")']").not(this);
					
						if (others.length === 0) {
							feGauss.attr("stdDeviation",stdDeviation);
							return this;
						}
					}
				}
			}
		}
				
		if (stdDeviation == null) return 0;
				
		defs = root.find('defs');
		if (!defs.length) defs = new JSYG('<defs>').prependTo(root);
		
		id = "gaussian_blur"+JSYG.rand(0,99999999);
		
		filter = new JSYG("<filter>").id(id).appendTo(defs);
		feGauss = new JSYG("<feGaussianBlur>").attr({
			"in":"SourceGraphic",
			"stdDeviation":stdDeviation
		}).appendTo(filter);
		
		this.css("filter","url(#"+id+")");
		
		return this;
	};
	
	
	/**
	 * Style par défaut des éléments html
	 */
	var defaultStyles = {};
	
	/**
	 * Renvoie les propriétés de style par défaut du 1er élément de la collection
	 * @returns {Object}
	 */
	JSYG.prototype.getDefaultStyle = function() {
		
		var tag = this.getTag(),
			elmt,style,i,N,prop;
		
		if (tag == 'a' && this.isSVG()) tag = 'svg:a';
		
		if (!defaultStyles[tag]) {
			
			defaultStyles[tag] = {};
			
			elmt = new JSYG('<'+tag+'>');
			style = getComputedStyle(elmt[0]);
			
			for (i=0,N=style.length;i<N;i++) {
				prop = style.item(i);
				defaultStyles[tag][prop] = style.getPropertyValue(prop);
			}
		}
		
		return defaultStyles[tag];
	};
	
	
	/**
	 * Ajoute tous les éléments de style possiblement définis en css comme attributs.<br/>
	 * Cela est utile en cas d'export SVG, afin d'avoir le style dans les balises et non dans un fichier à part.<br/>
	 * @param recursive si true applique la méthode à tous les enfants.
	 * @returns {JSYG}
	 */
	JSYG.prototype.style2attr = function(recursive) {
		
		var href = window.location.href.replace('#'+window.location.hash,'');
		
		function fct() {
			
			var jThis = new JSYG(this),
				isSVG = jThis.isSVG();
			
			if (isSVG && JSYG.svgGraphics.indexOf(this.tagName) == -1) return;
			
			var style = jThis.getComputedStyle(),
				defaultStyle = jThis.getDefaultStyle(),
				styleAttr = '',
				name,value,
				i=0,N=style.length;
			
			for (;i<N;i++) {
				
				name = style.item(i);
				
				if (isSVG && JSYG.svgCssProperties.indexOf(name)===-1) continue;
				
				value = style.getPropertyValue(name);
				
				if (defaultStyle[name] != value) {
					
					//la fonction getPropertyValue renvoie url("http://monsite.fr/toto/#anchor") au lieu de url(#anchor)
					if (value.indexOf(href) != -1) value = value.replace(href,'').replace(/"|'/g,'');
					
					if (isSVG) this.setAttribute(name,value);
					else styleAttr+= name+':'+value+';';
				}
			}
			
			if (!isSVG) this.setAttribute('style',styleAttr);
		};
		
		if (recursive) this.walkTheDom(fct);
		else fct.call(this[0]);
		
		return this;
	};
	
	JSYG.getStyleRules = function() {
		
		var css = '';
		
		function addStyle(rule) { css+=rule.cssText; }
		
		JSYG.makeArray(document.styleSheets).forEach(function(styleSheet) {
			
			JSYG.makeArray(styleSheet.cssRules || styleSheet.rules).forEach(addStyle);
		});
		    
		return css;
	};

	/**
	 * Sérialise le noeud sous forme de chaîne de caractère svg 
	 * @param node noeud a représenter
	 * @returns {String}
	 * Le résultat représente un fichier svg complet
	 */
	JSYG.serializeSVG = function(node,_dim) {
			
		var serializer = new XMLSerializer(),
			jNode = new JSYG(node),
			tag = jNode.getTag(),
			isSVG = jNode.isSVG(),
			str,entete;
						
		if (tag == "svg") jNode.attr("xmlns",'http://www.w3.org/2000/svg'); //chrome

		str = serializer.serializeToString(node),
				
		entete = '<?xml version="1.0" encoding="UTF-8"?>'
			+ "\n"
			+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
			+ "\n";
		
		//sans �a, la conversion en pdf avec rsvg pose parfois des probl�mes
		str = str.replace(/ \w+:href=/g,' xlink:href=');
		str = str.replace(/ xmlns:\w+="http:\/\/www\.w3\.org\/1999\/xlink"/g,'');
									
		if (tag === 'svg') {
			
			if (!/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/.test(str)) { //rsvg toujours
				str = str.replace(/^<svg /,'<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
			}
			str = entete + str;
		}
		else {
			
			if (!_dim) _dim = jNode.getDim();
			
			entete+= '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
			if (_dim) entete+=' width="'+_dim.width+'" height="'+_dim.height+'"';
			entete+= '>\n';
			
			if (!isSVG) {
				str = "<foreignObject width='100%' height='100%'>"
					+ "<style>"+JSYG.getStyleRules()+"</style>"
					+ str
					+ "</foreignObject>";
			}
			
			str = entete + str + "\n" + "</svg>";
		}
					
		return str;
	};

	/**
	 * Convertit le 1er élément de la collection en chaîne de caractères correspondant directement à un fichier SVG.
	 * L'élément lui-même n'est pas impacté.
	 * @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
	 * et les images seront intégrées au document (plutôt que liées).
	 * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
	 * @returns {Promise}
	 */
	JSYG.prototype.toSVGString = function(standalone,imagesQuality) {
		
		var jNode = this.clone(),
			dim = this.getTag() != 'svg' && this.getDim(),
			promise;
			 			
		jNode.find('script').remove();
			
		if (standalone && this.isSVG()) {
			jNode.walkTheDom(function() {
				new JSYG(this).style2attr().attrRemove("style");
			});
		}
		
		if (standalone) promise = jNode.url2data(true,null,imagesQuality);
		else promise = Promise.resolve();
				
		return promise.then(function() {
			return JSYG.serializeSVG(jNode,dim);
		});
	};
		
	/**
	 * Convertit la collection en images sous forme d'url.
	 * L'élément lui-même n'est pas impacté.
	* @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
	 * et les images seront intégrées au document (plutôt que liées).
	 * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
	 * @returns {Promise}  
	 * @example <pre>new JSYG('#monSVG").toDataURL().then(function(src) {
	 * 
	 *     new JSYG("<img>").href(src).appendTo('body');
	 *     
	 *     //ou en javascript pur :
	 *     var img = new Image();
	 *     img.src = src;
	 *     document.body.appendChild(img);
	 * 
	 *     //afficher le résultat dans une nouvelle fenêtre :
	 *     window.open(src);
	 * });
	 *  
	 */
	JSYG.prototype.toDataURL = function(standalone,imagesQuality) {
				
		return this.toSVGString(standalone,imagesQuality).then(function(svg) {
			return "data:image/svg+xml;base64," + JSYG.base64encode(svg);
		});
	};
		
	/**
	 * Transforme les liens des images de la collection par le contenu de celles-ci.
	 * Utile pour exporter du svg en intégrant les images (sinon le svg reste dépendant des fichiers images).
	 * @param {Boolean} recursive si true cherche dans les descendants de la collection
	 * @param format optionnel, "png", "jpeg" ("png" par défaut)
	 * @param quality optionnel, qualité de 0 à 100
	 * @returns {Promise}
	 * @example <pre>//envoi du contenu svg cété serveur :
	 * new JSYG("svg image").url2data().then(function() {
	 *   new JSYG.Ajax({
	 *   	url:"sauve_image.php",
	 *   	method:"post",
	 *   	data:"img="+new JSYG('svg').toSVGString()
	 *   });
	 * });
	 */
	JSYG.prototype.url2data = function(recursive,format,quality) {
		
		var regURL = /^url\("(.*?)"\)/,
			promises = [];
				
		format = format || 'png';
		
		if (quality!=null) quality /= 100;
				
		function url2data() {
			
			var node = this,
				jNode = new JSYG(this),
				tag = jNode.getTag(),
				isImage = ['image','img'].indexOf(tag) != -1,
				matches = null,
				href;
						
			if (!isImage) {
				
				matches = jNode.css("background-image").match(regURL);
				href = matches && matches[1];
			}
			else href = jNode.href();
							
			if (!href || /^data:/.test(href)) return;
			
			promises.push( new Promise(function(resolve,reject) {
					
				var img = new Image(),
					canvas = document.createElement('canvas'),
					ctx = canvas.getContext('2d');
				
				img.onload = function() {
					
					var data;
					
					canvas.width = this.width;
					canvas.height = this.height;
					ctx.drawImage(this,0,0);
					
					try {
						
						data = canvas.toDataURL("image/"+format,quality);
											
						if (isImage) jNode.href(data); 
						else jNode.css("background-image",'url("'+data+'")');
						
						resolve(node);
					}
					catch(e) {
						/*security error for cross domain */
						reject(e);
					}
				};
				
				img.onerror = reject;
				
				img.src = href;
				
			}) );
		}

		if (recursive) this.each(function() { this.walkTheDom(url2data); },true);
		else this.each(url2data);
														
		return Promise.all(promises);
	};

	/**
	 * Convertit le 1er élément de la collection en élément canvas.
	 * L'élément lui-même n'est pas impacté.
	 * @return {Promise}
	 * @example <pre>new JSYG('#monSVG").toCanvas().then(function(canvas) {
	 *   new JSYG(canvas).appendTo("body");
	 * });
	 */
	JSYG.prototype.toCanvas = function() {
		
		var dim = this.getDim( this.offsetParent() ),
			canvas = document.createElement("canvas"),
			node = this[0],
			ctx = canvas.getContext('2d'),
			tag = this.getTag(),
			promise;
			
		canvas.width = dim.width;
		canvas.height = dim.height;
		
		if (tag == "img" || tag == "image") promise = Promise.resolve( this.href() );
		else promise = this.toDataURL();
		
		return promise.then(function(src) {
			
			return new Promise(function(resolve,reject) {
								
				function onload() {
					
					try {
						ctx.drawImage(this,0,0,dim.width,dim.height);
						resolve(canvas);
					}
					catch(e) { reject(new Error("Impossible de dessiner le noeud "+tag)); }
				}
				
				if (tag == 'canvas') return onload.call(node);
				
				var img = new Image();
				img.onload = onload;
				img.onerror = function() { reject( new Error("Impossible de charger l'image") ); };
				img.src = src;
			});
		});
	};

	/**
	 * Convertit le 1er élément de la collection en fichier image
	 * @param format optionnel, "png", "jpeg" ("png" par défaut)
	 * @param quality optionnel, qualité de 0 à 100
	 */
	JSYG.prototype.toImageFile = function(format,quality) {
		
		format = format || 'png';
		
		if (quality!=null) quality /= 100;
		
		return this.toCanvas(format,quality)
		.then(function(canvas) {
			return new Promise(function(resolve,reject) {
				if (canvas.toBlob) canvas.toBlob(resolve,'image/'+format,quality);
				else if (canvas.mozGetAsFile) {
					var file = canvas.mozGetAsFile("myFile",'image/'+format,quality);
					resolve(file);
				}
			});
		});
	};

	function canvas2gray(canvas) {
		
		var ctx = canvas.getContext('2d'),
			imageData = ctx.getImageData(0,0,canvas.width,canvas.height),
			data = imageData.data,
			i=0,N=data.length,
			color;

	    for(;i<N;i+=4) {
	      color = new JSYG.Color({r:data[i],g:data[i+1],b:data[i+2]});
	      data[i] = data[i+1] = data[i+2] = color.brightness();
	    }
	    
	    ctx.putImageData(imageData,0,0);
	    
	    return canvas;
	}

	/**
	 * Transforme les couleurs de la collection en niveaux de gris
	 * @param recursive si true, transforme récursivement tous les enfants de la collection
	 * @param callback optionnel fonction à exécuter sur chaque élément converti
	 * @param onend optionnel fonction à exécuter une fois que les transformations sont faites
	 */
	JSYG.prototype.toGrayScale = function(recursive) {
		
		var promises = [],
			regURL = /^url\("(.*?)"\)/,
			props = {
				'html' :['background','background-color','color','border-color','box-shadow'],
				'svg' : ['fill','stroke']
			},
			regColors = [
			    /rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?\.?[0-9]?)\s*\)/, //RGBA
			    /rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/, //RGB
			    /#([0-9A-F]{1})([0-9A-F]{1})([0-9A-F]{1})/, //HEXA 3
			    /#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/ //HEXA 6
			];
			
		function toGrayScale() {
			
			var jThis = new JSYG(this),
				isSVG = jThis.isSVG(),
				tag = jThis.getTag(),
				val,matches,
				promise;
						
			if (jThis.isSVG() && JSYG.svgGraphics.indexOf(tag) == -1) return;
			
			if (tag == "img" || tag == "image") {
				
				 promise = jThis.toCanvas().then(function(canvas) {
					
					try {
						canvas = canvas2gray(canvas);	
						new JSYG(this).href( canvas.toDataURL() );
					}
					catch(e) {}
					
				});
				 
				promises.push(promise);
			}
			else {
				
				if (isSVG) {
					
					props.svg.forEach(function(prop) {
						
						var val = jThis.css(prop),
							gray;

						if (!val) return;
						
						try {
							gray = new JSYG.Color(val).grayScale();
							jThis.css(prop, gray.toString() );
						}
						catch(e) { }
					});
				}
				else {
					
					props.html.forEach(function(prop) {
						
						var val = jThis.css(prop),
							test = false, color;

						if (!val) return;
											
						regColors.forEach(function(regColor) {
							
							var matches = val.match(regColor);
							
							color = matches && matches[0];
													
							if (color) {
								
								try {
									gray = new JSYG.Color(color).grayScale();
									val = val.replace(color,gray);
									test = true;
								}
								catch(e) {} 
							}
							
						});
						
						if (!test) {
							
							for (color in JSYG.Color.htmlCodes) {
																
								if (val.indexOf(color) != -1) {
									
									gray = new JSYG.Color(color).grayScale();
									val = val.replace(color,gray);
									test = true;
								}
							}
						}
											
						test && jThis.css(prop,val);
					});
					
					
					matches = jThis.css("background-image").match(regURL);
					val = matches && matches[1];
					
					if (val) {
						
						promise = new Promise(function(resolve,reject) {
							
							var img = new Image(),
								canvas = document.createElement('canvas'),
								ctx = canvas.getContext('2d');
							
							img.onload = function() {
								
								var data;
								
								canvas.width = this.width;
								canvas.height = this.height;
								ctx.drawImage(this,0,0);
								
								canvas = canvas2gray(canvas);
								
								try {
									
									data = canvas.toDataURL("image/png");													
									jThis.css("background-image",'url("'+data+'")');
									resolve();
								}
								catch(e) {
									//security error for cross domain
									reject(e);
								}
							};
							
							img.src = val;
						});
						
						promises.push(promise);
					}
				}
			}
		}
		
		if (recursive) this.each(function() { this.walkTheDom(toGrayScale); },true);
		else this.each(toGrayScale);
														
		return Promise.all(promises);
	};
	
}());
