(function() {
	
	var define, require;

	(function() {
		
	  var registry = {}, seen = {};
	
	  define = function(name, deps, callback) {
	    registry[name] = { deps: deps, callback: callback };
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
	        i,l,value;
	
	    for (i=0,l=deps.length; i<l; i++) {
	    	if (deps[i] === 'exports') reified.push(exports = {});
	    	else reified.push(require(resolve(deps[i])));
	    }
	
	    value = callback.apply(this, reified);
	    
	    return seen[name] = exports || value;
	
	    function resolve(child) {
	    	
	    	if (child.charAt(0) !== '.') return child;
	    	
	    	var parts = child.split("/"),
	    		parentBase = name.split("/").slice(0, -1),
	    		i,l,part;
	
	    	for (i=0,l=parts.length; i<l; i++) {
	    		part = parts[i];
	    		if (part === '..')parentBase.pop();
	    		else if (part === '.') continue;
	    		else parentBase.push(part);
	    	}
	
	    	return parentBase.join("/");
	    }
	  };
	  
	})();

	define("JSYG",[],function() {
						
		if (!jQuery) throw new Error("jQuery is needed");
		
		var NS = {
				html : 'http://www.w3.org/1999/xhtml',
				svg : 'http://www.w3.org/2000/svg',
				xlink : 'http://www.w3.org/1999/xlink'
			},
			rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
			rsvgLink = /^<(svg:a)\s*\/?>(?:<\/\1>|)$/,
			svg = window.document && window.document.createElementNS && window.document.createElementNS(NS.svg,'svg'),
			$ = jQuery;
		
		function JSYG(arg,context) {
			
			if (!(this instanceof JSYG)) return new JSYG(arg,context);
			else {
				//pour les appels à this.constructor() dans jQuery sans mettre le merdier
				for (var n in this) {
					if (this.hasOwnProperty(n)) return new JSYG(arg,context);
				}
			}
			
			var array = null, ret;
			
			this.length = 0;
			
			if (arg instanceof JSYG) array = arg;
			
			if (typeof arg === 'string') {
				
				arg = arg.trim();
				
				if (arg.charAt(0) === "<" && arg.charAt( arg.length - 1 ) === ">" && arg.length >= 3) {
				
					//cas spécial pour créer un lien svg
					if (rsvgLink.test(arg)) array = [ document.createElementNS(NS.svg,'a') ];
					else {
							
						ret = rsingleTag.exec(arg);
						
						if (ret && JSYG.svgTags.indexOf(ret[1]) !== -1)
							array = [ document.createElementNS(NS.svg , ret[1]) ];					
					}
				}
			}
					
			$.merge(this, array ? array : $(arg,context) );
					
			return this;
		}
		
		JSYG.fn = JSYG.prototype = new $();
			
		JSYG.prototype.constructor = JSYG;
		
		/**
		 * Liste des propriétés SVG stylables en css
		 */
		JSYG.svgCssProperties = [ 'font','font-family','font-size','font-size-adjust','font-stretch','font-style','font-variant','font-weight', 'direction','letter-spacing','text-decoration','unicode-bidi','word-spacing', 'clip','color','cursor','display','overflow','visibility', 'clip-path','clip-rule','mask','opacity', 'enable-background','filter','flood-color','flood-opacity','lighting-color','stop-color','stop-opacity','pointer-events', 'color-interpolation','color-interpolation-filters','color-profile','color-rendering','fill','fill-opacity','fill-rule','image-rendering','marker','marker-end','marker-mid','marker-start','shape-rendering','stroke','stroke-dasharray','stroke-dashoffset','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-opacity','stroke-width','text-rendering','alignment-baseline','baseline-shift','dominant-baseline','glyph-orientation-horizontal','glyph-orientation-vertical','kerning','text-anchor','writing-mode' ];
		/**
		 * Liste des balises SVG
		 */
		JSYG.svgTags = ['altGlyph','altGlyphDef','altGlyphItem','animate','animateColor','animateMotion','animateTransform','circle','clipPath','color-profile','cursor','definition-src','defs','desc','ellipse','feBlend','feColorMatrix','feComponentTransfer','feComposite','feConvolveMatrix','feDiffuseLighting','feDisplacementMap','feDistantLight','feFlood','feFuncA','feFuncB','feFuncG','feFuncR','feGaussianBlur','feImage','feMerge','feMergeNode','feMorphology','feOffset','fePointLight','feSpecularLighting','feSpotLight','feTile','feTurbulence','filter','font','font-face','font-face-format','font-face-name','font-face-src','font-face-uri','foreignObject','g','glyph','glyphRef','hkern','image','line','linearGradient','marker','mask','metadata','missing-glyph','mpath','path','pattern','polygon','polyline','radialGradient','rect','set','stop','style','svg','switch','symbol','text','textPath','title','tref','tspan','use','view','vkern'];
		/**
		 * Liste des elements SVG pouvant utiliser l'attribut viewBox
		 */
		JSYG.svgViewBoxTags = ['svg','symbol','image','marker','pattern','view'];
	
		
		JSYG.ns = NS;
		
		JSYG.prototype.isSVG = function() {
			return this[0] && this[0].namespaceURI == NS.svg;
		};
		
		JSYG.prototype.isSVGroot = function() {
			if (this[0].tagName != 'svg') return false;
			var parent = new JSYG(this[0]).parent();
			return parent.length && !parent.isSVG();
		};
			
		function xlinkHref(val) {
			
			if (val == null) {
				return (this.isSVG() ? this[0].getAttributeNS(NS.xlink,'href') : this[0].href) || "";
			}
			
			this.each(function() {
					
				if (this.namespaceURI == NS.svg){
					
					this.removeAttributeNS(NS.xlink,'href'); //sinon ajoute un nouvel attribut
					this.setAttributeNS(NS.xlink,'href',val);
				} 
				else this.href = val;
			});
			
			return this;
		}
		
		function xlinkHrefRemove() {
			
			this.each(function() {
					
				if (this.namespaceURI == NS.svg) this.removeAttributeNS(NS.xlink,'href');
				else this.removeAttribute("href");
			});
			
			return this;
		}
		
		JSYG.prototype.attr = function(name,value) {
					
			if ($.isPlainObject(name)) {
				
				for (var n in name) this.attr(n,name[n]);
				return this;
			}
			else if ($.isFunction(value)) {
				
				return this.each(function(j) {
					var $this = new JSYG(this);
					$this.attr(name,value.call(this,j,$this.attr('href')));
				});
			}
			else if (name == "href") return xlinkHref.call(this,value);
			else if (name == "viewBox" || name== "viewbox"){
				
				if (value === undefined) return this[0].getAttribute("viewBox");
				
				return this.each(function() {
					if (JSYG.svgViewBoxTags.indexOf(this.tagName) !=-1)
						this.setAttribute("viewBox",value);					
				});
			}
			else return $.fn.attr.apply(this,arguments);
		};
		
		JSYG.prototype.attrRemove = function(name) {
			
			if (typeof name == "string" && name == "href") return xlinkHrefRemove.call(this);
			else return $.fn.attr.apply(this,arguments);
		};
		
		JSYG.each = function(list,callback) {
			
			if (typeof list == 'object' && typeof list.numberOfItems == "number") { //SVGList
				
				var item;
				
				for (var i=0,N=list.numberOfItems;i<N;i++) {
					item = list.getItem(i);
					if (callback.call(item,i,item) === false) return list;
				}
				
				return list;
			}
			else return $.each(list,callback);
		};
		
		JSYG.makeArray = function(list) {
					
			if (typeof list == 'object' && typeof list.numberOfItems == "number") { //SVGList
			
				var tab = [];
			
				for (var i=0,N=list.numberOfItems;i<N;i++) tab.push(list.getItem(i));
				
				return tab;
			}
			else return $.makeArray(list);		
		};
		
		JSYG.prototype.offsetParent = function(arg) {
			
			var tab = [];
			
			this.each(function() {
				
				var elmt,
					farthest = null,
					$this = new JSYG(this);
				
				if ($this.isSVG()) {
					
					if (!$this.isSVGroot()) {
						
						if (arg === 'farthest') elmt = this.farthestViewportElement;
						else elmt = this.nearestViewportElement;
						
						if (!elmt) { //les éléments non tracés (dans une balise defs) ne renvoient rien, par simplicité on renvoit la balise svg parente
							
							elmt = this.parentNode;
							
							while (elmt && (arg == "farthest" || JSYG.svgViewBoxTags.indexOf(elmt.tagName)==-1)) {
								elmt = elmt.parentNode;
								if (elmt.tagName == "svg") farthest = elmt;
							}
							
							if (farthest) elmt = farthest;
						}
					}
					else {
						
						elmt = this.parentNode;
						if (elmt.nodeName != "html" && new JSYG(elmt).css("position") == "static")
							elmt = $.fn.offsetParent.call($this)[0];
					}
					
				}
				else {
				
					if (arg === 'farthest') elmt = document.body;
					else elmt = $.fn.offsetParent.call($this)[0];
				}
				
				if (elmt) tab.push(elmt);
				
			});
			
			return new JSYG(tab);
		};
		
		var rCamelCase = /[A-Z]/g,
			rDash = /-([a-z])/ig;
			
		function dasherize(str) {
			return str.replace(rCamelCase,function(str){ return '-'+str.toLowerCase();});
		}
		
		function camelize(str) {
			return str.replace(rDash,function(p,p1){ return p1.toUpperCase();});
		}
			
		JSYG.prototype.css = function(prop,val) {
			
			var n=null,obj;
			
			if ($.isPlainObject(prop)) {
				
				for (n in prop) this.css(n,prop[n]);
				return this;
			}
			else if (Array.isArray(prop)) {
				
				obj = {};
				for (n=0;n<prop.length;n++) obj[prop[n]] = this.css(prop[n]);
				return obj;
			}
			else if ($.isFunction(val)) {
				
				return this.each(function(i) {
					var $this = new JSYG(this);
					$this.css( val.call(this,i,$this.css(prop)) );
				});
			}
					
			var cssProp = dasherize(prop),
				jsProp = camelize(prop);
			
			if (val == null) {
				
				if (this.isSVG()) {
					
					if (this[0].style) {
						
						val = this[0].style[jsProp];
						
						if (!val && this[0].getAttribute) {
						
							val = this[0].getAttribute(cssProp);
						
							if (val == null && window.getComputedStyle)
								val = window.getComputedStyle(this[0],null).getPropertyValue(cssProp);
						}
					}
				}
				else val = $.fn.css.call(this,prop);
				
				return val;
			}
			
			return this.each(function() {
				
				var $this = new JSYG(this);
				
				if ($this.isSVG()) {
					if (!$this.isSVGroot() || cssProp == "width" || cssProp == "height") this.setAttribute(cssProp,val);
				}
				//if (JSYG.svgCssProperties.indexOf(cssProp) != -1) $.fn.css.call($this,prop,val);
				$.fn.css.call($this,prop,val);
			});
		};
		
		JSYG.support = {
				
			svg : svg,
			
			classList : {
				
				html : (function() {
					var el = document.createElement('div');
					return el.classList && typeof el.classList.add === 'function';
				}()),
				
				//classList peut exister sur les éléments SVG mais être sans effet...
				svg : (function() {
					var el = new JSYG('<ellipse>')[0];
					if (!el || !el.classList || !el.classList.add) return false;
					el.classList.add('toto');
					return el.getAttribute('class') === 'toto';
				})()
			}
		};
		
		(function() {
			
			if (!svg || typeof document === "undefined") return false;
			
			var defs,use,
				id = 'rect'+ Math.random().toString().replace( /\D/g, "" );
			
			defs = new JSYG('<defs>');
			defs.appendTo(svg);
			
			new JSYG('<rect>')
			.attr({"id":id,x:10,y:10,width:10,height:10})
			.appendTo(defs);
						
			use = new JSYG('<use>').attr({id:"use",x:10,y:10,href:'#'+id}).appendTo(svg);
						
			document.body.appendChild(svg);
						
			JSYG.support.svgUseBBox = use[0].getBBox().x == 20;
						
			JSYG.support.svgUseTransform = use[0].getTransformToElement(svg).e !== 0;
	
			use.remove();
			defs.remove();			
			document.body.removeChild(svg);
			
		}());
		
		JSYG.prototype.position = function() {
			
			if (!this.isSVG()) return $.fn.position.call(this);
			
			var dim,box,
				tag = this[0].tagName;
				
			if (tag == 'svg') {
				
				if (this.parent().isSVG()) {
					
					dim = {
						left : parseFloat(this.attr('x')) || 0,
						top : parseFloat(this.attr('y')) || 0
					};
				}
				else dim = $.fn.position.call(this);
			}
			else {
				
				box = this[0].getBBox();
				
				dim = { //box est en lecture seule
					left : box.x,
					top : box.y
				};
				
				if (tag === 'use' && !JSYG.support.svgUseBBox) {
					//bbox fait alors référence à l'élément source donc il faut ajouter les attributs de l'élément lui-même
					dim.left += parseFloat(this.attr('x'))  || 0;
					dim.top += parseFloat(this.attr('y')) || 0;
				}
			}
			
			return dim;
		};
		
		JSYG.prototype.offset = function(coordinates) {
			
			var x,y,box,mtx,point,offset;
			
			if (!coordinates) {
										
				if (!this.isSVG()) return $.fn.offset.call(this);
							
				if (this[0].tagName == "svg") {
					
					if (this.isSVGroot()) {
						x = 0;
						y = 0;
					}
					else {
						x = parseFloat(this.attr('x')) || 0;
						y = parseFloat(this.attr('y')) || 0;
					}
											
					box = this.attr("viewBox");
					if (box) this.attrRemove("viewBox");
					
					mtx = this[0].getScreenCTM();
								
					if (box) this.attr("viewBox",box);
																			
					point = new JSYG.Point(x,y).mtx(mtx);
									
					offset = {
						left : point.x,
						top : point.y
					};
					
				}
				else offset = this[0].getBoundingClientRect();
																
				offset = {
					left : Math.round( offset.left + window.pageXOffset - document.documentElement.clientLeft ),
					top : Math.round( offset.top + window.pageYOffset - document.documentElement.clientTop )
				};
				
				return offset;
			}
		};
		
		
		JSYG.prototype.addClass = function(name) {
			
			var a = arguments,
				i,N=a.length;
			
			this.each(function(j) {
				
				var $this = new JSYG(this),
					isSVG = $this.isSVG(),
					natif = JSYG.support.classList[ isSVG ? "svg" : "html"],
					oldClasse,
					newClasse,
					className;
			
				oldClasse = (isSVG ? this.getAttribute('class') : this.className) || '';
				
				newClasse = oldClasse;
						
				for (i=0;i<N;i++) {
					
					className = a[i];
					
					if ($.isFunction(className)) {
						
						$this.addClass( className.call(this,j,oldClasse) );
						continue;
					}
					else if (typeof className == 'string') {
					
						className = className.trim();
						
						if (className.indexOf(' ')==-1) {
							
							if (natif) this.classList.add(className);
							else {
								if (!$this.hasClass(className)) newClasse = (newClasse ? newClasse+' ' : '') + className;
							}
						}
						else $this.addClass.apply($this,className.split(/\s+/));
					}
				}
						
				if (!natif && oldClasse != newClasse) {
					
					if (isSVG) this.setAttribute('class',newClasse);
					else this.className = newClasse;
				}
			});
			
			return this;
		};
		
		JSYG.prototype.removeClass = function(name) {
			
			var a = arguments,
				i,N=a.length;
			
			this.each(function() {
			
				var $this = new JSYG(this),
					isSVG = $this.isSVG(),
					natif = JSYG.support.classList[isSVG ? "svg" : "html"],
					oldClasse,
					newClasse,
					className,
					reg;
						
				oldClasse = (isSVG ? this.getAttribute('class') : this.className) || '';
				
				newClasse = oldClasse;
						
				for (i=0;i<N;i++) {
					
					className = a[i];
					
					if ($.isFunction(className)) {
						
						$this.removeClass( className.call(this,i,oldClasse) );
						continue;
					}
					else if (typeof className == 'string') {
	
						className = className.trim();
									
						if (className.indexOf(' ')==-1) {
							
							if (natif) this.classList.remove(className);
							else {
								reg = new RegExp('(^|\\s+)'+className);
								newClasse = newClasse.replace(reg,'');
							}
						}
						else $this.removeClass.apply($this,className.split(/\s+/));
					}
				}
				
				if (!natif && newClasse != oldClasse) {
					if (isSVG) this.setAttribute('class',newClasse);
					else this.className = newClasse;
				}
				
				return null;
				
			});
			
			return this;
		};
	
		JSYG.prototype.hasClass = function(name) {
			
			var a=arguments,
				i,N=a.length,
				test=false;
			
			this.each(function() {
				
				var $this = new JSYG(this),
					isSVG = $this.isSVG(),
					natif = JSYG.support.classList[isSVG ? "svg" : "html"],
					classe = "",
					className,
					reg;
				
				if (!natif) classe = (isSVG ? this.getAttribute('class') : this.className) || '';
							
				for (i=0;i<N;i++) {
					
					className = a[i];
					if (typeof className !== 'string') continue;
					className = className.trim();
								
					if (className.indexOf(' ')==-1) {
					
						if (natif) {
							if (this.classList.contains(className)) { test = true; return false; }
						}
						else {
							reg = new RegExp('(^|\\s+)'+className);
							if (reg.test(classe)) { test = true; return false; }
						}
					}
					else {
						
						if ($this.hasClass.apply($this,className.split(/ +/))) { test = true; return false; }
					}
				}
			});
			
			return test;		
		};
		
		JSYG.prototype.toggleClass = function(name) {
		
			var a = arguments,
				i,N=a.length;
						
			this.each(function() {
			
				var $this = new JSYG(this),
					isSVG = $this.isSVG(),
					natif = JSYG.support.classList[isSVG ? "svg" : "html"],
					className;
					
				for (i=0;i<N;i++) {
					
					className = a[i];
					if (typeof className !== 'string') continue;
					className = className.trim();
								
					if (className.indexOf(' ')===-1) {
						
						if (natif) this.classList.toggle(className);
						else {
							if ($this.hasClass(className)) $this.removeClass(className);
							else $this.addClass(className);
						}
					}
					else {
						return $this.toggleClass.apply($this,className.split(/\s+/));
					}
				}
			});
			
			return this;
		};
		
		JSYG.Point = function(x,y) {
			
			if (typeof x === 'object' && y == null) {
				y = x.y;
				x = x.x;
			}
			
			this.x = (typeof x == "number") ? x : parseFloat(x);
			this.y = (typeof y == "number") ? y : parseFloat(y);
		};
		
		JSYG.Point.prototype = {
				
			constructor : JSYG.Point,
			
			/**
			 * Applique une matrice de transformation 
			 * @param mtx instance de JSYG.Matrix (ou SVGMatrix)
			 * @returns nouvelle instance
			 */
			mtx : function(mtx) {
			
				if (JSYG.Matrix && (mtx instanceof JSYG.Matrix)) mtx = mtx.mtx;
				if (!mtx) return new JSYG.Point(this.x,this.y);
				
				var point = svg.createSVGPoint();
				point.x = this.x;
				point.y = this.y;
				point = point.matrixTransform(mtx);
				
				return new this.constructor(point.x,point.y);
			}
		};
		
		(function() {
			
			var hookWidthOri = $.cssHooks.width,
				hookHeightOri = $.cssHooks.height;
			
			$.cssHooks.width = {
					
				get: function( elem, computed, extra ) {
					
					if (elem.namespaceURI != NS.svg || elem.tagName == 'svg' && elem.parentNode && elem.parentNode.namespaceURI != NS.svg) return hookWidthOri.get.apply(null,arguments);
					else try { return elem.getBBox && elem.getBBox().width+"px"; }
					catch (e) { return null; }
				},
				
				set: function( elem, value ) {
					
					var $elem = new JSYG(elem),
						width = hookWidthOri.set.apply(null,arguments);
									
					if (!$elem.isSVG()) return width;
					
					width = parseFloat( (typeof value == "function") ? value.call(elem,i,$elem.width()) : value );
					
					switch (elem.tagName) {
					
						case 'circle' :
							elem.setAttribute('r',width/2);
							break;
						
						case 'ellipse' :
							elem.setAttribute('rx',width/2);
							break;
						
						default :
							elem.setAttribute("width",width);
					}
					
					return width+"px";
				}
			};
			
			$.cssHooks.height = {
					
				get: function( elem, computed, extra ) {
					
					if (elem.namespaceURI != NS.svg || elem.tagName == 'svg' && elem.parentNode && elem.parentNode.namespaceURI != NS.svg) return hookHeightOri.get.apply(null,arguments);
					else try { return elem.getBBox && elem.getBBox().height+"px"; }
					catch (e) { return null; }
				},
				
				set: function( elem, value ) {
					
					var height = hookHeightOri.set.apply(null,arguments);
									
					if (elem.namespaceURI != NS.svg) return height;
					
					height = parseFloat( (typeof value == "function") ? value.call(elem,i,$elem.height()) : value );
					
					switch (this.tagName) {
					
						case 'circle' :
							elem.setAttribute('r',height/2);
							break;
						
						case 'ellipse' :
							elem.setAttribute('ry',height/2);
							break;
						
						default :
							elem.setAttribute("height",height);
					}
					
					return height+"px";
				}
			};
			/*
			JSYG.svgCssProperties.forEach(function(prop) {
				
				var hookOri = $.cssHooks[prop],
					camelized = camelize(prop),
					dasherized = dasherize(prop);
				
				$.cssHooks[prop] = {
					
					get : function(elem, computed, extra) {
						
						var value = hookOri ? hookOri.get.apply(null,arguments) : $.css(elem,prop);
						
						if (elem.namespaceURI != NS.svg) return value;
						else {
							
							if (elem.style) {
								
								value = elem.style[camelized];
								
								if (value == null && elem.getAttribute) {
									
									value = elem.getAttribute(dasherized);
								
									if (value == null && window.getComputedStyle)
										value = window.getComputedStyle(this[0],null).getPropertyValue(dasherized);
								}
							}
						}
					},
					
					set : function(elem, value) {
						elem.style[camelized] = value;
						if (elem.namespaceURI == NS.svg) elem.setAttribute(dasherized,value);
					}
				};
			});
			*/
		}());
		
		/**
		 * Arrondi d'un nombre avec nombre de décimales précisé
		 * @param number
		 * @param precision nombre de décimales
		 * @returns {Number}
		 */
		JSYG.round = function(number,precision) {
			return Math.round(number * Math.pow(10,precision)) / Math.pow(10,precision);
		};
		
		
		//Récupère toutes les fonctions statiques
		(function() {
			for (var n in $) {
				if ($.hasOwnProperty(n) && !JSYG.hasOwnProperty(n)) JSYG[n] = $[n];
			}
		}());
							
		window.JSYG = JSYG;
		
		return JSYG;
		
	//}));
	});
	
	define('Vect',["JSYG"],function(JSYG) {
		
		
	
		/**
		 * Constructeur de vecteurs.
		 * On peut passer en argument un objet avec les propriétés x et y.
		 * @param x abcisse
		 * @param y ordonnée
		 * @returns {JSYG.Vect}
		 * @link http://www.w3.org/TR/SVG/coords.html#InterfaceSVGPoint
		 */
		JSYG.Vect = function(x,y) {
			
			JSYG.Point.call(this,x,y);
		};
		
		JSYG.Vect.prototype = new JSYG.Point(0,0);
				
		JSYG.Vect.prototype.constructor = JSYG.Vect;
						
		/**
		 * Longueur du vecteur
		 * @returns {Number}
		 */
		JSYG.Vect.prototype.length = function() { return Math.sqrt( Math.pow(this.x,2) + Math.pow(this.y,2) ); };
			
		/**
		 * Normalise le vecteur
		 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
		 */
		JSYG.Vect.prototype.normalize = function() {
			var length = this.length();
			return new JSYG.Vect( this.x / length,this.y / length );
		};
		
		/**
		 * Combine deux vecteurs
		 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
		 */
		JSYG.Vect.prototype.combine = function(pt,ascl,bscl) {
			return new JSYG.Vect(
				(ascl * this.x) + (bscl * pt.x),
				(ascl * this.y) + (bscl * pt.y)
			);
		};
		
		/**
		 * Renvoie le produit scalaire de deux vecteurs
		 * @param vect instance de JSYG.Vect ou tout objet avec les propriétés x et y.
		 * @returns {Number}
		 */
		JSYG.Vect.prototype.dot = function(vect) { return (this.x * vect.x) + (this.y * vect.y); };
		
		return JSYG.Vect;
		
	});
	define('String',["JSYG"],function(JSYG) {
		
		
		
		var rTags = /<\/?([a-z]\w*)\b[^>]*>/gi;
		
		function regexpTag(tag) { return new RegExp("<("+tag+")\\b[^>]*>([\\s\\S]*?)<\\/\\1>","gi");};
		
		/**
		 * Constructeur de chaînes de caract�res JSYG
		 * @param arg null, chaîne ou objet (appel de la méthode toString de l'objet)
		 * @returns {JSYG.String}
		 */
		JSYG.String = function(arg) {
			
			if (arg && arg.toString) { this.str = arg.toString(); }
			else { this.str = ''; }
		};
		
		JSYG.String.prototype = {
				
			/**
			 * Objet string original
			 */
			str : null,
	
			constructor : JSYG.String,
			/**
			 * Fonctionne comme substr en PHP
			 * @param deb : indice de d�but
			 * @param fin : indice de fin
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 * 
			 */
			substr : function(deb,fin) {
				if (deb<0){ deb = this.str.length+deb;}
				if (fin == null) {fin = this.str.length;} 
				else if (fin<0){ fin = this.str.length-deb+fin;}
				return new JSYG.String(this.str.substr(deb,fin));
			},
		
			indexOf : function(pattern) {
				return this.str.indexOf(pattern);
			},
			/**
			 * Met la premi�re lettre de la chaîne en majuscule
			 * @returns {JSYG.String} chaîne modifi�e
			 */
			ucfirst : function() {
				return new JSYG.String(this.str.replace(/^[a-z]/,function($1){ return $1.toUpperCase();}));
			},
			
			/**
			 * Met la premi�re lettre de la chaîne en minuscule
			 * @returns {JSYG.String} chaîne modifi�e
			 */
			lcfirst : function() {
				return new JSYG.String(this.str.replace(/^[A-Z]/,function($1){ return $1.toLowerCase();}));
			},
			
			/**
			 * Met la premi�re lettre de chaque mot en majuscule
			 * @returns {String} chaîne modifi�e
			 */
			ucwords : function() {
				return new JSYG.String(this.str.ucfirst().replace(/\s[a-z]/g,function($1){ return $1.toUpperCase();}));
			},
			
			/**
			 * Fonctionne comme preg_replace en PHP
			 * @param pattern
			 * @param remplace
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			replace : function(pattern,remplace) {
				
				var str = new String(this.str.valueOf());
				
				if (!(pattern instanceof Array)) { pattern = [pattern]; }
				if (!(remplace instanceof Array)) { remplace = [remplace]; }
				
				for (var i=0,N=pattern.length;i<N;i++){
					str = str.replace(pattern[i],remplace[i]);
				}
				return new JSYG.String(str);
			},
			
			/**
			 * Retire les accents de la chaîne 
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			stripAccents : function()
			{
				var search = 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ',
					remplace = 'aaaaaceeeeiiiinooooouuuuyy',
					str = this.str;
				
				for (var i=0,N=search.length;i<N;i++) str  = str.replace( new RegExp(search[i],'ig') , remplace[i] );
				
				return new JSYG.String(str);
			},
			
			/**
			 * Retire les balises de la chaîne
			 * @param allowed balise autoris�e. Le nombre d'arguments n'est pas limit�.
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 * @example new JSYG.String('&lt;tata&gt;toto&lt;/tata&gt;').stripTags('br','span').valueOf() == 'toto';
			 * @see stripTagsR
			 */
			stripTags : function(allowed) {
				allowed = slice.call(arguments);
			    return this.replace(rTags, function (str, p1) { return allowed.indexOf(p1.toLowerCase()) !== -1 ? str : '';});
			},
			
			/**
			 * Retire les balises de la chaîne.
			 * A la diff�rence de stripTags, cette méthode fonction avec une liste noire plut�t qu'une liste blanche.
			 * @param forbidden balise à retirer. Le nombre d'arguments n'est pas limit�.
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 * @see stripTags
			 */
			stripTagsR : function(forbidden) {
				forbidden = slice.call(arguments);
			    return this.replace(rTags, function (str, p1) { return forbidden.indexOf(p1.toLowerCase()) !== -1 ? '' : str;});
			},
			
			/**
			 * Retire les attributs des balises
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			stripAttributes : function() {
				return this.replace('/<([a-z]\w*)\b[^>]*>/i', function($1) { return '<'+$1+'>'; });
			},
			
			/**
			 * récupère le(s) contenu(s) d'une balise donnée sous forme de tableau de chaînes 
			 * @param tag nom de la balise dont on veut récupèrer le contenu
			 * @returns {Array} chaque élément du tableau est le contenu d'une balise tag
			 */
			getTagContent : function(tag) {
				
				var regexp = regexpTag(tag);
				var occ = this.str.match(regexp);
						
				if (occ===null) { return null; }
				
				for (var i=0,N=occ.length;i<N;i++) { occ[i] = occ[i].replace(regexp,function(str,p1) { return p1; }); }
				
				return occ;
			},
			
			/**
			 * Retire les balises et leur contenu
			 * @param tag nom de la balise à supprimer
			 * @param {Array} content tableau qui sera rempli par le contenu des balises trouv�es (les tableaux passent par référence)
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			stripTagAndContent : function(tag,content) {
				return this.replace(regexpTag(tag),function(str,p1,p2) { content && content.push(p2); return ''; });
			},
			
			/**
			 * Transforme la chaîne en chaîne de type camelCase (style javascript, les majuscules remplacent les espaces/tirets/underscores)
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 * @see JSYG.String.prototype.dasherize
			 */
			camelize : function() {
				return this.replace(/(-|_|\s+)([a-z])/ig,function(str,p1,p2){ return p2.toUpperCase();});
			},
			
			/**
			 * Remplace les majuscules d'une chaîne camelCase par un tiret
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 * @see JSYG.String.prototype.dasherize
			 */
			dasherize : function() {
				return this.replace(/[A-Z]/g,function(str){ return '-'+str.toLowerCase();});
			},
			
			/**
			 * Suppression des blancs/tabulations/retours chariots en d�but et fin de chaîne
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			trim : function() {
				return new JSYG.String(this.str.trim());
			},
			
			/**
			 * Ex�cution d'une fonction de rappel sur chaque caract�re de la chaîne
			 * @param {Function} callback
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			forEach : function(callback) {
				Array.prototype.forEach.call(this.str,callback);
				return this;
			},
			
			/**
			 * Formate la chaîne pour transmission par chaîne de requête
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			urlencode : function() {
				return new JSYG.String( JSYG.urlencode(this.str) );
			},
			
			/**
			 * D�code la chaîne issue d'une chaîne de requête
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			urldecode : function() {
				return new JSYG.String( JSYG.urldecode(this.str) );
			},
			
			/**
			 * Formate la chaîne au format UTF8
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			utf8encode : function() {
				return new JSYG.String( JSYG.isUtf8(this.str) ? this.str : JSYG.utf8encode(this.str) );
			},
			
			/**
			 * Formate la chaîne UTF8 en ISO-8859-1
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			utf8decode : function() {
				return new JSYG.String( JSYG.isUtf8(this.str) ? JSYG.utf8decode(this.str) : this.str );
			},
			/**
			 * Détecte si la chaîne est au format uft8 ou non
			 */
			isUtf8 : function() {
				return JSYG.isUtf8(this.str);
			},
			/**
			 * Encode la chaîne en base 64
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			base64encode : function() {
				return new JSYG.String( JSYG.base64encode(this.str) );
			},
			
			/**
			 * D�code la chaîne cod�e en base 64
			 * @returns {JSYG.String} nouvelle instance de JSYG.String
			 */
			base64decode : function() {
				return new JSYG.String( JSYG.base64decode(this.str) );
			},
			
			/**
			 * Renvoie la chaîne de caract�res correspondant à l'instance
			 * @returns {String}
			 */
			valueOf : function() { return this.str; },
			
			/**
			 * Permet les conversions implicites en chaîne de caractère
			 * @returns {String}
			 */
			toString : function() { return this.str; }
		};
		
		/**
		 * Encode une chaîne en base 64.
		 * @param input chaîne à encoder
		 * @returns {String}
		 */
		JSYG.base64encode = function(input) { return window.btoa( JSYG.utf8encode(input) ); };
	
		/**
		 * D�code une chaîne cod�e en base 64.
		 * @param input chaîne à d�coder
		 * @returns {String}
		 */
		JSYG.base64decode  = function(input) { return JSYG.utf8decode( window.atob(input) ); };
		
		/**
		* Formate une chaîne pour transmission par chaîne de requête
		* @param str chaîne à formater
		* @returns {String}
		*/
		JSYG.urlencode = function(str) {
			return window.encodeURIComponent(str);
		};
		
		/**
		* Decode une chaîne apr�s transmission par chaîne de requête
		* @param str chaîne à d�coder
		* @returns {String}
		*/
		JSYG.urldecode = function(str) {
			return window.decodeURIComponent(str);
		};
		
		/**
		 * Encodage d'une chaîne au format UTF8
		 * @param string
		 * @returns {String}
		 */
		JSYG.utf8encode = function(string) {
			//Johan Sundstr�m
			return window.unescape( JSYG.urlencode( string ) );
		};
		
		/**
		 * Décodage d'une chaîne UTF8 en ISO-8859-1
		 * @param string
		 * @returns {String}
		 */
		JSYG.utf8decode = function(string) {
			//Johan Sundstr�m
			return JSYG.urldecode( window.escape(string) );
		};
		
		/**
		 * Détecte si la chaîne est encodée en UTF8 ou non
		 * @param string
		 * @returns {Boolean}
		 * @link https://github.com/wayfind/is-utf8
		 */
		JSYG.isUtf8 = function(string) {
			
		    var i = 0;
		    while(i < string.length)
		    {
		        if(     (// ASCII
		                    string[i] == 0x09 ||
		                    string[i] == 0x0A ||
		                    string[i] == 0x0D ||
		                    (0x20 <= string[i] && string[i] <= 0x7E)
		                )
		          ) {
		              i += 1;
		              continue;
		          }
	
		        if(     (// non-overlong 2-byte
		                    (0xC2 <= string[i] && string[i] <= 0xDF) &&
		                    (0x80 <= string[i+1] && string[i+1] <= 0xBF)
		                )
		          ) {
		              i += 2;
		              continue;
		          }
	
		        if(     (// excluding overlongs
		                    string[i] == 0xE0 &&
		                    (0xA0 <= string[i + 1] && string[i + 1] <= 0xBF) &&
		                    (0x80 <= string[i + 2] && string[i + 2] <= 0xBF)
		                ) ||
		                (// straight 3-byte
		                 ((0xE1 <= string[i] && string[i] <= 0xEC) ||
		                  string[i] == 0xEE ||
		                  string[i] == 0xEF) &&
		                 (0x80 <= string[i + 1] && string[i+1] <= 0xBF) &&
		                 (0x80 <= string[i+2] && string[i+2] <= 0xBF)
		                ) ||
		                (// excluding surrogates
		                 string[i] == 0xED &&
		                 (0x80 <= string[i+1] && string[i+1] <= 0x9F) &&
		                 (0x80 <= string[i+2] && string[i+2] <= 0xBF)
		                )
		          ) {
		              i += 3;
		              continue;
		          }
	
		        if(     (// planes 1-3
		                    string[i] == 0xF0 &&
		                    (0x90 <= string[i + 1] && string[i + 1] <= 0xBF) &&
		                    (0x80 <= string[i + 2] && string[i + 2] <= 0xBF) &&
		                    (0x80 <= string[i + 3] && string[i + 3] <= 0xBF)
		                ) ||
		                (// planes 4-15
		                 (0xF1 <= string[i] && string[i] <= 0xF3) &&
		                 (0x80 <= string[i + 1] && string[i + 1] <= 0xBF) &&
		                 (0x80 <= string[i + 2] && string[i + 2] <= 0xBF) &&
		                 (0x80 <= string[i + 3] && string[i + 3] <= 0xBF)
		                ) ||
		                (// plane 16
		                 string[i] == 0xF4 &&
		                 (0x80 <= string[i + 1] && string[i + 1] <= 0x8F) &&
		                 (0x80 <= string[i + 2] && string[i + 2] <= 0xBF) &&
		                 (0x80 <= string[i + 3] && string[i + 3] <= 0xBF)
		                )
		          ) {
		              i += 4;
		              continue;
		          }
	
		        return false;
		    }
	
		    return true;
		};
		
		return JSYG.String;
		
	});
	define('Utils',["JSYG","Style","String"],function(JSYG) {
		
		
		
		/**
		 * récupère le nom de la balise en minuscule du premier élément de la collection (sinon html renvoie majuscules et svg minuscules)
		 * @returns {String}
		 */
		JSYG.prototype.getTag = function() {
			return this[0] && this[0].tagName && this[0].tagName.toLowerCase();
		};
		
		/**
		 * Liste des balises des formes svg
		 */
		JSYG.svgShapes = ['circle','ellipse','line','polygon','polyline','path','rect'];
		/**
		 * Liste des balises des conteneurs svg
		 */
		JSYG.svgContainers = ['a','defs','glyphs','g','marker','mask','missing-glyph','pattern','svg','switch','symbol'];
		/**
		 * Liste des balises des éléments graphiques svg
		 */
		JSYG.svgGraphics = ['circle','ellipse','line','polygon','polyline','path','rect','use','image','text'];
		/**
		 * Liste des balises des éléments textes svg
		 */
		JSYG.svgTexts = ['altGlyph','textPath','text','tref','tspan'];
		
		/**
		 * récupère ou fixe la valeur d'un attribut (au sens xml) dans un espace de noms donn�.<br/><br/>
		 * Pour définir rapidement plusieurs attributs, on peut passer en paramêtre un objet dont les cl�s sont les noms des attributs et les valeurs les valeurs à affecter.<br/> <br/>
		 * @param ns espace de nom.
		 * @param attr nom de l'attribut.
		 * @param val si définie, fixe la valeur de l'attribut.
		 * <br/><br/>
		 * @example :<ul>
		 * <li><strong>jsynObjet.attrNS('http://www.w3.org/2000/svg','name')</strong> : renvoie l'attribut name de l'élément.</li>
		 * <li><strong>jsynObjet.attr('name','toto')</strong> : définit l'attribut name de l'élément.</li> 
		 * </ul>
		 * @returns {String,JSYG} valeur de l'attribut si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
		*/
		JSYG.prototype.attrNS = function(ns,attr,val) {
			
			if (ns == null || attr == null) return this;
			
			if (typeof(attr) == 'object') {
				for (var n in attr) this.attrNS(ns,n,attr[n]);
				return this;
			}
			
			if (val == null) return this[0].getAttributeNS(ns,attr);
			else {				
				this.each(function() { this.setAttributeNS(ns,attr,val); });
			}
			return this;
		};
		
		/**
		 * Suppression d'un ou plusieurs attributs des éléments de la collection dans un espace de noms donn�.
		 * @param ns espace de nom.
		 * @param attr nom de l'attribut. Le nombre d'arguments n'est pas limit�.
		 * @returns {JSYG}
		 */
		JSYG.prototype.removeAttrNS = function(ns,attr) {	
			
			var a=arguments,
				i,N=a.length;
				
			this.each(function() {
				for (i=1;i<N;i++) this.removeAttributeNS(ns,a[i]);
			});
			
			return this;
		};
		
		/**
		 * Execute une fonction sur le noeud et récursivement sur tous les descendants (nodeType==1 uniquement)
		 * @param fct le mot clé this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
		 * @param node noeud parent
		 */
		JSYG.walkTheDom = function(fct,node) {
			
			if (fct.call(node) === false) return false;
			
	        node = node.firstChild;
	        
	        while (node) {
	            if (node.nodeType == 1) {
	            	if (JSYG.walkTheDom(fct,node) === false) return false;
	            }
	            node = node.nextSibling;
	        }
	    };
		
		/**
		 * exécute une fonction sur la collection et récursivement sur tous les descendants
		 * @param fct le mot clé this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
		 * @returns {JSYG}
		 */
		JSYG.prototype.walkTheDom = function(fct) {
			this.each(function() { return JSYG.walkTheDom(fct,this); });
			return this;
		};
		
		/**
		 * récupère les coordonnées du centre de l'élément.
		 * @param arg optionnel, 'screen','page' ou élément référent (voir JSYG.prototype.getDim pour les détails)
		 * @returns {JSYG.Vect}
		 * @see JSYG.prototype.getDim
		 */
		JSYG.prototype.getCenter = function(arg) {
			var rect = this.getDim(arg);
			return new JSYG.Vect(rect.x+rect.width/2,rect.y+rect.height/2);
		};
	
		/**
		 * définit les coordonnées du centre de l'élément par rapport au parent positionn�, avant transformation.
		 * On peut aussi passer en argument un objet contenant les propriétés x et y.
		 * Il est possible de ne passer qu'une valeur sur les deux (ou null) pour centrer horizontalement ou verticalement uniquement.
		 * @param x abcisse
		 * @param y ordonnée
		 * @returns {JSYG}
		 */
		JSYG.prototype.setCenter = function(x,y) {
					
			if (x!=null && typeof x === 'object' && y == null) {
				y = x.y;
				x = x.x;
			}
			
			this.each(function() {
			
				var $this = new JSYG(this),
					rect = $this.getDim(),
					dim = {};
							
				if (x!=null) dim.x = x - rect.width/2;
				if (y!=null) dim.y = y - rect.height/2;
				
				$this.setDim(dim);
	
			});
							
			return this;
		};
		
		/**
		 * récupère ou fixe les attributs de la viewBox d'un élément SVG (qui dispose de cet attribut, essentiellement les balise &lt;svg&gt;)
		 * @param dim optionnel, objet, si défini fixe les attributs
		 * @returns {JSYG} si dim est défini, objet avec propriétés x,y,width,height
		 */
		JSYG.prototype.viewBox = function(dim) {
			
			var val;
			
			this.each(function() {
				
				if (this.tagName!= 'svg') throw new Error("la méthode viewBox ne s'applique qu'aux conteneurs svg.");
			
				var viewBoxInit = this.viewBox.baseVal;
				var viewBox = viewBoxInit || {} ;
				
				if (dim == null) {
					
					val = {
						x : viewBox.x || 0,
						y : viewBox.y || 0,
						width : viewBox.width || parseFloat(this.getAttribute('width')),
						height : viewBox.height || parseFloat(this.getAttribute('height'))
					};
					
					return false;
				}
				else {
									
					for (var n in dim) {
						if (["x","y","width","height"].indexOf(n)!=-1) viewBox[n] = dim[n];
					}
				}
				
				if (!viewBoxInit) this.setAttribute('viewBox', viewBox.x+" "+viewBox.y+" "+viewBox.width+" "+viewBox.height);
				
			});
			
			return val ? val : this;
		};
			
		/**
		 * Renvoit la matrice de transformation équivalente à la viewbox
		 */
		function viewBox2mtx(svgElmt) {
			
			var viewBox = svgElmt.viewBox.baseVal,
				mtx = new JSYG.Matrix(),
				scaleX,scaleY,ratio;
			
			if (!viewBox) return mtx;
				
			if (viewBox.width && viewBox.height) {
																
				scaleX = svgElmt.getAttribute('width')/viewBox.width;
				scaleY = svgElmt.getAttribute('height')/viewBox.height;
				ratio = svgElmt.getAttribute("preserveAspectRatio");
			
				if (ratio && ratio!="none") throw new Error(ratio+" : désolé, la méthode ne fonctionne pas avec une valeur de preserveAspectRatio différente de 'none'.");
				
				mtx = mtx.scaleNonUniform(scaleX,scaleY);
			}
			
			mtx = mtx.translate(-viewBox.x,-viewBox.y);
			
			return mtx;
		};
		
		/**
		 * Transforme les éléments &lt;svg&gt; de la collection en conteneurs &lt;g&gt;.
		 * Cela peut être utile pour insérer un document svg dans un autre et éviter d'avoir des balises svg imbriquées.
		 * @returns {JSYG} objet JSYG contenant la collection des éléments g.
		 */
		JSYG.prototype.svg2g = function() {
			
			var list = [];
					
			this.each(function() {
				
				var $this = new JSYG(this);
				
				if ($this.getTag() != "svg") throw new Error($this.getTag()+" : la méthode ne concerne que les balises svg");
							
				var g = new JSYG('<g>'),
					mtx = new JSYG.Matrix();
			
				while (this.firstChild) g.append(this.firstChild);
				
				mtx = mtx.translate( $this.attr("x")||0 , $this.attr("y")||0);
							
				mtx = mtx.multiply( viewBox2mtx(this) );
							
				g.setMtx(mtx).replace(this);
							
				list.push(g[0]);
				
			});
			
			return new JSYG(list);
		};
		
		/**
		 * Parse une chaîne svg en renvoit l'objet JSYG correspondant
		 * @param svgString chaîne svg
		 * @returns {JSYG}
		 */
		JSYG.parseSVG = function(svgString) {
			
			var parser = new DOMParser(),
				doc = parser.parseFromString(svgString, "image/svg+xml"),
				node = doc.documentElement;
			
			return new JSYG(node);
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
		 * Donne la valeur calculée finale de toutes les propriétés CSS sur le premier élément de la collection.
		 * @returns {Object} objet CSSStyleDeclaration
		 */
		function getComputedStyle(node) {
			
			return window.getComputedStyle && window.getComputedStyle(node) || node.currentStyle;
		};
		
		/**
		 * Retire l'attribut de style "style" + tous les attributs svg concernant le style.
		 */
		JSYG.prototype.styleRemove = function() {
			
			this.each(function() {
				
				var $this = new JSYG(this);
				
				$this.attrRemove('style');
				
				if ($this.type == 'svg') {
					JSYG.svgCssProperties.forEach(function(attr) { $this.attrRemove(attr); });
				}
				
			});
			
			return this;		
		};
		
		/**
		 * Sauvegarde le style pour être r�tabli plus tard par la méthode styleRestore
		 * @param id identifiant de la sauvegarde du style (pour ne pas interf�rer avec d'autres styleSave)
		 * @returns {JSYG}
		 */
		JSYG.prototype.styleSave = function(id) {
			
			var prop = "styleSaved";
			
			if (id) prop+=id;
			
			this.each(function() {
				
				var $this = new JSYG(this),
					attrs={},
					style;
								
				if ($this.isSVG()) {
					
					JSYG.svgCssProperties.forEach(function(attr) {
						var val = $this.attr(attr);
						if (val!= null) attrs[attr] = val;
					});
				}
				
				style = $this.attr('style');
				
				if (typeof style == 'object') style = JSON.stringify(style); //IE
				
				attrs.style = style;
							
				$this.data(prop,attrs);
							
			});
			
			return this;
		};
		
		/**
		 * Restaure le style pr�alablement sauv� par la méthode styleSave.
		 * Attention avec des éléments html et Google Chrome la méthode est asynchrone.
		 * @param id identifiant de la sauvegarde du style (pour ne pas interf�rer avec d'autres styleSave)
		 * @returns {JSYG}
		 */
		JSYG.prototype.styleRestore = function(id) {
			
			var prop = "styleSaved";
			
			if (id) prop+=id;
			
			this.each(function() {
				
				var $this = new JSYG(this),
					attrs = this.data(prop),
					style;
							
				if (!attrs) return;
				
				$this.styleRemove();
							
				if ($this.isSVG()) $this.attr(attrs);
				else {
				
					try {
						style = JSON.parse(attrs.style);
						for (var n in style) { if (style[n]) this.style[n] = style[n]; }
					}
					catch(e) { $this.attr('style',attrs.style); }
				}
				
				$this.dataRemove(prop);
										
			});
			
			return this;
		};
	
		/**
		 * Applique aux éléments de la collection tous les éléments de style de l'élément passé en argument.
		 * @param elmt argument JSYG
		 * @returns {JSYG}
		 */
		JSYG.prototype.styleClone = function(elmt) {
			
			elmt = new JSYG(elmt);
			
			var foreignStyle = getComputedStyle(elmt[0]),
				name,value,
				i=0,N=foreignStyle.length;
			
			this.styleRemove();
					
			this.each(function() {
					
				var $this = new JSYG(this),
					ownStyle = getComputedStyle(this),
					isSVG = $this.isSVG();
										
				for (i=0;i<N;i++) {
					
					name = foreignStyle.item(i);
					
					if (isSVG && JSYG.svgCssProperties.indexOf(name)===-1) continue;
					
					value = foreignStyle.getPropertyValue(name);
					//priority = foreignStyle.getPropertyPriority(name);
					
					if (ownStyle.getPropertyValue(name) !== value) {
						//ownStyle.setProperty(name,value,priority); //-> Modifications are not allowed for this document (?)
						$this.css(name,value);
					}
				}
				
			});
							
			return this;
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
		 * @returns {JSYG.Promise}
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
			else promise = JSYG.Promise.resolve();
					
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
		 * @returns {JSYG.Promise}  
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
		 * @returns {JSYG.Promise}
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
				
				promises.push( new JSYG.Promise(function(resolve,reject) {
						
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
															
			return JSYG.Promise.all(promises);
		};
	
		/**
		 * Convertit le 1er élément de la collection en élément canvas.
		 * L'élément lui-même n'est pas impacté.
		 * @return {JSYG.Promise}
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
			
			if (tag == "img" || tag == "image") promise = JSYG.Promise.resolve( this.href() );
			else promise = this.toDataURL();
			
			return promise.then(function(src) {
				
				return new JSYG.Promise(function(resolve,reject) {
									
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
		
	});
	define('Matrix',["JSYG","Vect","Utils"],function(JSYG) {
		
		
		
		var svg = JSYG.support.svg;
		/**
		 * Constructeur de matrices JSYG
		 * @param arg optionnel, si défini reprend les coefficients de l'argument. arg peut être
		 * une instance de SVGMatrix (DOM SVG) ou de JSYG.Matrix.
		 * On peut également passer 6 arguments numériques pour définir chacun des coefficients.
		 * @returns {JSYG.Matrix}
		 */
		JSYG.Matrix = function(arg) {
		
			if (arg && arguments.length === 1) {
				if (arg instanceof window.SVGMatrix) this.mtx = arg.scale(1);
				else if (arg instanceof JSYG.Matrix) this.mtx = arg.mtx.scale(1);
				else if (typeof arg == "string") return JSYG.Matrix.parse(arg);
				else throw new Error(arg+" : argument incorrect pour JSYG.Matrix.");
			}
			else {
				this.mtx = svg && svg.createSVGMatrix();
				if (arguments.length === 6) {
				    var a = arguments, that = this;
				    ['a','b','c','d','e','f'].forEach(function(prop,ind){ that[prop] = a[ind]; });
				}
			}	
		};
		
		JSYG.Matrix.prototype = {
			
			constructor : JSYG.Matrix,
			
			/**
			 * Coefficients de la matrice
			 */
			a : null,
			b : null,
			c : null,
			d : null,
			e : null,
			f : null,
			
			/**
			 * Objet SVGMatrix original
			 */
			mtx : null,
			
			/**
			 * Transforme un point par cette matrice.
			 * On peut passer en argument un objet avec les propriétés x et y.
			 * @param x abcisse
			 * @param y ordonnée
			 * @returns {JSYG.Vect}
			 */
			transformPoint : function(x,y) {
				return new JSYG.Vect(x,y).mtx(this.mtx);
			},
		
			/**
			 * Cr�e une matrice identique
			 * @returns {JSYG.Matrix}
			 */
			clone : function() {
				return new JSYG.Matrix(this.mtx);
			},
			
			/**
			 * Teste si la matrice est la matrice identit� (pas de transformation)
			 * @returns {Boolean}
			 */
			isIdentity : function() {
				if (!this.mtx) return true;
				return this.mtx.a === 1 && this.mtx.b === 0 && this.mtx.c === 0 && this.mtx.d === 1 && this.mtx.e === 0 && this.mtx.f === 0;
			},
			
			/**
			 * Multiplie la matrice par celle passée en argument
			 * @param mtx instance de JSYG.Matrix (ou SVGMatrix) 
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			multiply : function(mtx) {
				mtx = (mtx instanceof JSYG.Matrix) ? mtx.mtx : mtx;
				return new JSYG.Matrix(this.mtx && this.mtx.multiply(mtx));
			},
			
			/**
			 * Inverse la matrice
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			inverse : function() {
				return new JSYG.Matrix(this.mtx && this.mtx.inverse());
			},
		
			/**
			 * Applique un coefficient d'échelle
			 * @param scale
			 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
			 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			scale : function(scale,originX,originY) {
				originX = originX || 0;
				originY = originY || 0;
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scale(scale).translate(-originX,-originY));
			},
			
			/**
			 * Applique un coefficient d'échelle horizontale / Renvoie l'échelle horizontale (appel sans argument). 
			 * @param scale
			 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
			 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			scaleX : function(scale,originX,originY) {
				
				if (scale == null) return this.decompose(this.mtx).scaleX;
				
				originX = originX || 0;
				originY = originY || 0;
				
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scaleNonUniform(scale,1).translate(-originX,-originY));
			},
			
			/**
			 * Applique un coefficient d'échelle verticale / Renvoie l'échelle verticale (appel sans argument). 
			 * @param scale
			 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
			 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			scaleY : function(scale,originX,originY) {
				
				if (scale == null) return this.decompose(this.mtx).scaleY;
				
				originX = originX || 0;
				originY = originY || 0;
				
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scaleNonUniform(1,scale).translate(-originX,-originY));
			},
			
			/**
			 * Applique un coefficient d'échelle non uniforme en x et en y
			 * @param scaleX échelle horizontale
			 * @param scaleY échelle verticale
			 * @param originX optionnel, abcisse du point fixe lors du changement d'échelle
			 * @param originY optionnel, ordonnée du point fixe lors du changement d'échelle
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			scaleNonUniform : function(scaleX,scaleY,originX,originY) {
				
				originX = originX || 0;
				originY = originY || 0;
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY).scaleNonUniform(scaleX,scaleY).translate(-originX,-originY));
			},
			
			/**
			 * Translation
			 * @param x translation horizontale 
			 * @param y translation verticale
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			translate : function(x,y) {
				return new JSYG.Matrix(this.mtx && this.mtx.translate(x,y));
			},
			
			/**
			 * Translation horizontale / Renvoie la translation horizontale (appel sans argument). 
			 * @param x translation horizontale 
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			translateX : function(x) {
				
				if (x == null) return this.decompose(this.mtx).translateX;
				
				return new JSYG.Matrix(this.mtx && this.mtx.translate(x,0));
			},
			
			/**
			 * Translation verticale / Renvoie la translation verticale (appel sans argument). 
			 * @param y translation verticale
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			translateY : function(y) {
				
				if (y == null) return this.decompose(this.mtx).translateY;
				
				return new JSYG.Matrix(this.mtx && this.mtx.translate(0,y));
			},
			
			/**
			 * Rotation / Renvoie la rotation
			 * @param angle en degr�s
			 * @param originX optionnel, abcisse du point fixe lors de la rotation
			 * @param originY optionnel, ordonnée du point fixe lors de la rotation
			 * @returns {JSYG.Matrix} nouvelle instance
			 */
			rotate : function(angle,originX,originY) {
				
				if (angle == null) return this.decompose(this.mtx).rotate;
						
				originX = originX || 0;
				originY = originY || 0;
				
				var mtx = this.decompose();
						
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY)
				.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
				.rotate(angle)
				.scaleNonUniform(mtx.scaleX,mtx.scaleY)
				.translate(-originX,-originY));
			},
			
			skewX : function(angle,originX,originY) {
				
				if (angle == null) return this.decompose(this.mtx).skew;
				
				originX = originX || 0;
				originY = originY || 0;
				
				var mtx = this.decompose();
						
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY)
				.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
				.skewX(angle)
				.scaleNonUniform(mtx.scaleX,mtx.scaleY)
				.translate(-originX,-originY));
			},
			
			skewY : function(angle,originX,originY) {
				
				if (angle == null) return this.decompose(this.mtx).skew;
				
				originX = originX || 0;
				originY = originY || 0;
				
				var mtx = this.decompose();
						
				return new JSYG.Matrix(this.mtx && this.mtx.translate(originX,originY)
				.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
				.skewY(angle)
				.scaleNonUniform(mtx.scaleX,mtx.scaleY)
				.translate(-originX,-originY));
			},
					
			/**
			 * Décomposition de la matrice
			 * @param originX optionnel, abcisse du point fixe lors des transformations
			 * @param originY optionnel, ordonnée du point fixe lors des transformations
			 * @returns {Object} avec les propriétés translateX,translateY,rotate,skew,scaleX,scaleY
			 * @link http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
			 */
			decompose : function(originX,originY) {
						
				if (!this.mtx) { return {
						translateX : 0,
						translateY : 0,
						rotate : 0,
						skew : 0,
						scaleX : 1,
						scaleY : 1
					};
				}
				
				var mtx = this.mtx;
				
				if ((mtx.a * mtx.d - mtx.b * mtx.c) === 0) return false;
		
				var rowx = new JSYG.Vect(mtx.a,mtx.b);
				var scaleX = rowx.length();
				rowx = rowx.normalize();
				
				var rowy = new JSYG.Vect(mtx.c,mtx.d);
				var skew = rowx.dot(rowy);
				rowy = rowy.combine(rowx, 1.0, -skew);
				
				var scaleY = rowy.length();
				rowy = rowy.normalize();
				skew /= scaleY;
				
				var rotate = Math.atan2(mtx.b,mtx.a) * 180 / Math.PI;
				
				var decompose = {
					translateX : mtx.e,
					translateY : mtx.f,
					rotate : rotate,
					skew : skew,
					scaleX : scaleX,
					scaleY : scaleY
				};
				
				if (originX != null && originY != null) {
					
					//pour obtenir les translations r�elles (non li�es aux rotations et échelles)
					mtx = mtx.translate(originX,originY) 
					.rotate(-decompose.rotate)
					.scaleNonUniform(1/decompose.scaleX,1/decompose.scaleY)
					.translate(-originX,-originY);
																			
					decompose.translateX = mtx.e;
					decompose.translateY = mtx.f;
				}
				
				return decompose;
			},
			
			/**
			 * Renvoie une matrice à partir d'un objet décrivant les transformations.
			 * @param transf objet contenant les propriétés possibles suivantes :
			 * translateX,translateY,rotate,skew,scaleX,scaleY.
			 * @param originX optionnel, abcisse du point fixe lors des transformations
			 * @param originY optionnel, ordonnée du point fixe lors des transformations
			 * @returns {JSYG.Matrix}
			 * @link http://www.w3.org/TR/css3-2d-transforms/#recomposing-the-matrix
			 */
			recompose : function(transf,originX,originY) {
				
				return new JSYG.Matrix( svg && svg.createSVGMatrix()
					.translate(transf.translateX || 0,transf.translateY || 0)
					.translate(originX || 0,originY || 0)
					.rotate(transf.rotate || 0)
					.skewX(transf.skew || 0)
					.scaleNonUniform(transf.scaleX || 1,transf.scaleY || 1)
					.translate(-originX || 0, -originY || 0)
				);
			},
		
			/**
			 * Convertit la matrice en chaîne de caract�res (de type attribut transform : matrix(a,b,c,d,e,f) )
			 * @param precision nombre de d�cimales pour les coefficients (5 par défaut)
			 * @returns {String}
			 */
			toString : function(precision) {
				
				if (precision == null) precision = 5;
				
				return 'matrix('
					+JSYG.round(this.mtx.a,precision)+','
					+JSYG.round(this.mtx.b,precision)+','
					+JSYG.round(this.mtx.c,precision)+','
					+JSYG.round(this.mtx.d,precision)+','
					+JSYG.round(this.mtx.e,precision)+','
					+JSYG.round(this.mtx.f,precision)+')';
			}
		};
		
		var regParseMtx = (function() {
			
			var regNbSc = "[-+]?[0-9]*\\.?[0-9]+(?:[e][-+]?[0-9]+)?",
				regCoef = "\\s*("+regNbSc+")\\s*",
				regexp = "matrix\\s*\\("+regCoef+','+regCoef+','+regCoef+','+regCoef+','+regCoef+','+regCoef+"\\)";
				
			return new RegExp(regexp,'i');
			
		}());
		
		JSYG.Matrix.parse = function(str) {
			
			var coefs = regParseMtx.exec(str);
			
			if (!coefs) throw new Error(str+" n'est pas une chaîne valide pour repr�senter une matrice");
			
			return new JSYG.Matrix(coefs[1],coefs[2],coefs[3],coefs[4],coefs[5],coefs[6]);
		};
		
		if (Object.defineProperty) {
		
			try {
			
				['a','b','c','d','e','f'].forEach(function(coef) {
					
					Object.defineProperty(JSYG.Matrix.prototype,coef,{
						get:function() { return this.mtx[coef]; },
						set:function(val) { this.mtx[coef] = val; }
					});
				});
				
			} catch(e) {}
		}
		
		return JSYG.Matrix;
	});
	define('Style',["JSYG","Matrix","Vect"],function(JSYG) {
		
		
		
		var svg = JSYG.support.svg;
			
		function addTransform(rect,mtx) {
			
			if (!mtx.isIdentity()) {
					
				var hg = new JSYG.Vect(0,0).mtx(mtx),
					hd = new JSYG.Vect(rect.width,0).mtx(mtx),
					bg = new JSYG.Vect(0,rect.height).mtx(mtx),
					bd = new JSYG.Vect(rect.width,rect.height).mtx(mtx),
				
					xmin = Math.min(hg.x,hd.x,bg.x,bd.x),
					ymin = Math.min(hg.y,hd.y,bg.y,bd.y),
					xmax = Math.max(hg.x,hd.x,bg.x,bd.x),
					ymax = Math.max(hg.y,hd.y,bg.y,bd.y);
								
				return {
					x : Math.round(xmin + rect.x),
					y : Math.round(ymin + rect.y),
					width : Math.round(xmax - xmin),
					height : Math.round(ymax - ymin)
				};	
			}
			else return rect;
		}
		
		function getPos(type,node,ref) {
			var cpt=0,obj=node;
			do {cpt+=obj['offset'+type];} while ((obj = obj.offsetParent) && obj!==ref);
			return cpt;
		}
		
		function swapDisplay(jNode,callback) {
			
			var returnValue;
			
			jNode.styleSave('swapDisplay');				
				
			jNode.css({
				"visibility":"hidden",
				"position":"absolute",
				"display": jNode.originalDisplay()
			});
			
			try { returnValue = callback.call(jNode); }
			catch (e) {
				jNode.styleRestore('swapDisplay');
				throw new Error(e);
			}
							
			jNode.styleRestore('swapDisplay');
				
			return returnValue;
		}
		
		/**
		 * Récupération des dimensions de l'élément sous forme d'objet avec les propriétés x,y,width,height.
		 * Pour les éléments HTML, Les dimensions prennent en compte padding, border mais pas margin.<br/><br/>
		 * Pour les éléments SVG (balises &lt;svg&gt; comprises), ce sont les dimensions sans tenir compte de l'�paisseur du trac� (stroke-width)
		 * @param type
		 * <ul>
		 * <li>null : dimensions avant toute transformation par rapport au parent positionn� (viewport pour les éléments svg)</li>
		 * <li>"page" : dimensions dans la page</li>
		 * <li>"screen" : dimensions à l'�cran</li>
		 * <li>objet DOM : dimensions relativement à cet objet</li>
		 * @returns {Object} objet avec les propriétés x,y,width,height
		 */
		JSYG.prototype.getDim = function(type) {
					
			var node = this[0],
				dim=null,parent,box,boundingRect,
				hg,hd,bg,bd,
				x,y,width,height,
				viewBox,jWin,ref,dimRef,
				mtx,
				tag = this[0].tagName;
			
			if (node.nodeType == 1 && this.css("display") == "none") {
				
				return swapDisplay(this,function() { return this.getDim(); });
			}
			
			if ($.isWindow(node)) {
							
				dim = {
					x : node.pageXOffset || document.documentElement.scrollLeft,
					y : node.pageYOffset || document.documentElement.scrollTop,
					width : node.document.documentElement.clientWidth,
					height : node.document.documentElement.clientHeight
				};
			}
			else if (node.nodeType === 9) {
			
				dim = {
					x : 0,
					y : 0,
					width : Math.max(node.documentElement.scrollWidth,node.documentElement.clientWidth,node.body && node.body.scrollWidth || 0),
					height : Math.max(node.documentElement.scrollHeight,node.documentElement.clientHeight,node.body && node.body.scrollHeight || 0)
				};
			}
			else if (!node.parentNode) { throw new Error(node+" : Il faut d'abord attacher l'élément au DOM."); }
			else if (!type) {
				
				if (this.isSVG()) {
																			
					if (tag == 'svg') {
						
						parent = this.parent();
						
						if (parent.isSVG()) {
							
							dim = {
								x : parseFloat(this.attr('x')) || 0,
								y : parseFloat(this.attr('y')) || 0,
								width : parseFloat(this.attr('width')),
								height : parseFloat(this.attr('height'))
							};
						}
						else {
							
							if (parent.css('position') == 'static') parent = parent.offsetParent();
							dim = this.getDim(parent);
						}
						
					}
					else {
						
						box = this[0].getBBox();
						
						dim = { //box est en lecture seule
							x : box.x,
							y : box.y,
							width : box.width,
							height : box.height
						};
						
						if (tag === 'use' && !JSYG.support.svgUseBBox) {
							//bbox fait alors référence à l'élément source donc il faut ajouter les attributs de l'élément lui-même
							dim.x += parseFloat(this.attr('x'))  || 0;
							dim.y += parseFloat(this.attr('y')) || 0;
						}
					//}
					}
					
				} else {
	
					dim = this.getDim( this.offsetParent() );
				}
			}
			else if (type === 'page') {
				
				if (tag === 'svg') {
					
					x = parseFloat(this.css("left") || this.attr('x')) || 0;
					y = parseFloat(this.css("top") || this.attr('y')) || 0;
					width = parseFloat(this.css("width"));
					height = parseFloat(this.css("height"));
					
					viewBox = this.attr("viewBox");
					viewBox && this.attrRemove("viewBox");
					
					mtx = this.getMtx('screen');
					
					viewBox && this.attr("viewBox",viewBox);
																										
					hg = new JSYG.Vect(x,y).mtx(mtx);
					bd = new JSYG.Vect(x+width,y+height).mtx(mtx);
					
					boundingRect = {
						left : hg.x,
						top : hg.y,
						width: bd.x - hg.x,
						height : bd.y - hg.y
					};
					
				} else {
				
					if (this.isSVG() && this.rotate() == 0) {
						
						//sans rotation, cette méthode est meilleure car getBoundingClientRect
						//tient compte de l'épaisseur de tracé (stroke-width)
						
						mtx = this[0].getScreenCTM();
						
						box = this.getDim();
												
						hg = new JSYG.Vect(box.x,box.y).mtx(mtx);
						bd = new JSYG.Vect(box.x+box.width,box.y+box.height).mtx(mtx);
						
						boundingRect = { left : hg.x, right : bd.x, top : hg.y, bottom : bd.y };
					
					} else boundingRect = node.getBoundingClientRect();
				}
							
				jWin = new JSYG(window);
				
				x = boundingRect.left + jWin.scrollLeft() - document.documentElement.clientLeft;
				y = boundingRect.top + jWin.scrollTop() - document.documentElement.clientTop;
				width = boundingRect.width != null ? boundingRect.width : boundingRect.right - boundingRect.left;
				height = boundingRect.height != null ? boundingRect.height : boundingRect.bottom - boundingRect.top;
	
				dim = {
					x : x,
					y : y,
					width : width,
					height : height
				};
				
				if (!this.isSVG() && JSYG.support.addTransfForBoundingRect) { dim = addTransform(dim,this.getMtx()); } //FF
			}
			else if (type === 'screen' || $.isWindow(type) || (type instanceof $ && $.isWindow(type[0]) ) ) {
										
				jWin = new JSYG(window);
				dim = this.getDim('page');
				dim.x-=jWin.scrollLeft();
				dim.y-=jWin.scrollTop();
			}
			else if (type.nodeType!=null || type instanceof $) {
				
				ref = type.nodeType!=null ? type : type[0];
				
				if (this.isSVG()) {
					
					if (this.isSVGroot()) {
						
						dimRef = new JSYG(ref).getDim('page');
						dim = this.getDim('page');
											
						dim.x -= dimRef.x;
						dim.y -= dimRef.y;
					}
					else {
					
						box = this.getDim();
						mtx = this.getMtx(ref);
										
						if (!mtx.isIdentity()) {
							
							hg = new JSYG.Vect(box.x,box.y).mtx(mtx);
							hd = new JSYG.Vect(box.x+box.width,box.y).mtx(mtx);
							bg = new JSYG.Vect(box.x,box.y+box.height).mtx(mtx);
							bd = new JSYG.Vect(box.x+box.width,box.y+box.height).mtx(mtx);
							
							x = Math.min(hg.x,hd.x,bg.x,bd.x);
							y = Math.min(hg.y,hd.y,bg.y,bd.y);
							width = Math.max(hg.x,hd.x,bg.x,bd.x)-x;
							height = Math.max(hg.y,hd.y,bg.y,bd.y)-y;
							
							dim = { x:x, y:y, width:width, height:height };
												
						} else { dim = box; }
					}
					
				} else {
					
					width = node.offsetWidth;
					height = node.offsetHeight;
					
					if (!width && !height) {
						
						width = parseFloat(this.css('border-left-width') || 0) + parseFloat(this.css('border-right-width') || 0);
						height = parseFloat(this.css('border-top-width') || 0) + parseFloat(this.css('border-top-width') || 0);
						
						if (node.clientWidth || node.clientHeight) {
							width+= node.clientWidth;
							height+= node.clientHeight;
						}
						else if (node.width || node.height) {
							width+= parseFloat(this.css('padding-left') || 0) + parseFloat(this.css('padding-right') || 0) + node.width;
							height+= parseFloat(this.css('padding-top') || 0) + parseFloat(this.css('padding-bottom') || 0) + node.height;
							height+= node.clientHeight;
						}
					}
					
					dim = {
						x : getPos('Left',node,ref),
						y : getPos('Top',node,ref),
						width : width,
						height : height
					};
				}
				
			}
			else throw new Error(type+' : argument incorrect');
			
			return dim;
		};
		
		/**
		 * Utile surtout en interne.
		 * Permet de savoir s'il s'agit d'une balise &lt;image&gt; faisant référence à du contenu svg, car auquel cas elle
		 * se comporte plus comme un conteneur (du moins avec firefox). 
		 */
		function isSVGImage(elmt) {
			return elmt[0].tagName == 'image' && /(image\/svg\+xml|\.svg$)/.test(elmt.href());
		};
		
		
		function parseDimArgs(args,opt) {
			['x','y','width','height'].forEach(function(prop,i) {
				if (args[i]!=null) { opt[prop] = args[i]; }
			});
		}
		/**
		 * définit les dimensions de la collection par rapport au parent positionn�, avant transformation.
		 * Pour les éléments HTML, Les dimensions prennent en compte padding, border mais pas margin.<br/><br/>
		 * Pour les éléments SVG (balises &lt;svg&gt; comprises), ce sont les dimensions sans tenir compte de l'�paisseur du trac� (stroke-width).<br/><br/>
		 * En argument, au choix :
		 * <ul>
		 * <li>1 argument : objet avec les propriétés parmi x,y,width,height.</li>
		 * <li>2 arguments : nom de la propriété parmi x,y,width,height et valeur.</li>
		 * <li>4 arguments : valeurs de x,y,width et height. On peut passer null pour ignorer une valeur.</li>
		 * </ul>
		 * @returns {JSYG}
		 * @example <pre> new JSYG('#monElement').setDim({x:50,y:50,width:250,height:300});
		 * 
		 * //équivalent à :
		 * new JSYG('#monElement').setDim("x",50).setDim("y",50).setDim("width",250).setDim("height",300);
		 * 
		 * //équivalent à :
		 * new JSYG('#monElement').setDim(50,50,250,300);
		 */
		JSYG.prototype.setDim = function() {
			
			var opt = {},
				n = null, a = arguments,
				ref;
					
			switch (typeof a[0]) {
			
				case 'string' : opt[ a[0] ] = a[1]; break;
				
				case 'number' : parseDimArgs(a,opt); break;
					
				case 'object' :
					
					if (a[0] == null) parseDimArgs(a,opt);
					else {
						for (n in a[0]) opt[n] = a[0][n];
					}
					
					break;
					
				default : throw new Error("argument(s) incorrect(s) pour la méthode setDim"); 
			}
			
			ref = opt.from && new JSYG(opt.from);
					
			this.each(function() {
							
				var tag, dim, mtx, box, dec, decx, decy, position,
					$this = new JSYG(this),
					node = this;
				
				if (('keepRatio' in opt) && ('width' in opt || 'height' in opt)) {
					dim = $this.getDim();
					if (!('width' in opt)) opt.width = dim.width * opt.height / dim.height;
					else if (!('height' in opt)) opt.height = dim.height * opt.width / dim.width;
				}
				
				if ($.isWindow(node) || node.nodeType === 9) {
					$this.getWindow().resizeTo( parseFloat(opt.width) || 0, parseFloat(opt.height) || 0 );
					return;
				}
				
				tag = this.tagName;
				
				if ('from' in opt) {
					
					mtx = $this.getMtx(ref).inverse();
					dim = $this.getDim();
									
					var dimRef = $this.getDim(ref),
						
						x = (opt.x == null) ? 0 : opt.x,
						y = (opt.y == null) ? 0 : opt.y,
						xRef = (opt.x == null) ? 0 : dimRef.x,
						yRef = (opt.y == null) ? 0 : dimRef.y,
						
						width = (opt.width == null) ? 0 : opt.width,
						height = (opt.height == null) ? 0 : opt.height,
						widthRef = (opt.width == null) ? 0 : dimRef.width,
						heightRef = (opt.height == null) ? 0 : dimRef.height,
						
						pt1 = new JSYG.Vect(xRef,yRef).mtx(mtx),
						pt2 = new JSYG.Vect(x,y).mtx(mtx),
						pt3 = new JSYG.Vect(widthRef,heightRef).mtx(mtx),
						pt4 = new JSYG.Vect(width,height).mtx(mtx),
						
						newDim = {};
									
					if (tag == "g") mtx = $this.getMtx();
					
					if (opt.x!=null) newDim.x = dim.x + pt2.x - pt1.x;
					if (opt.y!=null) newDim.y = dim.y + pt2.y - pt1.y;
					if (opt.width!=null) newDim.width = dim.width + pt4.x - pt3.x;
					if (opt.height!=null) newDim.height = dim.height + pt4.y - pt3.y;
					
					$this.setDim(newDim);
					
					if (tag == "g") $this.setMtx( mtx.multiply($this.getMtx()) );
					
					return;
				}
				
				switch (tag) {
				
					case 'circle' :
						
						if ("width" in opt) { 
							node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('r') || 0)+opt.width/2);
							node.setAttribute('r',opt.width/2);
						}
						if ("height" in opt) {
							node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('r') || 0)+opt.height/2);
							node.setAttribute('r',opt.height/2);
						}
						if ("x" in opt) node.setAttribute('cx',opt.x + parseFloat(node.getAttribute('r') || 0));
						if ("y" in opt) node.setAttribute('cy',opt.y + parseFloat(node.getAttribute('r') || 0));
						
						break;
					
					case 'ellipse' :
						
						if ("width" in opt) {
							node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('rx') || 0)+opt.width/2);
							node.setAttribute('rx',opt.width/2);
						}
						if ("height" in opt) {
							node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('ry') || 0)+opt.height/2);
							node.setAttribute('ry',opt.height/2);
						}
						if ("x" in opt) node.setAttribute('cx',opt.x + parseFloat(node.getAttribute('rx') || 0));
						if ("y" in opt) node.setAttribute('cy',opt.y + parseFloat(node.getAttribute('ry') || 0));
											
						break;
					
					case 'line' : case 'polyline' : case 'polygon' : case 'path' :
										
						if (!node.parentNode) throw new Error("Pour fixer les dimensions d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM");
										
						mtx = new JSYG.Matrix();
						box = node.getBBox();
						
						if ("x" in opt) mtx = mtx.translate(opt.x-box.x,0);
						if ("y" in opt) mtx = mtx.translate(0,opt.y-box.y);
						if ("width" in opt && box.width!=0)	mtx = mtx.scaleX(opt.width/box.width,box.x,box.y);
						if ("height" in opt && box.height!=0)	mtx = mtx.scaleY(opt.height/box.height,box.x,box.y);
									
						$this.mtx2attrs({mtx:mtx});
						
						break;
						
					case 'text' : case 'use' : //on peut répercuter x et y mais pas width ni height
						
						if (('x' in opt || 'y' in opt) && !this[0].parentNode) throw new Error("Pour fixer la position d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM");
						
						dim = node.getBBox();
						mtx = $this.getMtx();
											
						if ('x' in opt) {
								
							if (tag == 'text') dec = (parseFloat($this.attr("x")) || 0) - dim.x;
							else {
								dec = -dim.x;
								if (JSYG.support.svgUseBBox) dec += parseFloat($this.attr('x'));
							}
								
							$this.attr('x',opt.x + dec);
						}
						
						if ('y' in opt) {
								
							if (tag == 'text') dec = (parseFloat($this.attr("y")) || 0) - dim.y;
							else {
								dec = -dim.y;
								if (JSYG.support.svgUseBBox) dec += parseFloat($this.attr('y'));
							}
							
							$this.attr('y',opt.y + dec);
						}
						
						if ('width' in opt || 'height' in opt) {
						
							mtx = new JSYG.Matrix();
							
							if ('width' in opt && dim.width!=0) {
								mtx = mtx.scaleNonUniform(opt.width/dim.width,1,dim.x,dim.y);
							}
							
							if ('height' in opt && dim.height!=0) {
								mtx = mtx.scaleNonUniform(1,opt.height/dim.height,dim.x,dim.y);
							}
							
							$this.mtx2attrs({mtx:mtx});
						}
		
						break;
						
					case 'g' : //on ne peut rien répercuter
											
						if (!node.parentNode) throw new Error("Pour fixer les dimensions d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM");
						
						dim = $this.getDim();
						mtx = $this.getMtx();
						
						var dimP = $this.getDim( node.parentNode );
						
						if ("x" in opt) mtx = new JSYG.Matrix().translateX( opt.x - dimP.x ).multiply(mtx);
						if ("y" in opt) mtx = new JSYG.Matrix().translateY( opt.y - dimP.y ).multiply(mtx);
						if ("width" in opt) mtx = mtx.scaleX( opt.width / dimP.width, dim.x, dim.y );
						if ("height" in opt) mtx = mtx.scaleY( opt.height / dimP.height, dim.x, dim.y );
											
						$this.setMtx(mtx);
											
						break;
						
					case 'iframe' : case 'canvas' :
						
						if ("x" in opt) $this.css('left',opt.x+'px');
						if ("y" in opt) $this.css('top',opt.y+'px');
						if ("width" in opt) $this.attr('width',opt.width);
						if ("height" in opt) $this.attr('height',opt.height);
							
						break;
														
					default :
																
						if ($this.isSVG()) {
							
							//les images dont l'url est un fichier svg se comportent plus comme des conteneurs (du moins avec ff)
							if (isSVGImage($this)) {
								
								if ('x' in opt) $this.attr('x',opt.x);
								if ('y' in opt) $this.attr('y',opt.y);
								
								if ('width' in opt || 'height' in opt) {
									
									if (!node.parentNode) throw new Error("Pour fixer la position d'une image svg, il faut d'abord l'attacher à l'arbre DOM");
									
									dim = node.getBBox();
								
									mtx = new JSYG.Matrix();
									
									if ('width' in opt && dim.width!=0)
										mtx = mtx.scaleNonUniform(opt.width/dim.width,1,dim.x,dim.y);
									
									if ('height' in opt && dim.height!=0)
										mtx = mtx.scaleNonUniform(1,opt.height/dim.height,dim.x,dim.y);
									
									$this.mtx2attrs({mtx:mtx});
								}
							}						
							else $this.attr(opt);
						}
						else {
	
							position = $this.css('position');
							
							decx = parseFloat($this.css('marginLeft') || 0);
							decy = parseFloat($this.css('marginTop') || 0);
									
							if ('x' in opt || 'y' in opt) {
														
								if (!position || position === 'static') {
									
									if (node.parentNode) {
										$this.css('position','relative');
										position = 'relative';
									}
									else $this.css('position','absolute');
								}
								
								if (position == 'relative'){
									
									dim = $this.getDim();
									
									if ('x' in opt) decx = dim.x - parseFloat($this.css('left') || 0);
									if ('y' in opt) decy = dim.y - parseFloat($this.css('top') || 0);
								}
							}
																															
							if ("x" in opt) node.style.left = opt.x - decx + 'px';
							if ("y" in opt) node.style.top = opt.y - decy + 'px';
							
							if ("width" in opt) {
										
								if (tag == 'svg') $this.css('width',opt.width).attr('width',opt.width);
								else {
									
									node.style.width = Math.max(0,opt.width
									-parseFloat($this.css('border-left-width') || 0)
									-parseFloat($this.css('padding-left') || 0)
									-parseFloat($this.css('border-right-width') || 0)
									-parseFloat($this.css('padding-right') || 0))+'px';
								}
							}
										
							if ("height" in opt) {
										
								if (tag == 'svg') $this.css('height',opt.height).attr('height',opt.height);
								else {
									node.style.height = Math.max(0,opt.height
									-parseFloat($this.css('border-top-width') || 0)
									-parseFloat($this.css('padding-top') || 0)
									-parseFloat($this.css('border-bottom-width') || 0)
									-parseFloat($this.css('padding-bottom') || 0))+'px';
								}
							}
						}
					
						break;
				}
							
			});
			
			return this;
		};
		
		
		/**
		 * Utile plutôt en interne ou pour la création de plugins.
		 * récupère le d�calage (pour les transformations) en pixels à partir d'arguments de types diff�rents.
		 * @param pivotX 'left','right','center', nombre ou pourcentage. Si non renseign�, l'origine par défaut de l'élément ("center")
		 * @param pivotY 'top','bottom','center', nombre ou pourcentage. Si non renseign�, l'origine par défaut de l'élément ("center")
		 * @returns {JSYG.Vect}
		 * @see JSYG.prototype.transfOrigin
		 */
		JSYG.prototype.getShift = function(pivotX,pivotY) {
							
			var transfOrigin = null;
			
			if (pivotX == null || pivotY == null) transfOrigin = this.transfOrigin().split(/ +/);
			
			pivotX = (pivotX != null) ? pivotX : transfOrigin[0];
			pivotY = (pivotY != null) ? pivotY : transfOrigin[1];
			
			if (JSYG.isNumeric(pivotX) && JSYG.isNumeric(pivotY)) return new JSYG.Vect(parseFloat(pivotX),parseFloat(pivotY));
					
			var box = this.getDim(), // dimensions réelles de l'élément (avant transformation(s))
				translX,translY, 
				pourcent = /^([0-9]+)%$/,
				execX = pourcent.exec(pivotX),
				execY = pourcent.exec(pivotY);
							
			if (execX) translX = box.width * execX[1] / 100;
			else {
				switch (pivotX) {
					case 'left' : translX = 0; break; 
					case 'right' : translX = box.width; break;
					default : translX = box.width/2; break;
				}
			}
			
			if (execY) translY = box.height * execY[1] / 100;
			else {
				switch (pivotY) {
					case 'top' : translY = 0; break; 
					case 'bottom' : translY = box.height; break;
					default : translY = box.height/2; break;
				}
			}
							
			if (!this.isSVG()) return new JSYG.Vect(translX,translY);
			else return new JSYG.Vect(box.x+translX,box.y+translY);
		};
		
		/**
		 * récupère ou définit l'origine pour les transformations 2D (html et svg). On peut passer un seul argument avec l'origine en x et en y séparées
		 * par des espaces ou deux arguments séparés. Pour les valeurs possibles, voir le lien ci-dessous.
		 * @param x chaîne, origine horizontale
		 * @param y chaîne, origine verticale
		 * @link https://developer.mozilla.org/en/CSS/transform-origin
		 * @returns {JSYG} si passé avec un ou des arguments, sinon renvoie une chaîne repr�sentant l'origine en x et y.
		 */
		JSYG.prototype.transfOrigin = function(x,y) {
			
			var value = null,
				a = arguments;
			
			this.each(function() {
				
				var $this = new JSYG(this),
					val,
					originX="50%",
					originY="50%";
				
				if (a[0] == null) {
					value = $this.data('transfOrigin') || originX+' '+originY;
					return false;
				}
				
				if (a.length === 1) { val = a[0].split(/ +/); }
				else if (a.length === 2) { val = [ a[0] , a[1] ]; }
				else throw new Error("nombre d'arguments incorrect");
				
				if (['top','bottom'].indexOf(val[0])!==-1 || val[1]!=null && ['left','right'].indexOf(val[1])!==-1) {
					if (val[1]!=null) { originX = val[1]; }
					if (val[0]!=null) { originY = val[0]; }
				}
				else {
					if (val[1]!=null) { originY = val[1]; }
					if (val[0]!=null) { originX = val[0]; }
				}
	
				$this.data('transfOrigin',originX+' '+originY);
				
				return null;
				
			});
					
			return a[0] == null ? value : this;
		};
		
		/**
		 * Annule toutes les transformations 2D de la collection.
		 * @returns {JSYG}
		 */
		JSYG.prototype.resetTransf = function() {
			
			if (!svg) return this;
			
			this.each(function() {
						
				if (new JSYG(this).isSVG()) this.transform.baseVal.clear();
				else if (JSYG.support.twoDimTransf) this.style[JSYG.support.twoDimTransf] = '';			
			});
			
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon l'échelle spécifiée, ou récupère l'échelle en x du premier élément de la collection
		 * @param scale si définie, transforme la collection
		 * @returns {JSYG} si scale est définie, la valeur de l'échelle sinon
		 */
		JSYG.prototype.scale = function(scale) {
			
			if (!svg) return scale == null ? null : this;
			
			if (scale == null) return this[0] && this.getMtx().scaleX();
			
			this.each(function() {
				
				var $this = new JSYG(this),
					dec = $this.getShift();
				
				$this.addMtx( new JSYG.Matrix().scale(scale,dec.x,dec.y) );
				
			});
			
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon l'échelle en x spécifiée, ou récupère l'échelle en x du premier élément de la collection.
		 * @param scale si définie, transforme la collection
		 * @returns {JSYG} si scale est définie, la valeur de l'échelle en x sinon
		 */
		JSYG.prototype.scaleX = function(scale) {
			
			if (!svg) return scale == null ? null : this;
			if (scale == null) return this[0] && this.getMtx().scaleX();
			this.scaleNonUniform(scale,1);
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon l'échelle en y spécifiée, ou récupère l'échelle en y du premier élément de la collection.
		 * @param scale si définie, transforme la collection
		 * @returns {JSYG} si scale est définie, la valeur de l'échelle en y sinon
		 */
		JSYG.prototype.scaleY = function(scale) {
			
			if (!svg) return scale == null ? null : this;
			if (scale == null) return this[0] && this.getMtx().scaleY();
			this.scaleNonUniform(1,scale);
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon l'échelle non uniforme spécifiée, ou récupère l'échelle du premier élément de la collection.
		 * @param scaleX
		 * @param scaleY
		 * @returns {JSYG} si scaleX et scaleY sont définis, sinon objet avec les propriétés scaleX et scaleY
		 */
		JSYG.prototype.scaleNonUniform = function(scaleX,scaleY) {
			
			if (!svg) return (scaleX == null && scaleY == null) ? null : this;
			
			var mtx;
			
			if (scaleX == null && scaleY == null) {
				mtx = this.getMtx();
				return { scaleX : mtx.scaleX() , scaleY : mtx.scaleY() };
			}
			
			this.each(function() {
				
				var $this = new JSYG(this),
					dec = $this.getShift();
				
				$this.addMtx( new JSYG.Matrix().scaleNonUniform(scaleX,scaleY,dec.x,dec.y) );
			});
			
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon la translation spécifiée, ou récupère la translation du premier élément de la collection.
		 * @param x
		 * @param y
		 * @returns {JSYG} si x et y sont définis, sinon objet JSYG.Vect
		 */
		JSYG.prototype.translate = function(x,y) {
			
			if (!svg) return (x == null && y == null) ? null : this;
			
			var mtx;
			
			if (x == null && y == null) {
				mtx = this.getMtx();
				return new JSYG.Vect(mtx.translateX(),mtx.translateY());
			}
			
			this.addMtx( new JSYG.Matrix().translate(x,y) );
			
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon la translation horizontale spécifiée, ou récupère la translation horizontale du premier élément de la collection.
		 * @param x
		 * @returns {JSYG} si x est défini, valeur de la translation horizontale sinon
		 */
		JSYG.prototype.translateX = function(x) {
			
			if (!svg) return x == null ? null : this;
	
			if (x == null) return this.getMtx().translateX();
			
			this.translate(x,0);
				
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon la translation verticale spécifiée, ou récupère la translation verticale du premier élément de la collection.
		 * @param y
		 * @returns {JSYG} si y est défini, valeur de la translation verticale sinon
		 */
		JSYG.prototype.translateY = function(y) {
			
			if (!svg) return y == null ? null : this;
			
			if (y == null) return this.getMtx().translateY();
			
			this.translate(0,y);
			
			return this;
		};
		
		/**
		 * Ajoute une transformation à la collection selon la rotation spécifiée, ou récupère la rotation du premier élément de la collection.
		 * @param angle (degr�s)
		 * @returns {JSYG} si angle est défini, valeur de la rotation sinon
		 */
		JSYG.prototype.rotate = function(angle) {
		
			if (!svg) return angle == null ? null : this;
			
			if (angle == null) return this.getMtx().rotate();
			
			this.each(function() {
				
				var $this = new JSYG(this),
					dec = $this.getShift(),
					mtx = $this.getMtx().decompose();
						
				$this.addMtx( new JSYG.Matrix().translate(dec.x,dec.y)
					.scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
					.rotate(angle)
					.scaleNonUniform(mtx.scaleX,mtx.scaleY)
					.translate(-dec.x,-dec.y)
				);
				
			});
			
			return this;
		};
			
		/**
		 * Récupération de l'objet matrice du 1er élément de la collection, instance de JSYG.Matrix.
		 * Pour les éléments HTML, seule la transformation de l'élément lui-même est support�
		 * @param arg (éléments svg seulement)
		 * <ul>
		 * 		<li>null : transformation de l'élément lui-même</li>
		 * 		<li>'ctm' : transformation de l'élément par rapport à son viewport (balise &lt;svg&gt;)</li>
		 * 		<li>'screen' : transformation de l'élément par rapport à l'�cran</li>
		 * 		<li>'page' : transformation de l'élément par rapport à la page (screen + scroll)</li>
		 * 		<li>objet DOM SVG : transformation de l'élément par rapport à cet objet</li>
		 * </ul>
		 * @returns {JSYG.Matrix}
		 * @see JSYG.Matrix
		 */
		JSYG.prototype.getMtx = function(arg) {
	
			var mtx = null,
				transf,regexp,coefs;
			
			if (!this[0]) return null;
			
			if (JSYG.isWindow(this[0]) || this[0].nodeType === 9) return new JSYG.Matrix();
					
			if (this.isSVG()) {
						
				if (arg == null) {
					transf = this[0].transform && this[0].transform.baseVal.consolidate();
					mtx = transf && transf.matrix || svg.createSVGMatrix();
				}
				else if (JSYG.support.svgUseTransform && this.getTag() == "use") {
					
					//les matrices de transformation tiennent compte des attributs x et y 
					//getCTM, getScreenCTM, getTransformToElement, mais ne modifie pas l'attribut transform de l'élément 
					//(bug de firefox avant la version 12 ou 13)
					//donc on prend la matrice de l'élément parent et on multiplie par la matrice de l'attribut transform
					return this.parent().getMtx(arg).multiply(this.getMtx()); 
				}
				else if (typeof arg === 'string') {
					
					arg = arg.toLowerCase();
					
					if (arg === 'ctm') mtx = this[0].getCTM();
					else if (arg === 'screen') mtx = this[0].getScreenCTM();
					else if (arg === 'page') {
						mtx = this[0].getScreenCTM();
						mtx = svg.createSVGMatrix().translate(window.pageXOffset,window.pageYOffset).multiply(mtx);
					}
				}
				else if (arg.nodeType != null || arg instanceof JSYG) {
					
					if (arg instanceof JSYG) arg = arg[0];
					
					//mtx = this[0].getTransformToElement(arg[0] || arg); //bug avec chrome
					
					mtx = arg.getScreenCTM() || svg.createSVGMatrix();			
					mtx = mtx.inverse().multiply( this[0].getScreenCTM() );
					
					if (this.getTag() == 'svg') mtx = mtx.translate(-this.attr('x') || 0,-this.attr('y') || 0) ; //la matrice tient compte des attributs x et y dans ce cas...
				}
							
			} else {
				
				if (JSYG.support.twoDimTransf) {
					
					transf = this[0].style[JSYG.support.twoDimTransf];
					regexp = /matrix\((-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *\)/;
					coefs = regexp.exec(transf);
					mtx = svg.createSVGMatrix();
					
					if (coefs) {
						mtx.a = coefs[1];
						mtx.b = coefs[2];
						mtx.c = coefs[3];
						mtx.d = coefs[4];
						mtx.e = coefs[5];
						mtx.f = coefs[6];
					}
				}
			}
			
			return new JSYG.Matrix(mtx);
		};
	
		/**
		 * définit la matrice de transformation de l'élément
		 * @param mtx instance de JSYG.Matrix (ou SVGMatrix natif)
		 * @returns {JSYG}
		 */
		JSYG.prototype.setMtx = function(mtx) {
		
			var attr = JSYG.support.twoDimTransf;
			
			if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
					
			this.each(function() {
			
				var $this = new JSYG(this),
					list;
			
				if ($this.isSVG()) {
						
					list = this.transform.baseVal;
					list.initialize(list.createSVGTransformFromMatrix(mtx));
				}
				else if (attr) {
								
					this.style[attr+'Origin'] = '0 0';
					this.style[attr] = new JSYG.Matrix(mtx).toString();
				}
				
			});
			
			return this;
		};
			
		/**
		 * Ajoute une transformation sous forme d'objet matrice (multiplication de la matrice avec la matrice courante)
		 * @param mtx instance de JSYG.Matrix (ou SVGMatrix natif)
		 * @returns {JSYG}
		 */
		JSYG.prototype.addMtx = function(mtx) {
			
			if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
			
			var attr = JSYG.support.twoDimTransf;
			
			this.each(function() {
			
				var $this = new JSYG(this),
					list;
							
				if ($this.isSVG()) {
					
					list = this.transform.baseVal;
					list.appendItem(list.createSVGTransformFromMatrix(mtx));
					list.consolidate();	
				}
				else if (attr) {
					
					mtx = $this.getMtx().multiply(mtx);
					$this.setMtx(mtx);
				}
				
			});
			
			return this;
		};
		
		/**
		 * répercute les transformations sur les attributs (autant que possible).<br/>
		 * Le type de transformations répercutable est variable selon les éléments.
		 * La rotation ne l'est pas sauf pour les chemins (path,line,polyline,polygone).
		 * Pour les conteneurs (&lt;g&gt;), aucune ne l'est. etc.
		 * @param opt si indéfini, répercute la matrice de transformation propre à l'élément.
		 * Si défini, il est un objet contenant les propriétés possibles suivantes :
		 * <ul>
		 * <li>mtx : instance JSYG.Matrix pour répercuter les transformations de celle-ci plut�t que de la matrice propre à l'élément</li>
		 * <li>keepRotation : pour les éléments permettant de répercuter la rotation sur les attributs ('circle','line','polyline','polygon','path'),
		 * le choix est donn� de le faire ou non</li>
		 * </ul>
		 * @returns {JSYG}
		 * @example new JSYG('&lt;rect&gt;').attr({x:0,y:0,width:100,height:100}).translate(50,50).mtx2attrs().attr("x") === 50
		 */
		JSYG.prototype.mtx2attrs = function(opt) {
			
			if (opt instanceof JSYG.Matrix) opt = {mtx:opt};
			else opt = $.extend({},opt);
			
			this.each(function() {
			
				var $this = new JSYG(this),
					mtx = opt.mtx || $this.getMtx(),
				    keepRotation = opt.keepRotation || false,
				    shift = $this.getShift(),
				    d = mtx.decompose(shift.x,shift.y),
				    dim = $this.getDim(),
				    tag = $this.getTag(),
				    tagsChoixRotation = ['circle','line','polyline','polygon','path'],
				    pt,pt1,pt2,
				    hg,bg,bd,
				    list,
				    jPath,seg,letter,
					x,y,
				    i,N;
				
				if (!dim) return;
				
				if (keepRotation && tagsChoixRotation.indexOf(tag)!==-1) {
					
					mtx = mtx.rotate(-d.rotate,shift.x,shift.y);
				}
				
				//les images dont l'url est un fichier svg se comportent plus comme des conteneurs (du moins avec ff)
				if (isSVGImage($this)) tag = "use";
				
				switch(tag) {
				
					case 'circle' :
							
						pt = new JSYG.Vect($this.attr('cx'),$this.attr('cy')).mtx(mtx);
						
						$this.attr({
							'cx':pt.x,
							'cy':pt.y,
							'r':$this.attr('r')*d.scaleX
						});
						
						if (!opt.mtx) $this.resetTransf();
						
						break;
					
					case 'ellipse' :
						
						pt = new JSYG.Vect($this.attr('cx'),$this.attr('cy')).mtx(mtx);
						
						$this.attr({
							'cx':pt.x,
							'cy':pt.y,
							'rx':$this.attr('rx')*d.scaleX,
							'ry':$this.attr('ry')*d.scaleY
						});
						
						if (!opt.mtx) $this.resetTransf();
						
						$this.setMtx( $this.getMtx().rotate(d.rotate,pt.x,pt.y) );
											
						break;
					
					case 'line' : 
						
						pt1 = new JSYG.Vect($this.attr('x1'),$this.attr('y1')).mtx(mtx),
						pt2 = new JSYG.Vect($this.attr('x2'),$this.attr('y2')).mtx(mtx);
						
						$this.attr({'x1':pt1.x,'y1':pt1.y,'x2':pt2.x,'y2':pt2.y});
						
						if (!opt.mtx) $this.resetTransf();
						
						break;
					
					case 'polyline' : case 'polygon' :  
						
						list = $this[0].points;
						i=0;N=list.numberOfItems;
						
						for (;i<N;i++) {
							list.replaceItem(list.getItem(i).matrixTransform(mtx.mtx),i);
						}
						
						if (!opt.mtx) $this.resetTransf();
						
						break;
					
					case 'path' :
						
						if (!JSYG.Path) throw new Exception("Il faut inclure le module JSYG.Path pour pouvoir utiliser la méthode mtx2attrs sur les chemins");
						
						jPath = new JSYG.Path(this).rel2abs();
						list = this.pathSegList;
						i=0,N=list.numberOfItems;
								
						for (;i<N;i++) {
							
							seg = list.getItem(i);
							letter = seg.pathSegTypeAsLetter;
							
							['','1','2'].forEach(function(ind) {
		
								if (seg['x'+ind] == null && seg['y'+ind] == null) return;
								
								if (seg['x'+ind] != null) x = seg['x'+ind];
								if (seg['y'+ind] != null) y = seg['y'+ind];
								
								if (x!=null && y!=null) {
									var point = new JSYG.Vect(x,y).mtx(mtx);
									seg['x'+ind] = point.x;
									seg['y'+ind] = point.y;
								}
							});
							
							if (keepRotation && letter === 'A') {
								seg.r1 *= mtx.scaleX();
								seg.r2 *= mtx.scaleY();
							}
							
							jPath.replaceSeg(i,seg);
						}
						
						if (!opt.mtx) $this.resetTransf();
						
						break;
						
					case 'g' :
					
						opt.mtx && $this.addMtx(mtx);
						break;
						
					case 'use' :
						
						hg = new JSYG.Vect($this.attr('x') || 0, $this.attr('y') || 0).mtx(mtx);
																		
						$this.attr({'x':hg.x,'y':hg.y});
						
						if (!opt.mtx) $this.resetTransf();
										
						$this.setMtx($this.getMtx()
							.translate(hg.x,hg.y)
							.scaleNonUniform(d.scaleX,d.scaleY)
							.rotate(d.rotate)
							.translate(-hg.x,-hg.y)
						);
						
						break;
									
					case 'text' :
						
						x = parseFloat($this.attr("x") || 0);					
						y = parseFloat($this.attr("y")) || 0;
						
						pt = new JSYG.Vect(x,y).mtx(mtx);
														
						$this.attr({'x':pt.x,'y':pt.y});
						
						if (!opt.mtx) $this.resetTransf();
										
						$this.setMtx($this.getMtx()
							.translate(pt.x,pt.y)
							.scaleNonUniform(d.scaleX,d.scaleY)
							.rotate(d.rotate)
							.translate(-pt.x,-pt.y)
						);
						
						break;
				
					case 'rect' :
										
						hg = new JSYG.Vect(dim.x,dim.y).mtx(mtx),
						bg = new JSYG.Vect(dim.x,dim.y+dim.height).mtx(mtx),
						bd = new JSYG.Vect(dim.x+dim.width,dim.y+dim.height).mtx(mtx);
														
						$this.attr({
							'x' : hg.x,
							'y' : hg.y,
							'width' : JSYG.distance(bd,bg),
							'height' : JSYG.distance(bg,hg),
							'rx' : $this.attr('rx') * d.scaleX,
							'ry' : $this.attr('ry') * d.scaleY
						});
						
						if (!opt.mtx) $this.resetTransf();
						
						$this.setMtx( $this.getMtx().rotate(d.rotate,hg.x,hg.y) );
											
						break;
						
					default :
						
						if (!$this.isSVG()) {
							
							hg = new JSYG.Vect(0,0).mtx(mtx),
							bg = new JSYG.Vect(0,dim.height).mtx(mtx),
							bd = new JSYG.Vect(dim.width,dim.height).mtx(mtx);
							
							$this.setDim({
								'x' : dim.x + hg.x,
								'y' : dim.y + hg.y,
								'width' : JSYG.distance(bd,bg),
								'height' : JSYG.distance(bg,hg)
							});
						
							if (!opt.mtx) $this.resetTransf();
							
							$this.setMtx($this.getMtx().rotate(d.rotate));
							
						}
						else {
						
							hg = new JSYG.Vect(dim.x,dim.y).mtx(mtx),
							bg = new JSYG.Vect(dim.x,dim.y+dim.height).mtx(mtx),
							bd = new JSYG.Vect(dim.x+dim.width,dim.y+dim.height).mtx(mtx);
							
							$this.attr({
								'x' : hg.x,
								'y' : hg.y,
								'width' : JSYG.distance(bd,bg),
								'height' : JSYG.distance(bg,hg)
							});
						
							if (!opt.mtx) $this.resetTransf();
							
							$this.setMtx( $this.getMtx().rotate(d.rotate,hg.x,hg.y) );
						}
				}
				
				if (keepRotation && tagsChoixRotation.indexOf(tag)!==-1) {
								
					shift = $this.getShift();
					
					$this.setMtx($this.getMtx().rotate(d.rotate,shift.x,shift.y));
				}
				
			});
			
			return this;
		};
		
		/**
		 * Renvoie les transformations du 1er élément de la collection
		 * @returns objet avec les propriétés "scaleX","scaleY","rotate","translateX","translateY"
		 */
		JSYG.prototype.getTransf = function() {
			
			var shift = this.getShift(),
				transf = this.getMtx().decompose(shift.x,shift.y);
			
			delete transf.skew;
			
			return transf;
		};
		
	JSYG.support.twoDimTransf = (function() {
			
			var node = document.createElement('div'),
				attr,attributs = ['','Moz','Webkit','O','ms'];
						
			for (var i=0;i<attributs.length;i++) {
				attr = attributs[i]+'Transform';
				if (node.style && node.style[attr]!=null) return attr;
			}
			return false;
			
		})();
		
		(function() {
			
			if (!svg || typeof document === "undefined") return false;
			
			var defs,use,
				id = 'rect'+ Math.random().toString().replace( /\D/g, "" );
			
			defs = new JSYG('<defs>');
			defs.appendTo(svg);
			
			new JSYG('<rect>')
			.attr({"id":id,x:10,y:10,width:10,height:10})
			.appendTo(defs);
						
			use = new JSYG('<use>').attr({id:"use",x:10,y:10,href:'#'+id}).appendTo(svg);
						
			document.body.appendChild(svg);
						
			JSYG.support.svgUseBBox = use[0].getBBox().x == 20;
						
			JSYG.support.svgUseTransform = use[0].getTransformToElement(svg).e != 0;
	
			use.remove();
			defs.remove();			
			document.body.removeChild(svg);
			
		}());
		
		
		
		//firefox ne répercute pas les transformations 2D d'éléments HTML sur la méthode getBoundingClientRect
		JSYG.support.addTransfForBoundingRect = (function() {
					
			if (!JSYG.support.twoDimTransf) return false;
			
			var jDiv = new JSYG('<div>').text('toto').css('visibility','hidden').appendTo(document.body),
				node = jDiv[0],
				rect1,rect2;
						
			rect1 = node.getBoundingClientRect();
			jDiv.rotate(30);
			rect2 = node.getBoundingClientRect();
			
			if (rect1.left === rect2.left) return true;
			
			jDiv.remove();
			
			return false;
			
		})();
	});
	
	require("JSYG");
	require("Utils");
	
}());