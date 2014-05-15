(function() {
	
	"use strict";
	
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
	
}());