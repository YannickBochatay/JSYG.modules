(function() {
	
	"use strict";
	
	/**
	 * récupère le nom de la balise en minuscule du premier élément de la collection (sinon html renvoie majuscules et svg minuscules)
	 * @returns {String}
	 */
	JSYG.prototype.getTag = function() {
		return this[0] && this[0].tagName && this[0].tagName.toLowerCase();
	};
	
	/**
	 * Arrondi d'un nombre avec nombre de décimales précisé
	 * @param number
	 * @param precision nombre de d�cimales
	 * @returns {Number}
	 */
	JSYG.round = function(number,precision) {
		return Math.round(number * Math.pow(10,precision)) / Math.pow(10,precision);
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
	 * Execute une fonction sur le noeud et r�cursivement sur tous les descendants (nodeType==1 uniquement)
	 * @param fct le mot cl� this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
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
	 * exécute une fonction sur la collection et r�cursivement sur tous les descendants
	 * @param fct le mot cl� this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
	 * @returns {JSYG}
	 */
	JSYG.prototype.walkTheDom = function(fct) {
		this.each(function() { return JSYG.walkTheDom(fct,this); });
		return this;
	};
	
	/**
	 * récupère les coordonnées du centre de l'élément.
	 * @param arg optionnel, 'screen','page' ou élément r�f�rent (voir JSYG.prototype.getDim pour les d�tails)
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
			
			var $this = new JSYG(this);
			
			if ($this.getTag()!= 'svg') throw new Error("la méthode viewBox ne s'applique qu'aux conteneurs svg.");
		
			var viewBox = this.viewBox.baseVal || {}; 
			
			if (dim == null) {
				
				val = {
					x : viewBox.x || 0,
					y : viewBox.y || 0,
					width : viewBox.width || parseFloat($this.cssNum('width')),
					height : viewBox.height || parseFloat($this.cssNum('height'))
				};
				
				return false;
			}
			else {
				for (var n in dim) {
					if (n in viewBox) viewBox[n] = dim[n];
				}
			}
			
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
		
			if (ratio && ratio!="none") throw new Error(ratio+" : d�sol�, la méthode ne fonctionne pas avec une valeur de preserveAspectRatio diff�rente de 'none'.");
			
			mtx = mtx.scaleNonUniform(scaleX,scaleY);
		}
		
		mtx = mtx.translate(-viewBox.x,-viewBox.y);
		
		return mtx;
	};
	
	/**
	 * Transforme les éléments &lt;svg&gt; de la collection en conteneurs &lt;g&gt;.
	 * Cela peut être utile pour insérer un document svg dans un autre et �viter d'avoir des balises svg imbriqu�es.
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
	
}());