require(["Style","Transform","Vect"],function() {
	
	"use strict";
	
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
		
	(function() {
		
		if (!JSYG.support.svg || typeof document === "undefined") return false;
		
		var defs,use,
			id = 'rect'+ Math.random().toString().replace( /\D/g, "" ),
			svg = JSYG.support.svg;
		
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
	};
	
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
					else $.fn.width.apply(this,a);
				
					break;
			}
						
		});
		
		return this;
	};
	
});