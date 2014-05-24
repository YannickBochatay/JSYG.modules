(function() {
	
	"use strict";

	var svg = JSYG.support.svg;
	
	/**
	 * Constructeur de vecteurs.
	 * On peut passer en argument un objet avec les propriétés x et y.
	 * @param x abcisse
	 * @param y ordonnée
	 * @returns {JSYG.Vect}
	 * @link http://www.w3.org/TR/SVG/coords.html#InterfaceSVGPoint
	 */
	JSYG.Vect = function(x,y) {
		
		if (typeof x === 'object' && y == null) {
			y = x.y;
			x = x.x;
		}
		/**
		 * abcisse
		 */
		this.x = (typeof x == "number") ? x : parseFloat(x);
		/**
		 * ordonnée
		 */
		this.y = (typeof y == "number") ? y : parseFloat(y);
	};
	
	JSYG.Vect.prototype = {
			
		constructor : JSYG.Vect,
		/**
		 * Applique une matrice de transformation et renvoie le vecteur transform�. 
		 * @param mtx instance de JSYG.Matrix (ou SVGMatrix)
		 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
		 */
		mtx : function(mtx) {
		
			if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
			if (!mtx) return new JSYG.Vect(this.x,this.y);
			
			var point = svg.createSVGPoint();
			point.x = this.x;
			point.y = this.y;
			point = point.matrixTransform(mtx);
			
			return new JSYG.Vect(point.x,point.y);
		},
				
		/**
		 * Longueur du vecteur
		 * @returns {Number}
		 */
		length : function() { return Math.sqrt( Math.pow(this.x,2) + Math.pow(this.y,2) ); },
		
		/**
		 * Normalise le vecteur
		 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
		 */
		normalize : function() {
			var length = this.length();
			return new JSYG.Vect( this.x / length,this.y / length );
		},
		
		/**
		 * Combine deux vecteurs
		 * @returns {JSYG.Vect} nouvelle instance de JSYG.Vect
		 */
		combine : function(pt,ascl,bscl) {
			return new JSYG.Vect(
				(ascl * this.x) + (bscl * pt.x),
				(ascl * this.y) + (bscl * pt.y)
			);
		},
		
		/**
		 * Renvoie le produit scalaire de deux vecteurs
		 * @param vect instance de JSYG.Vect ou tout objet avec les propriétés x et y.
		 * @returns {Number}
		 */
		dot : function(vect) { return (this.x * vect.x) + (this.y * vect.y); },
	};
	
}());