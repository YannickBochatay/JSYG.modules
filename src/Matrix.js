require(["Vect"],function() {
	
	"use strict";
	
	var svg = JSYG.support.svg;
	/**
	 * Constructeur de matrices JSYG
	 * @param arg optionnel, si défini reprend les coefficients de l'argument. arg peut être
	 * une instance de SVGMatrix (DOM SVG) ou de JSYG.Matrix.
	 * On peut �galement passer 6 arguments num�riques pour définir chacun des coefficients.
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