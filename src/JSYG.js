(function(root, factory) {

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
	else factory(root,$,true);

}(this, function(window, $, global) {
		
	'use strict';
	
	var NS = {
		html : 'http://www.w3.org/1999/xhtml',
		svg : 'http://www.w3.org/2000/svg',
		xlink : 'http://www.w3.org/1999/xlink'
	};
	
	var rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
		rsvgLink = /^<(svg:a)\s*\/?>(?:<\/\1>|)$/;
	
	function JSYG(arg) {
		
		if (!(this instanceof JSYG)) return new JSYG(arg);
		
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
					
					if (ret) {
						if (JSYG.svgTags.indexOf(ret[1]) !== -1) array = [ document.createElementNS(NS.svg , ret[1]) ];
					}
					
				}
			}
		}
				
		$.merge(this, array ? array : $(arg) );
				
		return this;
	};
	
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
	
	JSYG.ns = NS;
	
	JSYG.prototype.isSVG = function() {
		return this[0] && this[0].namespaceURI == NS.svg;
	};
	
	JSYG.prototype.isSVGroot = function() {
		if (this[0].tagName != 'svg') return false;
		var parent = this.parent();
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
		else if (typeof name == "string" && name == "href") return xlinkHref.call(this,value);
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
			
			if ($this.isSVG() && !$this.isSVGroot()) {
				
				if (arg === 'farthest') elmt = this.farthestViewportElement;
				else elmt = this.nearestViewportElement;
				
				if (!elmt) { //les éléments non tracés (dans une balise defs) ne renvoient rien, par simplicité on renvoit la balise svg parente
					
					elmt = this.parentNode;
					
					while (elmt && (elmt.tagName!='svg' || arg == "farthest")) {
						elmt = elmt.parentNode;
						if (elmt.tagName == "svg") farthest = elmt;
					}
					
					if (farthest) elmt = farthest;
				}
			}
			else {
			
				if (arg === 'farthest') elmt = document.body;
				else elmt = $.fn.offsetParent.call($this);
			}
			
			elmt && tab.push(elmt);
			
		});
		
		return new JSYG(tab);
	};
	
	var rCamelCase = /[A-Z]/g,
		rDash = /-([a-z])/ig;
		
	function dasherize(str) {
		return str.replace(rCamelCase,function(str){ return '-'+str.toLowerCase();});
	}
	
	function camelize(str) {
		return str.replace(rDash,function(str,p1){ return p1.toUpperCase();});
	}
	
	JSYG.prototype.css = function(prop,val) {
		
		if ($.isPlainObject(prop)) {
			
			for (var n in prop) this.css(n,prop[n]);
			return this;
		}
		else if ($.isFunction(val)) {
			
			return this.each(function(i) {
				var $this = new JSYG(this);
				$this.css( val.call(this,j,$this.css(prop)) );
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
					
						if (!val && window.getComputedStyle)
							val = window.getComputedStyle(this[0],null).getPropertyValue(cssProp);
					}
				}
			}
			else val = $.fn.css.call(this,prop);
			
			return val;
		}
		
		return this.each(function() {
			
			var $this = new JSYG(this),
				isSVG = $this.isSVG();
			
			if (isSVG && JSYG.svgCssProperties.indexOf(cssProp)) {
				this.setAttribute(cssProp,val);
				this.style.jsProp = val;
			}
			else $.fn.css.call($this,prop,val);
		});
	};
	
	JSYG.support = {
			
		svg : window.document && window.document.createElementNS && window.document.createElementNS(NS.svg,'svg'),
		
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
				className;
					
			oldClasse = (isSVG ? this.getAttribute('class') : this.className) || '';
			
			newClasse = oldClasse;
					
			for (i=0;i<N;i++) {
				
				className = a[i];
				
				if ($.isFunction(className)) {
					
					$this.removeClass( className.call(this,j,oldClasse) );
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
				className;
			
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
	
	if (global) window.JSYG = JSYG;
	
	return JSYG;
	
}));
