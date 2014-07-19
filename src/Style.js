define(["JSYG","Matrix","Vect"],function(JSYG) {
	
	"use strict";
	
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