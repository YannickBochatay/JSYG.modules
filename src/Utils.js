define(["JSYG","Style","String"],function(JSYG) {
	
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
	 * @param precision nombre de décimales
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
	 * Execute une fonction sur le noeud et récursivement sur tous les descendants (nodeType==1 uniquement)
	 * @param fct le mot clé this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
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
	 * exécute une fonction sur la collection et récursivement sur tous les descendants
	 * @param fct le mot clé this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
	 * @returns {JSYG}
	 */
	JSYG.prototype.walkTheDom = function(fct) {
		this.each(function() { return JSYG.walkTheDom(fct,this); });
		return this;
	};
	
	/**
	 * récupère les coordonnées du centre de l'élément.
	 * @param arg optionnel, 'screen','page' ou élément référent (voir JSYG.prototype.getDim pour les détails)
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
			
			if (this.tagName!= 'svg') throw new Error("la méthode viewBox ne s'applique qu'aux conteneurs svg.");
		
			var viewBoxInit = this.viewBox.baseVal;
			var viewBox = viewBoxInit || {} ;
			
			if (dim == null) {
				
				val = {
					x : viewBox.x || 0,
					y : viewBox.y || 0,
					width : viewBox.width || parseFloat(this.getAttribute('width')),
					height : viewBox.height || parseFloat(this.getAttribute('height'))
				};
				
				return false;
			}
			else {
								
				for (var n in dim) {
					if (["x","y","width","height"].indexOf(n)!=-1) viewBox[n] = dim[n];
				}
			}
			
			if (!viewBoxInit) this.setAttribute('viewBox', viewBox.x+" "+viewBox.y+" "+viewBox.width+" "+viewBox.height);
			
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
		
			if (ratio && ratio!="none") throw new Error(ratio+" : désolé, la méthode ne fonctionne pas avec une valeur de preserveAspectRatio différente de 'none'.");
			
			mtx = mtx.scaleNonUniform(scaleX,scaleY);
		}
		
		mtx = mtx.translate(-viewBox.x,-viewBox.y);
		
		return mtx;
	};
	
	/**
	 * Transforme les éléments &lt;svg&gt; de la collection en conteneurs &lt;g&gt;.
	 * Cela peut être utile pour insérer un document svg dans un autre et éviter d'avoir des balises svg imbriquées.
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
	
	
	/**
	 * Style par défaut des éléments html
	 */
	var defaultStyles = {};
	
	/**
	 * Renvoie les propriétés de style par défaut du 1er élément de la collection
	 * @returns {Object}
	 */
	JSYG.prototype.getDefaultStyle = function() {
		
		var tag = this.getTag(),
			elmt,style,i,N,prop;
		
		if (tag == 'a' && this.isSVG()) tag = 'svg:a';
		
		if (!defaultStyles[tag]) {
			
			defaultStyles[tag] = {};
			
			elmt = new JSYG('<'+tag+'>');
			style = getComputedStyle(elmt[0]);
			
			for (i=0,N=style.length;i<N;i++) {
				prop = style.item(i);
				defaultStyles[tag][prop] = style.getPropertyValue(prop);
			}
		}
		
		return defaultStyles[tag];
	};
	
	
	/**
	 * Ajoute tous les éléments de style possiblement définis en css comme attributs.<br/>
	 * Cela est utile en cas d'export SVG, afin d'avoir le style dans les balises et non dans un fichier à part.<br/>
	 * @param recursive si true applique la méthode à tous les enfants.
	 * @returns {JSYG}
	 */
	JSYG.prototype.style2attr = function(recursive) {
		
		var href = window.location.href.replace('#'+window.location.hash,'');
		
		function fct() {
			
			var jThis = new JSYG(this),
				isSVG = jThis.isSVG();
			
			if (isSVG && JSYG.svgGraphics.indexOf(this.tagName) == -1) return;
			
			var style = jThis.getComputedStyle(),
				defaultStyle = jThis.getDefaultStyle(),
				styleAttr = '',
				name,value,
				i=0,N=style.length;
			
			for (;i<N;i++) {
				
				name = style.item(i);
				
				if (isSVG && JSYG.svgCssProperties.indexOf(name)===-1) continue;
				
				value = style.getPropertyValue(name);
				
				if (defaultStyle[name] != value) {
					
					//la fonction getPropertyValue renvoie url("http://monsite.fr/toto/#anchor") au lieu de url(#anchor)
					if (value.indexOf(href) != -1) value = value.replace(href,'').replace(/"|'/g,'');
					
					if (isSVG) this.setAttribute(name,value);
					else styleAttr+= name+':'+value+';';
				}
			}
			
			if (!isSVG) this.setAttribute('style',styleAttr);
		};
		
		if (recursive) this.walkTheDom(fct);
		else fct.call(this[0]);
		
		return this;
	};
	
	JSYG.getStyleRules = function() {
		
		var css = '';
		
		function addStyle(rule) { css+=rule.cssText; }
		
		JSYG.makeArray(document.styleSheets).forEach(function(styleSheet) {
			
			JSYG.makeArray(styleSheet.cssRules || styleSheet.rules).forEach(addStyle);
		});
		    
		return css;
	};

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
	
	/**
	 * Sérialise le noeud sous forme de chaîne de caractère svg 
	 * @param node noeud a représenter
	 * @returns {String}
	 * Le résultat représente un fichier svg complet
	 */
	JSYG.serializeSVG = function(node,_dim) {
			
		var serializer = new XMLSerializer(),
			jNode = new JSYG(node),
			tag = jNode.getTag(),
			isSVG = jNode.isSVG(),
			str,entete;
						
		if (tag == "svg") jNode.attr("xmlns",'http://www.w3.org/2000/svg'); //chrome

		str = serializer.serializeToString(node),
				
		entete = '<?xml version="1.0" encoding="UTF-8"?>'
			+ "\n"
			+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
			+ "\n";
		
		//sans �a, la conversion en pdf avec rsvg pose parfois des probl�mes
		str = str.replace(/ \w+:href=/g,' xlink:href=');
		str = str.replace(/ xmlns:\w+="http:\/\/www\.w3\.org\/1999\/xlink"/g,'');
									
		if (tag === 'svg') {
			
			if (!/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/.test(str)) { //rsvg toujours
				str = str.replace(/^<svg /,'<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
			}
			str = entete + str;
		}
		else {
			
			if (!_dim) _dim = jNode.getDim();
			
			entete+= '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
			if (_dim) entete+=' width="'+_dim.width+'" height="'+_dim.height+'"';
			entete+= '>\n';
			
			if (!isSVG) {
				str = "<foreignObject width='100%' height='100%'>"
					+ "<style>"+JSYG.getStyleRules()+"</style>"
					+ str
					+ "</foreignObject>";
			}
			
			str = entete + str + "\n" + "</svg>";
		}
					
		return str;
	};

	/**
	 * Convertit le 1er élément de la collection en chaîne de caractères correspondant directement à un fichier SVG.
	 * L'élément lui-même n'est pas impacté.
	 * @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
	 * et les images seront intégrées au document (plutôt que liées).
	 * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
	 * @returns {JSYG.Promise}
	 */
	JSYG.prototype.toSVGString = function(standalone,imagesQuality) {
		
		var jNode = this.clone(),
			dim = this.getTag() != 'svg' && this.getDim(),
			promise;
			 			
		jNode.find('script').remove();
			
		if (standalone && this.isSVG()) {
			jNode.walkTheDom(function() {
				new JSYG(this).style2attr().attrRemove("style");
			});
		}
		
		if (standalone) promise = jNode.url2data(true,null,imagesQuality);
		else promise = JSYG.Promise.resolve();
				
		return promise.then(function() {
			return JSYG.serializeSVG(jNode,dim);
		});
	};
		
	/**
	 * Convertit la collection en images sous forme d'url.
	 * L'élément lui-même n'est pas impacté.
	* @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
	 * et les images seront intégrées au document (plutôt que liées).
	 * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
	 * @returns {JSYG.Promise}  
	 * @example <pre>new JSYG('#monSVG").toDataURL().then(function(src) {
	 * 
	 *     new JSYG("<img>").href(src).appendTo('body');
	 *     
	 *     //ou en javascript pur :
	 *     var img = new Image();
	 *     img.src = src;
	 *     document.body.appendChild(img);
	 * 
	 *     //afficher le résultat dans une nouvelle fenêtre :
	 *     window.open(src);
	 * });
	 *  
	 */
	JSYG.prototype.toDataURL = function(standalone,imagesQuality) {
				
		return this.toSVGString(standalone,imagesQuality).then(function(svg) {
			return "data:image/svg+xml;base64," + JSYG.base64encode(svg);
		});
	};
		
	/**
	 * Transforme les liens des images de la collection par le contenu de celles-ci.
	 * Utile pour exporter du svg en intégrant les images (sinon le svg reste dépendant des fichiers images).
	 * @param {Boolean} recursive si true cherche dans les descendants de la collection
	 * @param format optionnel, "png", "jpeg" ("png" par défaut)
	 * @param quality optionnel, qualité de 0 à 100
	 * @returns {JSYG.Promise}
	 * @example <pre>//envoi du contenu svg cété serveur :
	 * new JSYG("svg image").url2data().then(function() {
	 *   new JSYG.Ajax({
	 *   	url:"sauve_image.php",
	 *   	method:"post",
	 *   	data:"img="+new JSYG('svg').toSVGString()
	 *   });
	 * });
	 */
	JSYG.prototype.url2data = function(recursive,format,quality) {
		
		var regURL = /^url\("(.*?)"\)/,
			promises = [];
				
		format = format || 'png';
		
		if (quality!=null) quality /= 100;
				
		function url2data() {
			
			var node = this,
				jNode = new JSYG(this),
				tag = jNode.getTag(),
				isImage = ['image','img'].indexOf(tag) != -1,
				matches = null,
				href;
						
			if (!isImage) {
				
				matches = jNode.css("background-image").match(regURL);
				href = matches && matches[1];
			}
			else href = jNode.href();
							
			if (!href || /^data:/.test(href)) return;
			
			promises.push( new JSYG.Promise(function(resolve,reject) {
					
				var img = new Image(),
					canvas = document.createElement('canvas'),
					ctx = canvas.getContext('2d');
				
				img.onload = function() {
					
					var data;
					
					canvas.width = this.width;
					canvas.height = this.height;
					ctx.drawImage(this,0,0);
					
					try {
						
						data = canvas.toDataURL("image/"+format,quality);
											
						if (isImage) jNode.href(data); 
						else jNode.css("background-image",'url("'+data+'")');
						
						resolve(node);
					}
					catch(e) {
						/*security error for cross domain */
						reject(e);
					}
				};
				
				img.onerror = reject;
				
				img.src = href;
				
			}) );
		}

		if (recursive) this.each(function() { this.walkTheDom(url2data); },true);
		else this.each(url2data);
														
		return JSYG.Promise.all(promises);
	};

	/**
	 * Convertit le 1er élément de la collection en élément canvas.
	 * L'élément lui-même n'est pas impacté.
	 * @return {JSYG.Promise}
	 * @example <pre>new JSYG('#monSVG").toCanvas().then(function(canvas) {
	 *   new JSYG(canvas).appendTo("body");
	 * });
	 */
	JSYG.prototype.toCanvas = function() {
		
		var dim = this.getDim( this.offsetParent() ),
			canvas = document.createElement("canvas"),
			node = this[0],
			ctx = canvas.getContext('2d'),
			tag = this.getTag(),
			promise;
			
		canvas.width = dim.width;
		canvas.height = dim.height;
		
		if (tag == "img" || tag == "image") promise = JSYG.Promise.resolve( this.href() );
		else promise = this.toDataURL();
		
		return promise.then(function(src) {
			
			return new JSYG.Promise(function(resolve,reject) {
								
				function onload() {
					
					try {
						ctx.drawImage(this,0,0,dim.width,dim.height);
						resolve(canvas);
					}
					catch(e) { reject(new Error("Impossible de dessiner le noeud "+tag)); }
				}
				
				if (tag == 'canvas') return onload.call(node);
				
				var img = new Image();
				img.onload = onload;
				img.onerror = function() { reject( new Error("Impossible de charger l'image") ); };
				img.src = src;
			});
		});
	};
	
});