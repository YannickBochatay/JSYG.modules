define(["JSYG","Matrix","Vect","Dimensions"],function(JSYG) {
	
	var svg = JSYG.support.svg;
	
	JSYG.support.twoDimTransf = (function() {
		
		var node = document.createElement('div'),
			attr,attributs = ['','Moz','Webkit','O','ms'];
					
		for (var i=0;i<attributs.length;i++) {
			attr = attributs[i]+'Transform';
			if (node.style && node.style[attr]!=null) return attr;
		}
		return false;
	})();
	
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
		
		if ($.isNumeric(pivotX) && $.isNumeric(pivotY)) return new JSYG.Vect(parseFloat(pivotX),parseFloat(pivotY));
				
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
		
		if (!JSYG.support.svg) return this;
		
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
		
		if ($.isWindow(this[0]) || this[0].nodeType === 9) return new JSYG.Matrix();
				
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

});