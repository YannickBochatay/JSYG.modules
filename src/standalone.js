(function() {
	
	"use strict";
	
	/**
	* exécute une fonction sur chaque élément de la liste.
	* @param list liste à traiter (Array, NodeList, SVGList, FileList, JSYG, etc)
	* @param callback fonction a �x�cuter sur chaque élément. this fait référence à l'élément, le 1er argument son indice.
	* Si la fonction renvoie false, on sort de la boucle.
	* @returns list
	*/
	JSYG.each = function(list,callback) {
		
		var i,N,item;
		
		if (typeof list == 'object' || typeof list == "string") {
		
			if (typeof list.length == "number") {
			
				for (i=0,N=list.length;i<N;i++) {
					item = list[i];
					if (callback.call(item,i,item) === false) return list;
				}
			}
			else if (typeof list.numberOfItems == "number") { //SVGList
			
				for (i=0,N=list.numberOfItems;i<N;i++) {
					item = list.getItem(i);
					if (callback.call(item,i,item) === false) return list;
				}
			}
			else {
				for (i in list) {
					item = list[i];
					if (callback.call(item,i,item) === false) return list;
				}
			}
		}
		
		return list;
	};
	
	/**
	 * Ajoute les propriétés des objets passés en arguments au premier argument.
	 * Si le premier poss�de déjà la propriété, elle est �cras�e. Si la propriété est un objet, la méthode s'applique r�cursivement.
	 * @param target objet à �tendre
	 * @param source objet dont les propriétés doivent être copi�es.
	 * Le nombre d'arguments n'est pas limit�.
	 * @returns target l'objet �tendu
	 */
	JSYG.extend = function(target,source) {
	
		if (target == null) target = {};
	
		slice.call(arguments,1).forEach(function(source) {
			for (var n in source) {
				if (source[n] !== undefined){
					if (JSYG.isPlainObject(source[n]) && JSYG.isPlainObject(target[n])) JSYG.extend(target[n],source[n]);
					else target[n] = source[n];
				}
			}
		});
				
		return target;
	};
	
	/**
	 * Teste si l'argument est un objet pur (instance de Object, sans h�ritage). Tir� de jQuery isPlainObject.
	 * @param obj
	 * @returns {Boolean}
	 */
	JSYG.isPlainObject = function(obj) {
				
		if (!obj || typeof obj !== "object" || obj.nodeType || JSYG.isWindow(obj)) return false;
		
		try {
			if ( obj.constructor && !obj.hasOwnProperty("constructor") && !obj.constructor.prototype.hasOwnProperty("isPrototypeOf") ) return false;
		} catch (e) { return false; }
		
		var key;
		for (key in obj) {}
		
		return key == null || obj.hasOwnProperty(key);
	};
	
	/**
	 * Teste si l'argument est un objet window
	 * @param obj
	 * @returns {Boolean}
	 */
	JSYG.isWindow = function(obj) {
		//pas terrible, mais c'est la méthode jQuery
		return !!(typeof obj === 'object' && obj!==null && 'setInterval' in obj);
	};
	
	//tir� de jQuery
	var class2type = {};
	
	"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	});
	
	/**
	 * Renvoie le type d'objet natif javascript (boolean,number,string,function,array,date,regexp,null,undefined,object)
	 * @param obj
	 * @returns {String}
	 */
	JSYG.type = function(obj) {
		return obj == null ? String( obj ) : class2type[ Object.prototype.toString.call(obj) ] || "object";
	};
	
	/**
	 * Teste si l'argument est num�rique (au sens large)
	 * @param arg
	 * @returns {Boolean}
	 * @example JSYG.isNumeric("14") === true
	 */
	JSYG.isNumeric = function(arg) {
		return !isNaN(parseFloat(arg)) && isFinite(arg);
	};
		
	/**
	 * Renvoie un tableau d'objets à partir d'une liste.
	 * @param list collection de type JSYG, NodeList, SVGList, FileList, etc.
	 * @returns {Array}
	 */
	JSYG.makeArray = function(list) {
		
		var tab = [],i,N;
		
		if (list && typeof list === 'object') {
			
			if (list.nodeType!= null || JSYG.isWindow(list)) tab = [list];
			else if (typeof list.length == "number") {
			    try { tab = slice.call(list); } //IE7 ne l'accepte qu'avec des objets natifs (pas les objets DOM)
			    catch(e) {
			    	for (i=0,N=list.length;i<N;i++) tab.push(list[i]);
			    }
			}
			else if (list.numberOfItems!=null && JSYG.type(list.getItem) === 'function') { //SVGList
				for (i=0,N=list.numberOfItems;i<N;i++) tab.push(list.getItem(i));
			}
		}
		
		return tab;
	};
	
	/**
	* Renvoie la collection d'objets DOM sous forme de tableau.
	*/
	JSYG.prototype.toArray = function() { return JSYG.makeArray(this); };
	
	/**
	 * récupère l'objet window de l'élément DOM passé en argument
	 * @param arg
	 * @returns objet window
	 */
	JSYG.getWindow = function(arg) {
		if (JSYG.isWindow(arg)) return arg;
		else if (arg.nodeType === 9) return arg.defaultView || arg.parentWindow;
		else return JSYG.getWindow(arg.ownerDocument);
	};
	
	/**
	 * récupère un tableau d'objets DOM à partir d'un sélecteur css.
	 * @param arg sélecteur css
	 * @param root optionnel, le noeud parent à partir duquel on fait la recherche
	 * @returns {Array} tableau d'objets DOM
	 */
	function querySelectorAll(arg,root) {
		
		var liste;
		
		root = root || window.document;

		try { liste = root.querySelectorAll(arg); }
		catch(e) { throw new Error(arg+" : sélecteur incorrect."); }
						
		return JSYG.makeArray(liste);
	}
	
	/**
	 * récupère les descendants de chaque élément de la collection filtr�s par un sélecteur css.
	 * @param arg sélecteur css
	 * @returns {JSYG}
	 */
	JSYG.prototype.find = function(arg) {
		
		var list = [];
		this.each( function() { list = list.concat(querySelectorAll(arg,this)); } );
		return new JSYG(list);
	};
	
	/**
	 * eval "propre"
	 * @param {String,Object} data : chaîne javascript ou noeud xml/html à �valuer
	 */
	JSYG.globalEval = function(data) {
		
		var allscript,head,script,i,N;
	
		if (typeof data === 'object' && data.getElementsByTagName) {
			allscript = data.getElementsByTagName('script');
			for (i=0,N=allscript.length;i<N;i++) { JSYG.globalEval(allscript.item(i).text); }
			return;
		}
	
		head = document.getElementsByTagName("head").item(0);
		script = document.createElement("script");
		script.text = data;
		head.appendChild(script);
		head.removeChild(script);
	};
	
	/**
	 * exécute une fonction sur chaque élément de la collection JSYG.
	 * On peut sortir de la boucle en renvoyant false.
	 * Dans la fonction de rappel, this fait référence (par défaut) à l'élément DOM de la collection,
	 * et le premier argument est l'indice de l'élément dans la collection.
	 * @param callback fonction de rappel 
	 * @returns {JSYG}
	 */
	JSYG.prototype.each = function(callback) {
						
		var resul;
		for (var i=0,N=this.length;i<N;i++) {
			resul = callback.call(this[i],i,this[i]);
			if (resul === false) break;
		}
		return this;
	};
	
	var cacheData = [];
	//nom de propriété unique à attacher à l'objet DOM pour retrouver ses données dans le cache
	var propData = "JSYG" + Math.random().toString().replace( /\D/g, "" );
	
	/**
	 * Stockage ou Récupération de données sur les éléments DOM de la collection. Ainsi, on retrouve ces données dans toutes les instances JSYG pointant vers ces éléments.
	 * @param key chaîne, identifiant de la donnée
	 * @param value optionnel et de type libre. Si non renseign�, renvoie la valeur de la donnée identifi�e par key (du premier élément), sinon affecte la valeur à la donnée identifi�e par key. 
	 * @returns {JSYG} si value est renseign�, la donnée du premier élément de la collection sinon
	 */
	JSYG.prototype.data = function(key,value) {

		if (typeof(key) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in key) {
				if (key.hasOwnProperty(n)) { this.data(n,key[n]); }
			}
			return this;
		}
		
		var val;
						
		this.each(function() {
		
			if (this[propData] == null) { this[propData] = cacheData.length; cacheData.push({}); }
			
			var ind = this[propData];
					
			//lecture
			if (value == null) { val = cacheData[ind] && cacheData[ind][key]; return false; }
			else { cacheData[ind][key] = value; }
			
			return null;
		});
		
		return (value == null) ? val : this;
	};
	
	/**
	 * Suppression d'une donnée sur les éléments de la collection.
	 * @param key identifiant de la donnée. Si non renseign�, efface toutes les données de la collection.
	 * @returns {JSYG}
	 */
	JSYG.prototype.dataRemove = function(key) {
				
		var a=arguments,
		i,N=a.length;
		
		this.each(function() {
			
			var ind = this[propData];
			if (ind == null) return;

			if (key==null) {
				delete cacheData[ind];//on efface tout
				try { delete this[propData]; }
				catch(e) { this[propData] = null; } //IE7
			} 
			else {
				for (i=0;i<N;i++) {
					if (a[i] in cacheData[ind]) { delete cacheData[ind][a[i]]; }
				}
			}
		});
		
		return this;
	};
	
	/**
	 * Clone le noeud DOM (et ses enfants). Les écouteurs d'évènements ne sont pas clon�s.
	 * @returns {JSYG} objet clon�
	 */
	JSYG.prototype.clone = function(/*events*/) {
		
		var list = [];
		
		this.each(function() {
					
			var clone = this.cloneNode(true);
					
			//tir� de jQuery
			if (!JSYG.support.cloneEvent) { //IE
				
				clone[propData] = null;
				
				// We do not need to do anything for non-Elements
				if ( clone.nodeType !== 1 ) { return null; }
				// clearAttributes removes the attributes, which we don't want, but also removes the attachEvent events, which we *do* want
				clone.clearAttributes();
				// mergeAttributes, in contrast, only merges back on the original attributes, not the events
				clone.mergeAttributes(this);
				
				clone[propData] = undefined;
			}
			
			//if (events) { new JSYG(clone).cloneEvents(this); }
			
			list.push(clone);
			
			return null;
		});
							
		return new JSYG(list);
	};
	
	/**
	 * Supprime tous les écouteurs d'évènements, les données et les "données attributs" de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.clean = function() {
		
		this.each(function() {
			this.off(); //suppression de tous les écouteurs d'évènement
			this.dataRemove(); //suppression des données attach�es à l'élément
			this.dataAttrRemove();
		},true);
		return this;
	};
	
	/**
	 * Vide le contenu DOM de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.empty = function() {
		
		this.each(function() {
			while (this.firstChild) { this.removeChild(this.firstChild); }
		});
		
		return this;
	};
	
	
	
	/**
	* Display par défaut des éléments
	*/
	var elementDisplay = {};
	
	/**
	* Renvoie le display par défaut de l'élément. Tir� de zepto.js. Peut mieux faire.
	*/
	function defaultDisplay(obj) {
	
		var element, display;
		
		var nodeName = obj.getTag();
		
		if (!elementDisplay[nodeName]) {
			
			var type = obj.getType();
			var parent;
			if (type == 'svg') { parent = new JSYG('<svg>').appendTo('body'); }
			else { parent = 'body'; }
			
			element = new JSYG('<'+nodeName+'>').appendTo(parent);
			display = element.css('display');
			
			if (type == 'svg') { parent.remove(); }
			else { element.remove(); }
			
			if (display == "none") { display = "block"; }
			elementDisplay[nodeName] = display;
		}
		return elementDisplay[nodeName];
	}
	
	
	
	function separeValUnite(str){
		str = (str != null) ? str.toString() : "";
		var result = /(-?\d*\.?\d+)(px|pt|em|%|deg)$/.exec(str);
		return {
			value: (result && result[1]!=null) ? parseFloat(result[1]) : JSYG.isNumeric(str) ? parseFloat(str) : str,
			units:result && result[2] || ''
		};
	}
	
	
	/**
	 * Liste des propriétés css3 nécessitant un pr�fixe (-moz,-webkit, etc)
	 */
	JSYG.css3Properties = [];
	
	/**
	 * Liste des pr�fixes des diff�rents navigateurs
	 */
	JSYG.vendorPrefixes = ['','Moz','Webkit','O','ms'];
		
	/**
	 * Affecte ou récupère des éléments de style.<br/><br/>
	 * Pour définir rapidement plusieurs propriétés, on peut passer en paramêtre un objet dont les cl�s sont les noms de propriétés et les valeurs les valeurs à affecter.<br/> <br/>
	 * @param prop nom de la propriété au format css ("z-index") ou js ("zIndex").
	 * @param val si définie, fixe la valeur de cette propriété de style. Dans certains cas, une valeur num�rique est admise.
	 * <br/><br/>
	 * Valeurs sp�ciales uniformis�es :
	 * <ul>
	 * <li>float</li>
	 * <li>opacity</li>
	 * <li>scrollTop</li>
	 * <li>scrollLeft</li>
	 * </ul>
	 * @example :<ul>
	 * <li><strong>jsynObjet.css('visibility')</strong> : renvoie la propriété de style 'visibility'</li>
	 * <li><strong>jsynObjet.css('visibility','hidden')</strong> : fixe la propriété de style 'visibility' à 'hidden'</li>
	 * <li><strong>jsynObjet.css({'visibility':'visible','width':'50px'})</strong> : fixe les valeurs de 'visibility' et 'width'</li> 
	 * </ul>
	 * @returns {String,JSYG} valeur de la propriété si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
	 */
	JSYG.prototype.css = function(prop,val) {
				
		if (typeof(prop) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in prop) {
				if (prop.hasOwnProperty(n)) this.css(n,prop[n]);
			}
			return this;
		}
		
		if (val == null && prop == 'float') return this.css('cssFloat');
		
		var jStr = new JSYG.String(prop),
			jsFormat = jStr.camelize().valueOf(),
			cssFormat =  jStr.dasherize().valueOf();
		
		//lecture
		if (val == null) {
			
			if (jsFormat == 'scrollLeft') return this.scrollLeft();
			else if (jsFormat == 'scrollTop') return this.scrollTop();

			//propriété �crite en dur (soit dans la balise, soit déjà forc�e en javascript)
			else if (this[0].style && this[0].style[jsFormat]) val = this[0].style[jsFormat];
			 //propriété standard
			else if (this[0].getAttribute && this[0].getAttribute(cssFormat)) val = this[0].getAttribute(cssFormat);
			 //�crite dans une feuille de style (W3C)
			else if (window.getComputedStyle) val = window.getComputedStyle(this[0],null).getPropertyValue(cssFormat) || undefined; //sinon renvoie une chaîne nulle
			 //�crite dans une feuille de style (IE)
			else if (this[0].currentStyle && this[0].currentStyle[jsFormat]) return this[0].currentStyle[jsFormat];
			//compatibilité IE
			else if (prop == 'cssFloat') return this.css('styleFloat');
			else if (prop == 'opacity') {
				val = this[0].style.filter;
				if (val != null) {
					val = /alpha\(opacity=([^)]*)\)/i.exec(val);
					val = val && val[1] || 1;
				}
				else val = 1;
			}
			else val = undefined;
							
			return val;
			
		}
		else {
			
			this.each(function() {
				
				if (jsFormat == "display" && val === "") { //valeur par défaut
					var jThis = new JSYG(this);
					return jThis.css("display",defaultDisplay(jThis));
				}
		
				var type = this.getType();
										
				val = getAbsValue(this,prop,val);
								
				if (type === 'html') {
					
					if (prop == 'scrollLeft') this.scrollLeft(val);
					else if (prop == 'scrollTop') this.scrollTop(val);
					else if (this[0].style) {
						
						if (JSYG.isNumeric(val) && jsFormat.match(/^(padding|margin|width|height|border|left|top|bottom|right|fontSize)/)) { val+= 'px'; }
						
						this[0].style[jsFormat] = val;
											
						//iframes, svg, etc
						if ((jsFormat == 'width' || jsFormat == 'height') && this[0].getAttribute(jsFormat) != null) {
							this[0].setAttribute(cssFormat,val);
						}
						
						if (jsFormat == 'opacity' && this[0].style.filter!=null) {
							val = (val==1) ? '' : 'alpha(opacity='+Math.round(val*100)+')';
							this[0].style.filter = val;
							this[0].style.zoom = 1;
						}
						else if (jsFormat == 'float') { this[0].style.cssFloat = this[0].style.styleFloat = val; }
						else if (jsFormat == 'display' && val === '') {
							this[0].style.display = defaultDisplay(this);
						}
						else if (JSYG.css3Properties.indexOf(cssFormat) !== -1) {
							JSYG.vendorPrefixes.forEach( function(prefix) { this.css(prefix+prop,val); }.bind(this) );
						}
					}
				} else if (type === 'svg') {
					
					if (JSYG.svgCssProperties.indexOf(cssFormat)!==-1) {
						this[0].setAttribute(cssFormat,val);
						this[0].style[jsFormat] = val;
					}
					else if (jsFormat == 'width' || jsFormat == 'height' && this[0].getAttribute(jsFormat) != null) {
						this[0].setAttribute(cssFormat,val);
					}
				}
				
			},true);
		
			return this;
		}
	};
	
	/**
	 * Supprime la collection de l'arbre DOM. La collection existe toujours en m�moire.
	 * @param {Boolean} clean si true vide les données et les écouteurs d'évènements li�s à la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.remove = function(clean) {
		
		this.each(function() {
			if (clean) new JSYG(this).clean();
			this.parentNode && this.parentNode.removeChild(this);
		});
		
		return this;
	};

	/**
	 * récupère ou fixe la valeur d'un attribut (au sens xml).<br/><br/>
	 * Pour définir rapidement plusieurs attributs, on peut passer en paramêtre un objet dont les cl�s sont les noms des attributs et les valeurs les valeurs à affecter.<br/> <br/>
	 * @param attr nom de l'attribut.
	 * @param val si définie, fixe la valeur de l'attribut.
	 * <br/><br/>
	 * @example :<ul>
	 * <li><strong>jsynObjet.attr('name')</strong> : renvoie l'attribut name de l'élément.</li>
	 * <li><strong>jsynObjet.attr('name','toto')</strong> : définit l'attribut name de l'élément.</li> 
	 * </ul>
	 * @returns {String,JSYG} valeur de l'attribut si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
	 */
	JSYG.prototype.attr = function(attr,val) {
		
		if (attr==null) return this;
		
		if (typeof(attr) == 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in attr) {
				if (attr.hasOwnProperty(n)) this.attr(n,attr[n]);
			}
			return this;
		}
		
		if (val == null) {
			
			if (this.type == 'svg') return this[0].getAttribute(attr);
			else {
				val = this[0][attr];
				if (typeof val == "string") return val;
				else return this[0].getAttribute(attr);
			}
		}
		else {
						
			this.each(function() {
				if (new JSYG(this).type == 'svg') this.setAttribute(attr,val);
				else {
					try { this.setAttribute(attr,val); }
					catch(e) { this[attr] = val; }
				}
			});
		}

		return this;
	};
	
	/**
	 * Suppression d'un ou plusieurs attributs des éléments de la collection.
	 * @param attr nom de l'attribut. Le nombre d'arguments n'est pas limit�.
	 * @returns {JSYG}
	 */
	JSYG.prototype.attrRemove = function(attr) {	
		
		var a=arguments,
			i,N=a.length;
			
		this.each(function() {
			for (i=0;i<N;i++) this.removeAttribute(a[i]);
		});
		
		return this;
	};
	
	/**
	 * Attache un ou plusieurs noeuds au premier élément de la collection. 
	 * @param arg argument JSYG. Le nombre d'arguments n'est pas limit�.
	 * @returns {JSYG}
	 */
	JSYG.prototype.append = function(arg) {
		
		var a = arguments,
			node = this[0],
			i,N=a.length;
		
		for (i=0;i<N;i++) {
			new JSYG(a[i]).each(function() { node.appendChild(this); });
		}
		
		return this;
	};
	
	/**
	 * Attache la collection à l'élément passé en argument
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.appendTo = function(arg) {
		
		var jArg = new JSYG(arg); 
		jArg.append.apply(jArg,JSYG.makeArray(this));
		return this;
	};
	
	/**
	 * Attache un ou plusieurs noeuds au premier élément de la collection, avant son premier enfant.
	 * @param arg argument JSYG. Le nombre d'arguments n'est pas limit�.
	 * @returns {JSYG}
	 */
	JSYG.prototype.prepend = function(arg) {
		
		var a = arguments,
			node = this[0],
			i,N=a.length;
	
		for (i=0;i<N;i++) {
			new JSYG(a[i]).each(function() {
				if (node.firstChild) node.insertBefore(this,node.firstChild);
				else node.appendChild(this);
			});
		}
		
		return this;
	};
	
	/**
	 * Attache la collection avant le premier enfant de l'élément passé en argument.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.prependTo = function(arg) {
		
		var jArg = new JSYG(arg); 
		jArg.prepend.apply(jArg,JSYG.makeArray(this));
		return this;
	};
	
	/**
	 * Remplace l'élément passé en argument par le premier élément de la collection.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.replace = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node || !node.parentNode) throw new Error(node +" n'est pas un noeud DOM ou n'est pas attach� au DOM");
		node.parentNode.replaceChild(this[0],node);
		return this;
	};
	
	/**
	 * Remplace le premier élément de la collection par l'élément passé en argument
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.replaceWith = function(arg) {

		new JSYG(arg).replace(this);
		return this;
	};
	
	/**
	 * Insert la collection avant l'élément passé en argument.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.insertBefore = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node) throw new Error("Argument incorrect pour la méthode replace");
		this.each(function() { node.parentNode.insertBefore(this,node); });
		return this;
	};
	
	/**
	 * Insert la collection apr�s l'élément passé en argument.
	 * @param arg argument JSYG
	 * @returns {JSYG}
	 */
	JSYG.prototype.insertAfter = function(arg) {
		
		var node = new JSYG(arg)[0];
		if (!node) throw new Error("Argument incorrect pour la méthode replace");
		
		this.each(function() {
			if (node.nextSibling) node.parentNode.insertBefore(this,node.nextSibling);
			else node.parentNode.appendChild(this);
		});
		return this;
	};
	
	/**
	 * récupère ou définit le texte à l'int�rieur des éléments de la collection
	 * @param str si défini, définit le texte de l'élément. Attention cela écrase le html contenu dans l'élément.
	 * @link https://developer.mozilla.org/fr/DOM/element.textContent
	 * @returns contenu du texte si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.text = function(str) {
				
		if (str == null) {
			
			if (this[0].textContent!=null) return this[0].textContent;
			else if (this[0].innerText!=null) return this[0].innerText;
			return null;
			
		} else {
			
			this.each(function() {
				if (this.textContent!=null) this.textContent = str;
				else if (this.innerText!=null) this.innerText = str;
			});
			
			return this;
		}
	};
	
	/**
	 * récupère ou définit la valeur (attribut value) du(des) champ(s) de formulaire de la collection
	 * @param value si défini, fixe la valeur de l'attribut "value"
	 * @param preventEvt si value est définie et preventEvt est true, ne déclenche pas l'évènement "change" sur l'élément. false par défaut.
	 * @returns la valeur si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.val = function(value,preventEvt) {
		
		var val;
				
		this.each(function() {
		
			var node = this[0],
				tag = this.getTag(),
				type, oldval,
				options,i,N,ind;
			
			if (['textarea','select'].indexOf(tag) !== -1) type = tag;
			else if (tag == 'input') type = this.attr("type");
			
			if (type == null) throw new Error("La méthode val n'est pas valable pour les éléments "+tag);
			
			type = type.toLowerCase();
						
			if (value === undefined) {
				
				switch (type) {
					
					case 'checkbox' :
						
						val = node.checked ? 'on' : null;
						break;
						
					case 'select' :
						
						if (node.selectedIndex == -1) val = null;
						else if (node.options[node.selectedIndex].value) val = node.options[node.selectedIndex].value;
						else val = node.options[node.selectedIndex].text;
						break;
						
					case 'option' :
						
						val = node.value === '' ? node.text : node.value;
						break;
						
					default :
						
						val = node.value;
						break;
				}
				
				return false;
			}
			else {
			
				oldval = this.val();
											
				switch (type) {
					
					case 'radio' : case 'checkbox' :
						
						node.checked = !!value;
						break;
						
					case 'select' :
						
						options = node.options;
												
						if (typeof value !== 'number') {
							
							ind = -1;
							
							for (i=0,N=options.length;i<N;i++) {
								
								if (options[i].value == value || options[i].text == value) {
									ind = i;
									break;
								}
							}
						}
						else ind = value;
						
						node.selectedIndex = ind;
						
						break;
						
					default :
						
						node.value = value;
						break;
				}
								
				if (this.val() != oldval && !preventEvt) {
					
					if (!JSYG.support.inputAutoFireEvent) this.trigger('input');
					
					this.trigger('change');
				}
			}
			
		},true);
		
		return value === undefined ? val : this;
	};
	
	/**
	 * récupère ou définit le contenu html de la collection.
	 * Le css contenu dans les balises &lt;style&gt; et le javascript dans les balises &lt;script&gt; sont interprétés.
	 * @param html si défini, fixe le contenu html
	 * @returns contenu html si html est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.html = function(html) {
		
		var jsContent = [],
			cssContent = [];
		
		if (html == null) return this[0] && this[0].innerHTML;
				
		html = new JSYG.String(html)
		.stripTagAndContent('script',jsContent)
		.stripTagAndContent('style',cssContent)
		.valueOf();
		
		cssContent.forEach(function(style) { JSYG.addStyle(style); });
		
		this.each(function() {
			this.innerHTML = html;
			jsContent.forEach(function(script) { JSYG.globalEval(script); });
		});
		
		return this;
	};
	
	function searchNodes(jObj,search) {
		
		var tab = [];
		
		jObj.each(function() {
			var elmt = this[search];
			while (elmt && elmt.nodeType !== 1) { elmt = elmt[search]; } 
			elmt && tab.push(elmt);
		});
		
		return new JSYG(tab);
	}
	
	/**
	 * Renvoie l'objet JSYG des parents des éléments de la collection
	 * @returns {JSYG}
	 */
	JSYG.prototype.parent = function() {
		return searchNodes(this,'parentNode');
	};
	
	
	var rroot = /^(?:body|html)$/i;
	
	/**
	 * Renvoie l'objet JSYG des parents positionn�s ('relative','absolute','fixed' ou viewport pour les éléments svg) de la collection.<br/><br/>
	 * @param arg optionnel, si on passe "farthest" renvoie le viewport (balise &lt;svg&gt;) le plus �loign� pour les éléments svg, et document.body par souci de compatibilité pour les éléments html.
	 * @returns {JSYG}
	 */
	JSYG.prototype.offsetParent = function(arg) {
		
		var tab = [];
		
		this.each(function() {
			
			var elmt,farthest;
			
			if (this.getType() == 'svg') {
				
				if (arg === 'farthest') elmt = this[0].farthestViewportElement;
				else elmt = this[0].nearestViewportElement;
				
				if (!elmt) { //les éléments non tracés (dans une balise defs) ne renvoient rien, par simplicit� on renvoit la balise svg parente
					
					elmt = this[0].parentNode;
					
					while (elmt && (elmt.tagName!='svg' || arg == "farthest")) {
						elmt = elmt.parentNode;
						if (elmt.tagName == "svg") farthest = elmt;
					}
					
					if (farthest) elmt = farthest;
				}
			}
			else {
			
				if (arg === 'farthest') { elmt = document.body; }
				else {
					elmt = this[0].offsetParent;
					if (!elmt || elmt.nodeName == 'HTML' && this[0].nodeName != 'BODY') { elmt = document.body; }
					while (elmt && !rroot.test(elmt.nodeName) && new JSYG(elmt).css("position") === "static") { elmt = elmt.offsetParent; }
				}
			}
			
			elmt && tab.push(elmt);
			
		},true);
		
		return new JSYG(tab);
	};
	

	/**
	 * Renvoie l'objet JSYG des éléments DOM (textNodes exclus) pr�c�dant imm�diatement les éléments de la collection 
	 * @returns {JSYG}
	 */
	JSYG.prototype.prev = function() {
		return searchNodes(this,'previousSibling');
	};
	
	/**
	 * Renvoie l'objet JSYG des éléments DOM (textNodes exclus) suivant imm�diatement les éléments de la collection 
	 * @returns {JSYG}
	 */
	JSYG.prototype.next = function(i) {
		return searchNodes(this,'nextSibling');
	};

	/**
	 * Renvoie les enfants directs de la collection (textNodes exclus) 
	 * @param ind optionnel, indice de l'enfant dans la liste des enfants directs.<br/>
	 * Si négatif, part de la fin de la collection.<br/>
	 * Si non renseigné, renvoie tous les enfants directs.
	 * @returns {JSYG}
	 */
	JSYG.prototype.children = function(ind) {
		
		var tab = [],
			reverse = (ind < 0), 
			ref = reverse ? -ind-1 : ind;
		
		function push(node) { if (node.nodeType == 1) tab.push(node); }
		
		this.each(function() {
			
			var elmt, i;
			
			if (ind == null) JSYG.makeArray(this.childNodes).forEach(push);
			else {
				
				i = -1;
				
				elmt = this[ (reverse ? 'last':'first') + 'Child' ];
				
				if (elmt && elmt.nodeType == 1) i++;
				
				while (elmt && i < ref) {
					elmt = elmt[ (reverse ? 'previous':'next') + 'Sibling' ];
					if (elmt && elmt.nodeType == 1) i++;
				}
				
				elmt && tab.push(elmt);
			}
		});
		
		return new JSYG(tab);
	};
	
	/**
	 * réduit la collection à l'élément à l'index spécifié.
	 * @param i indice de l'élément. Si négatif, part de la fin de la collection.
	 * @returns {JSYG} ou null si pas d'élément DOM correspondant
	 */
	JSYG.prototype.eq = function(i) {
		if (i < 0) i = this.length + i;
		return this[i] ? new JSYG(this[i]) : null;
	};
	
	/**
	 * Filtre les éléments de la collection qui correspondent au sélecteur
	 * @param selector sélecteur css
	 * @returns {JSYG} nouvelle colleciton
	 */
	JSYG.prototype.filter = function(selector) {
		
		var elmts = [];
		
		this.each(function() {
			if (this.is(selector)) elmts.push(this);
		},true);
		
		return new JSYG(elmts);
	};
	
	/**
	 * Ajoute les éléments de l'arguments à la collection
	 * @param arg argument JSYG
	 * @returns {JSYG} nouvelle instance JSYG
	 */
	JSYG.prototype.add = function(arg) {
		
		var tab1 = JSYG.makeArray( this ),
			tab2 = JSYG.makeArray( new JSYG(arg) );
		
		return new JSYG( tab1.concat(tab2) );
	};
	
	/**
	 * réduit la collection aux indices spécifiés
	 * @param start indice de l'élément de départ. Si négatif, part de la fin de la collection.
	 * @param end indice de l'élément de fin. Si négatif, part de la fin de la collection.
	 * @returns {JSYG}
	 */
	JSYG.prototype.slice = function(start,end) {
		
		if (start < 0) start = this.length + start;
		
		if (end == null) end = this.length;
		else if (end < 0) end = this.length + end;
		
		return new JSYG( slice.call(this,start,end) );
	};
	
	
	var matchesSelector = (function() {
		var div = document.createElement('div');
		var method = null;
		JSYG.vendorPrefixes.forEach(function(pre) {
			var testmethod = pre.toLowerCase()+'MatchesSelector'; 
			if (div[testmethod]) method = testmethod;
		});
		return method;
	}());

	function matches(element, selector) {
		
		if (!element || element.nodeType !== 1) return false;
		
		if (matchesSelector) return element[matchesSelector](selector);
		else return querySelectorAll(selector,element.parentNode).indexOf(element) !== -1;
	}
	
	/**
	 * Teste si au moins un élément de la collection serait sélectionn� par le sélecteur (ou la collection) passé en argument. 
	 * @param selector argument JSYG
	 * @returns {Boolean}
	 */
	JSYG.prototype.is = function(selector) {
		
		var test = false;
		
		var type = 'str';
		if (typeof selector != 'string') { type = 'jsyg'; selector = new JSYG(selector); }
		
		this.each(function() {
			if (type == 'str' && matches(this,selector) || selector.indexOf(this) !== -1) { test = true; return false; }
		});
		
		return test;
	};
	
	/**
	 * Exclut les éléments passés en arguments.
	 * @param selector argument JSYG. On peut �galement passer une fonction, auquel cas
	 * tous les éléments pour lesquels la fonction renvoie false sont conservés
	 * (this fait référence à chaque élément DOM).
	 * @example <pre>//renvoie tous les enfants sauf les balises images
	 * var list = new JSYG("#maDiv *").not('img');
	 * 
	 * var list = new JSYG("#maDiv *");
	 * list = list.not(function() {
	 *	//conserve uniquement les éléments contenant une donnée toto
	 *	if (new JSYG(this).data("toto")) return false;
	 * });
	 * </pre>
	 * @returns {JSYG}
	 **/
	JSYG.prototype.not = function(selector) {
	    
	    var nodes=[];
	    
	    if (typeof selector == "function") {
		
	      this.each(function(i){
	    	  if (!selector.call(this,i)) { nodes.push(this); }
	      });
	      
	    }
	    else {
		
			var excludes = new JSYG(selector);
			
			this.each(function() {
			   if (excludes.indexOf(this) == -1) nodes.push(this);		   
			});
	    }
	    
	    return new JSYG(nodes);
	};
	
	
	/**
	 * Récupère ou définit le scroll horizontal. Fonctionne avec window, document (équivalent à window) ou des éléments du DOM.
	 * @param val valeur du scroll
	 * @returns scroll si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.scrollLeft = function(val) {
		
		if (val == null) {
			
			var elem = this[0];
			
			if (JSYG.isWindow(elem)) {
				return elem.pageXOffset || elem.document.documentElement.scrollLeft;
			} else if (elem.nodeType === 9) {
				return JSYG.getWindow(elem).pageXOffset || elem.documentElement.scrollLeft;
			}
			
			return elem.scrollLeft || 0;
		}
		
		this.each(function() {
			if (JSYG.isWindow(this) || this.nodeType === 9) JSYG.getWindow(this).scrollTo(val,0); 
			else this.scrollLeft = val;
		});
		
		return this;
	};
	
	/**
	 * Récupère ou définit le scroll vertical. Fonctionne avec window, document (équivalent à window) ou des éléments du DOM.
	 * @param val valeur du scroll
	 * @returns scroll si val est indéfini, l'objet JSYG lui-même sinon.
	 */
	JSYG.prototype.scrollTop = function(val) {
		
		if (val == null) {
			
			var elem = this[0];
			
			if (JSYG.isWindow(elem)) {
				return elem.pageYOffset || elem.document.documentElement.scrollTop;
			} else if (elem.nodeType === 9) {
				return JSYG.getWindow(elem).pageYOffset || elem.documentElement.scrollTop;
			}
			return elem.scrollTop || 0;
		}
		
		this.each(function() {
			if (JSYG.isWindow(this) || this.nodeType === 9) JSYG.getWindow(this).scrollTo(0,val);
			else this.scrollTop = val;
		});
		
		return this;
	};
	
		
	var slideProperties = {
			height : ['paddingTop','paddingBottom','marginTop','marginBottom'],
			width : ['paddingLeft','paddingRight','marginLeft','marginRight']
	};
	
	function noEffect(effect) { return !effect || effect.indexOf("slide") != 0 && effect != "fade"; }
	
	/**
	 * Masque la collection.
	 * @param effect 'fade','slide' (ou 'slideY'),'slideX','none' ('none' par défaut)
	 * @param callback fonction de rappel à exécuter une fois l'effet terminé
	 * @param options optionnel, objet décrivant les options de l'animation
	 * @returns {JSYG}
	 */
	JSYG.prototype.hide = function(effect,callback,options) {
		
		if (noEffect(effect)) {
			
			this.each(function() {
				
				var display = this.css("display");
				
				if (!display || display!="none") {
					this.css("display","none");
					display && this.originalDisplay(display);
				}
				
				callback && callback.call(this);
				
			},true);
			
			return this;
		}
		
		var isSlide = effect.indexOf("slide") == 0,
			slideProp = null;
		
		if (isSlide) slideProp = (effect == "slideX") ? "width" : "height";
				
		options = Object.create(options || null);
		options.to = {};
		
		options.onstart = function() {
			
			var jNode = new JSYG(this),
				display = jNode.css("display"),
				queue = (display == 'none') && jNode.data("AnimationQueue"),
				anim = queue && queue.current(),
				prop = slideProp && jNode.innerDim()[slideProp];
			
			if (effect == "fade") jNode.data('backupHide',{opacity:jNode.css('opacity')});
			else jNode.styleSave("hide");
			
			if (display == 'none') {
				anim.currentTime(anim.duration);
				return;
			}
			
			jNode.originalDisplay(display);
									
			if (isSlide && jNode.getType() == 'html') {
				
				jNode.css("overflow","hidden").css(slideProp,prop);
			}
		};
		
		options.onend = function() {
			
			var jNode = new JSYG(this),
				backup = jNode.data('backupHide');
							
			if (backup) jNode.css(backup);
			
			jNode.styleRestore("hide");
						
			jNode.css('display','none');
			
			callback && callback.call(this);
		};
		
		if (isSlide) {
		
			if (!options.easing) options.easing = "swing";
			slideProperties[slideProp].forEach(function(prop) { options.to[prop] = 0; });
			options.to[slideProp] = 0;
		}
		else options.to.opacity = 0;
			
		this.animate(options);
		
		return this;
		
	};
	
	
	JSYG.prototype.originalDisplay = function(_value) {
		
		var prop = "originalDisplay";
		
		if (_value == null) return this.data(prop) || defaultDisplay(this);
		else { this.data(prop,_value); return this; }
	};
	
	/**
	 * Affiche la collection.
	 * @param effect 'fade','slide' (ou 'slideY'),'slideX','none' ('none' par défaut)
	 * @param callback fonction de rappel a exécuter une fois l'effet terminé
	 * @param options optionnel, objet décrivant les options de l'animation
	 * @returns {JSYG}
	 */
	JSYG.prototype.show = function(effect,callback,options) {	
		
		if (noEffect(effect)) {
			
			this.each(function() {
				var display = this.css("display");
				if (!display || display == "none") this.css('display', this.originalDisplay() );
				callback && callback.call(this);
			},true);
			
			return this;
		}
								
		this.each(function() {
			
			var jNode = this,
				opt = Object.create(options || null),
				slideProp;
			
			opt.to = {};
			
			opt.onend = function() {
				
				jNode.styleRestore("show");
				jNode.css('display',jNode.originalDisplay());
				
				callback && callback.call(this);
			};
					
			switch (effect) {
				
				case "slide" : case "slideY" : case "slideX" :
					
					slideProp = (effect == "slideX") ? "width" : "height";
					
					if (!opt.easing) opt.easing = "swing";
					
					opt.onstart = function() {
						
						var queue = jNode.data("AnimationQueue"),
							anim = queue.current();
						
						jNode.styleSave("show");
												
						//si déjà affiché pas d'action
						if (jNode.css('display') != 'none') {
							anim.currentTime(anim.duration);
							return;
						}
												
						var to = {};
						
						to[slideProp] = jNode.innerDim()[slideProp];
																
						slideProperties[slideProp].forEach(function(prop) { to[prop] = jNode.cssNum(prop) || 0; });
						
						jNode.css({
							"overflow":"hidden",
							"display":jNode.originalDisplay()
						});
						
						jNode.css(slideProp,0);
						
						slideProperties[slideProp].forEach(function(prop) { jNode.css(prop,0); });
												
						anim.to = to;
					};
										
					break;
					
				case "fade" :
																				
					opt.onstart =  function() {
						
						var queue = jNode.data("AnimationQueue"),
							anim = queue.current();
						
						opt.to.opacity = jNode.css('opacity');
						
						//si déjà affich� pas d'action
						if (jNode.css('display') != 'none') {
							anim.currentTime(anim.duration);
							return;
						}
																		
						jNode.css({"display":jNode.originalDisplay(),opacity:0});
					};
										
					break;
			}
						
			this.animate(opt);
			
		}, true);
		
		return this;
		
	};
	
	/**
	 * Affiche ou masque la collection.
	 * @param effect 'fade','slide' (ou 'slideY'),'slideX','none' ('none' par défaut)
	 * @param callback fonction de rappel a exécuter une fois l'effet terminé
	 * @param options optionnel, objet décrivant les options de l'animation
	 * @returns {JSYG}
	 */
	JSYG.prototype.toggle = function(effect,callback,options) {
		
		this.each(function() {
			var method = (this.css('display') == 'none') ? "show" : "hide"; 
			this[method](effect,callback,options);
		},true);
		
		return this;
	};
	
	//IE clone les écouteurs d'évènements quand il clone un objet
	JSYG.support.cloneEvent = (function() {
		
		var support = true,
			node = document.createElement('span');
		
		if (!node.addEventListener && node.attachEvent && node.fireEvent) {
			node.attachEvent("onclick", function() { support = false;});
			node.cloneNode(true).fireEvent( "onclick" );
		}
		
		return support;
		
	}());
		
			
	//IE déclenche l'évènement input même si on change la valeur d'un champ en javascript
	JSYG.support.inputAutoFireEvent = (function() {
		
		var change = false,
			input = new JSYG('<input>')
				.attr('type','text')
				.on('input',function() { change = true; })
				.appendTo(node);
		
		input[0].value = 'toto';
		
		return change;
		
	}());
	
	
}(this.jQuery || this.JSYG));