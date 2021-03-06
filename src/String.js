define("String",["JSYG","Utils"],function(JSYG) {
	
	"use strict";
	
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
		
	return JSYG.String;
	
});