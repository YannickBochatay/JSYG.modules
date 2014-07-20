define("Vect",["JSYG"],function(JSYG) {
	
	"use strict";

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