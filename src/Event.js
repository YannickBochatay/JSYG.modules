(function(JSYG) {
	
	"use strict";
	
	var windowLoaded = false;
	
	var propListeners = 'JSYGListeners';
	
	//test� sur un clavier fran�ais uniquement
	/**
	 * Liste des touches non alphanum�riques d'un clavier fran�ais
	 */
	
	
	/**
	 * Constructeur d'objets JSYG.Event, qui est l'objet passé par défaut aux écouteurs d'évènements (objet Event customis�).
	 * Il permet de mettre à niveau IE, et d'ajouter quelques propriétés :
	 * <ul>
	 * 		<li><strong>buttonName</strong>: nom du bouton enclench� ('left' ou 'right')</li>
	 * 		<li><strong>keyName</strong>: nom de la touche clavier enclench�e (voir la liste JSYG.nonAlphaNumKeys pour les caract�res non alphanum�riques)</li>
	 *		<li>wheelDelta (molette de la souris, propriété impl�ment�e dans IE,Chrome mais non standard)</li>
	 * </ul>
	 * @param e objet Event original
	 * @returns {JSYG.Event}
	 */
	JSYG.Event = function(e) {
		
		if (e instanceof JSYG.Event) e = e.evt;
		else if (!e) e = {};
		
		/**
		 * Objet Event original
		 */
		this.evt = e;
		
		/**
		 * abcisse du pointeur dans la fenêtre
		 */
		this.clientX = e.clientX;
		/**
		 * ordonnée du pointeur dans la fenêtre
		 */
		this.clientY = e.clientY;
		/**
		 * Type d'évènement
		 */
		this.type = e.type;
		/**
		 * D�tails sur le clic
		 */
		this.detail = e.detail;
		/**
		* molette de la souris
		*/
		this.wheelDelta = (e.wheelDelta === undefined && e.detail) ? -e.detail * 40 : e.wheelDelta;
		/**
		 * Nom du bouton souris enclench� (left ou right)
		 */
		this.buttonName = (e.button === 2) ? 'right' : 'left';
		/**
		 * Cible associ�e à l'évènement
		 */
		this.relatedTarget = e.relatedTarget || e.toElement;
		/**
		 * Cible de l'évènement
		 */
		this.target = e.target || e.srcElement || document;
		
		/**
		 * en SVG avec Chrome et IE, avec les éléments use
		 */
		if (!this.target.parentNode && this.target.correspondingUseElement) this.target = e.target.correspondingUseElement;
		/**
		 * données transf�r�es par l'évènement (lors des drag&drop notamment)
		 */
		this.dataTransfer = e.dataTransfer;
		
		var elmt = document.documentElement,
			body = document.body;
		
		/**
		 * abcisse du pointeur dans le document (clientX+scrollLeft)
		 */
		this.pageX = e.pageX != null ? e.pageX : e.clientX + (elmt && elmt.scrollLeft || body && body.scrollLeft || 0) - (elmt.clientLeft || 0);
		
		/**
		 * ordonnée du pointeur dans le document (clientY+scrollTop)
		 */
		this.pageY = e.pageY != null ? e.pageY : e.clientY + (elmt && elmt.scrollTop || body && body.scrollTop || 0) - (elmt.clientTop || 0);
		
		if (/key(up|down)/i.test(e.type)) {
			/**
			 * Nom de la touche clavier enclench�e
			 */
			this.keyName = JSYG.nonAlphaNumKeys[e.keyCode]!== undefined ? JSYG.nonAlphaNumKeys[e.keyCode] : String.fromCharCode(e.charCode || e.keyCode).toLowerCase();
		} else if (e.type === 'keypress') {
			this.keyName = (e.charCode !== 0) ? String.fromCharCode(e.charCode || e.keyCode).toLowerCase() : null;
		} else {
			this.keyName = null;
		}
		
		this.keyCode = e.keyCode;
		
		/**
		 * Bool�en indiquant si la touche ctrl est enclench�e
		 */
		this.ctrlKey = (this.keyName == "ctrl") ? true : e.ctrlKey; //pb avec chrome sur keydown
				
		/**
		 * Bool�en indiquant si la touche alt est enclench�e
		 */
		this.altKey = (this.keyName == "alt") ? true : e.altKey; //pb avec chrome sur keydown
		/**
		 * Bool�en indiquant si la touche shift est enclench�e
		 */
		this.shiftKey = (this.keyName == "shift") ? true : e.shiftKey; //pb avec chrome sur keydown
		/**
		 * Bool�en indiquant si la touche meta est enclench�e (mac)
		 */
		this.metaKey = (this.keyName == "meta") ? true : e.metaKey;
	};
	
	JSYG.Event.prototype = {
			
		constructor : JSYG.Event, 
		
		/**
		 * Annule l'action par défaut
		 */
		preventDefault : function() {
			this.evt.preventDefault && this.evt.preventDefault();
			if (window.event) window.event.returnValue = false;
		},
		
		/**
		 * Stoppe la propagation de l'évènement
		 */
		stopPropagation : function() {
			this.evt.stopPropagation && this.evt.stopPropagation();
			if (window.event) window.event.cancelBubble = true;
		}
	};
	
	/**
	 * Renvoie true si aucune touche n'est définie ni d�clench�e, ou si une touche est définie et elle et elle seule est enclench�e 
	 */
	function checkStrictKey(e,key) {
		
		var shortcutKeys = ['shift','ctrl','alt','meta'],
			prop,i,N=shortcutKeys.length;
		
		for (i=0;i<N;i++) {
			prop = shortcutKeys[i];
			if ((key && prop == key && !e[prop+'Key']) || (!key && e[prop+'Key']) ) return false;
		}
		
		return true;
	}

	/**
	 * Cr�e une fonction qui permet d'executer la fonction fct sur les évènements mouseup ou click seulement si la souris
	 * n'a pas boug� pendant que le bouton �tait enclench�.
	 * Un bouton et une touche sp�ciale (ctrl,alt,shift,meta) peuvent être spécifiés �galement.
	 */
	function createStrictClickFunction(node,evt,selector,fct,button,key,direct,uniqueCallback) {
		
		return function(e) {
			
			if (selector) {
				e = new JSYG.Event(e);
				if (querySelectorAll(selector,node).indexOf(e.target) === -1) return;
			}
			
			if (direct && e.target != node) return;
			
			var jNode = new JSYG( selector ? e.target : node),
			
				posInit = {x:e.clientX,y:e.clientY},
											
				off = function() { jNode.off('mouseout',off).off(evt,release); },
			
				release = function(e) {
			
					off();
					
					var pos = {x:e.clientX,y:e.clientY};
									
					if (JSYG.distance(posInit,pos) > jNode.dragTolerance()) return;
										
					e = new JSYG.Event(e);
					
					if (!checkStrictKey(e,key)) return;
					if (button && e.buttonName !== button) return;
					
					fct.call(selector ? e.target : node,e);
				};
		
			jNode.on('mouseout',off).on(evt,release);
			
			uniqueCallback && uniqueCallback();
		};
	}
	
	/**
	 * Cr�e une fonction qui execute fct seulement si la combinaison touche et bouton est respect�e
	 */
	function createCustomFunction(node,evt,selector,fct,button,key,strict,direct,uniqueCallback) {
								
		return function(e) {
			
			e = new JSYG.Event(e);
			
			if (selector && querySelectorAll(selector,node).indexOf(e.target) === -1) return;
			else if (direct && e.target != node) return;
			else if (strict && !checkStrictKey(e,key)) return;
			else if (key && !e[key+'Key']) return;
			//else if (evt !== 'contextmenu' && button && e.buttonName !== button) return;
			else if (button && e.buttonName !== button) return;
						
			fct.call( selector ? e.target : node,e);
			
			uniqueCallback && uniqueCallback(); //pour retirer l'écouteur aussitôt executé
		};
	}
	
	var dragPrefixe = "_drag";
	/**
	 * création artificielle des évènements dragstart,drag et dragend
	 */
	function createFakeDragFunction(node,evt,fct) {
				
		return function(e) {
			
			e = new JSYG.Event(e);
			
			var jNode = new JSYG(node),
			
				hasMoved = false,
			
				posInit = {x:e.clientX,y:e.clientY},
						
				fcts = {
					
					mousemove : function(e) {
						
						if (hasMoved === false) {
							
							var pos = {x:e.clientX,y:e.clientY};
							
							if (JSYG.distance(posInit,pos) > jNode.dragTolerance()) {
								evt == dragPrefixe+'start' && fct.call(this,e);
								hasMoved = true;
							}
						}
						else { evt == dragPrefixe && fct.call(this,e); }
					},
				
					mouseup : function(e) {
						hasMoved === true && evt == dragPrefixe+'end' && fct.call(this,e);
						jNode.off(fcts);
					},
					
					mouseout : function(e) { jNode.off(fcts); } 
				};
			
			e.preventDefault();
			
			jNode.on(fcts);
		};
	}
		
	/**
	 * Solution de contournement pour l'évènement DOMContentLoaded sur IE (Diego Perini)
	 *
	 * Author: Diego Perini (diego.perini at gmail.com) NWBOX S.r.l.
	 * Summary: DOMContentLoaded emulation for IE browsers
	 * Updated: 05/10/2007
	 * License: GPL
	 * Version: TBD
	 *
	 * Copyright (C) 2007 Diego Perini & NWBOX S.r.l.
	 */
	function IEDOMContentLoaded(fct) {
		
		var done = false,
			init = function () {
				if (!done) { done = true; fct();}
			};

		(function fonct() {
			try { document.documentElement.doScroll('left');}
			catch (e) { window.setTimeout(fonct, 50); return; }
			init();
		})();
		
		document.onreadystatechange = function() {
			if (document.readyState == 'complete') { document.onreadystatechange = null; init(); }
		};
	}
	
	
	var rSearches = {
		button : /(left|right)-/,
		key : /(alt|ctrl|shift|meta)-/,
		strict : /strict-/,
		direct : /direct-/,
		unique : /unique-/,
		all : /(left|right|ctrl|alt|shift|meta|strict|unique|direct)-/g
	};
	
	
	var windowLoaded = false;
	/**
	 * Ajout d'un écouteur d'évènement sur la collection. Compatible IE6+<br/><br/>
	 * On peut �galement passer en argument un objet avec en cl�s les noms des évènements et en valeurs les fonctions.<br/><br/>
	 * Par cette méthode :
	 * <ul>
	 * 	<li>dans la fonction le mot cl� this fait référence à l'élément DOM</li>
	 * 	<li>Les évènements doubl�s sont ignor�s (même déclencheur, même fonction)</li>
	 * 	<li>l'objet Event est une instance de JSYG.Event et dispose, en plus des propriétés standards, les propriétés suivantes :
	 * 		<ul>
	 *			<li>buttonName ("left" ou "right")</li>
	 * 			<li>keyName (nom de la touche clavier enfonc�e, voir JSYG.nonAlphaNumKeys pour les touches non alphanum�riques)</li>
	 *			<li>wheelDelta (molette de la souris, propriété impl�ment�e dans IE,Chrome mais non standard)</li>
	 * 		</ul>
	 * 	</li>
	 * </ul>
	 * @param evt nom du ou des évènements du DOM ('mousedown','keypress',etc) séparés par des espaces.
	 * On peut ajouter les pr�cisions suivantes aux évènements, séparées par un tiret :
	 * 	<ul>
	 * 		<li>"left" ou "right" : seulement sur un bouton sp�cifique.</li>
	 * 		<li>"ctrl","alt","shift" : seulement si la touche spécifiée est enclench�e.</li>
	 * 		<li>"strict" :
	 * 			<ul>
	 * 				<li>Si une touche est spécifiée, ne se déclenche que si cette touche et uniquement celle-ci est enclench�e.</li>
	 * 				<li>Si aucune touche n'est spécifiée, ne se déclenche que si aucune touche n'est enclench�e.</li>
	 *  			<li>Sur les évènements "mouseup" et "click", ne se déclenche que si la souris n'a pas boug� pendant le clic.
	 *  				Une tol�rance peut être définie par la méthode JSYG.prototype.dragTolerance.
	 *  			</li>
	 *  		</ul>
	 * 		</li>
	 * 		<li>unique : l'écouteur sera détaché aussitôt la fonction exécutée.</li>
	 * 		<li>direct : seulement si l'élément est la cible directe (et non par propagation ou bouillonnement).</li>
	 * 	</ul>
	 * </li>
	 * @param selector optionnel (si non défini, <code>fct</code> devient le deuxi�me argument),
		selecteur css pour d�l�gation d'évènement. L'écouteur d'évènement est attach� à la collection mais
		la fonction s'exécute seulement si la cible r�pond aux crit�res de ce sélecteur.
		Dans <code>fct</code>, le mot cl� this fait alors référence à la cible et non à l'élément de la collection initiale.
	 * @param fct fonction à exécuter lors du déclenchement de l'évènement.
	 * @returns {JSYG}
	 * @example <pre>new JSYG("#maDiv").on("click",function() { alert("toto"); });
	 * 
	 * new JSYG("#maDiv").on({
	 * 	"mouseover" : function() { alert("bonjour"); },
	 * 	"mouseout" : function() { alert("au revoir"); }
	 * });
	 * 
	 * new JSYG("#maDiv").on("mouseover click",function(e) { e.preventDefault(); });
	 * 
	 * //D�l�gation d'évènements
	 * new JSYG(document.body).on("click",'.cliquable',function() {
	 * 	alert('ceci est un élément cliquable');
	 * });
	 * //équivalent à 
	 * new JSYG(document.body).on({
	 *   click : function() { alert('ceci est un élément cliquable'); }
	 *  },'.cliquable');
	 * 
	 * new JSYG("#maDiv").on("strict-left-ctrl-click",function(e) {
	 * 	alert("clic gauche, touche ctrl enfonc�e et la souris n'a pas boug�");
	 * });
	 * 
	 * new JSYG("#maDiv").on("unique-click",function(e) {
	 * 	alert("Ceci est un message qui ne s'affichera qu'une seule fois");
	 * });
	 * 
	 */
	JSYG.prototype.on = function(evt,selector,fct) {
				
		if (typeof(evt) === 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in evt) {
				if (evt.hasOwnProperty(n)) this.on(n,selector,evt[n]);
			}
			return this;
		}
		
		if (typeof selector == 'function') { fct = selector; selector = null; }
		
		if (!fct) return this;
		
		var evts = evt.split(/ +/);
		
		this.each(function() {
			
			var that = this,
				evtAttached,
				fctAttached,
				search,button,key,strict,direct,unique,
				i,j,N,M,
				ls = this.data(propListeners);
			
			if (!ls) { ls = []; this.data(propListeners,ls); }
			
			boucle :
			
			for (i=0,N=evts.length;i<N;i++) {
				
				evt = evts[i];
				
				//s'il s'agit de l'évènement window.load et que la page est déjà chargée, on exécute aussitôt
				if (evt == 'load' && this[0] === window && windowLoaded) return fct.call(window);
								
				if (evt.indexOf('-') !== -1) {
					
					search = rSearches.button.exec(evt);
					button = search && search[1] || null;
					
					search = rSearches.key.exec(evt);
					key = search && search[1] || null;
					
					strict = rSearches.strict.test(evt);			
					direct = rSearches.direct.test(evt);
					unique = rSearches.unique.test(evt);
										
					evtAttached = evt.replace(rSearches.all,'');
					
					if (unique) { unique = function(evt) { that.off(evt,selector,fct); }.bind(null,evt); }
										
					if (strict && (evtAttached == 'mouseup' || evtAttached == "click")) {
						
						fctAttached = createStrictClickFunction(this[0],evtAttached,selector,fct,button,key,direct,unique);
						evtAttached = 'mousedown';
					}
					else {
						
						fctAttached = createCustomFunction(this[0],evtAttached,selector,fct,button,key,strict,direct,unique);
					}
				}
				else {
					
					fctAttached = function(e) {
						e = new JSYG.Event(e);
						if (selector && querySelectorAll(selector,that[0]).indexOf(e.target) === -1) return;
						fct.call(selector ? e.target : that[0],e);
					};
					evtAttached = evt;
				}
				
				if (evtAttached.indexOf(dragPrefixe) === 0) {
					fctAttached = createFakeDragFunction(this[0],evtAttached,fctAttached);
					evtAttached = 'mousedown';
				}
				
				for (j=0,M=ls.length;j<M;j++) {
					//l'évènement est déjà enregistr�
					if (ls[j].evt === evt && ls[j].fct === fct && ls[j].selector === selector) continue boucle;
				}
												 
				if (this[0].addEventListener) {

					this[0].addEventListener(evtAttached,fctAttached,false);
													
					if (evt === 'mousewheel') this[0].addEventListener('DOMMouseScroll',fctAttached,false); //special pour FF
				}
				else if (this[0].attachEvent) {
					
					if (evt == 'DOMContentLoaded' && JSYG.isWindow(this[0])) {
						
						IEDOMContentLoaded(fct);
						continue;
					}
					else {
						
						if (evt == 'input') evtAttached = 'propertychange';
						
						this[0].attachEvent('on'+evtAttached,fctAttached);
					}
				}
				
				ls.push({
					evt:evt, evtAttached:evtAttached,
					fct:fct, fctAttached:fctAttached,
					selector:selector
				});
			}
						
		},true);
		
		return this;
	};
		
	/**
	 * Suppression d'un écouteur d'évènement sur la collection.<br/><br/>
	 * On peut �galement passer en argument un objet avec en cl�s les noms des évènements et en valeurs les fonctions.<br/><br/>
	 * @param evt chaîne, nom du ou des évènements ('mousedown','keypress',etc) séparés par des espaces.
	 * @param selector optionnel, chaîne, sélecteur css pour d�l�gation d'évènements.
	 * @param fct fonction à exécuter lors du déclenchement de l'évènement.
	 * @returns {JSYG}
	 * @see JSYG.prototype.on
	 */
	JSYG.prototype.off = function(evt,selector,fct) {
		
		if (typeof(evt) === 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in evt) {
				if (evt.hasOwnProperty(n)) this.off(n,selector,evt[n]);
			}
			return this;
		}
				
		if (typeof selector == 'function') { fct = selector; selector = null; }
		
		var evts = evt && evt.split(/ +/);
		
		this.each(function() {
		
			var node = this[0],
				i,N,j,M,
				ls = this.data(propListeners);
			
			if (!ls) { ls = []; this.data(propListeners,ls); }
			
			//pas d'argument, on efface tout
			if (fct == null) {
				
				var suppr = [];
				
				for (i=0,N=ls.length;i<N;i++) {
					if ((evt == null || evts.indexOf(ls[i].evt)!==-1) && (selector == null || ls[i].selector == selector)) { suppr.push(ls[i]); }
				}
				
				for (i=0,N=suppr.length;i<N;i++) { this.off(suppr[i].evt,selector,suppr[i].fct); }
				
				return this;
			}
			
			for (i=0,N=evts.length;i<N;i++) {
				
				evt = evts[i];
									
				for (j=0,M=ls.length;j<M;j++) {
					
					if (ls[j].evt === evt && ls[j].fct === fct && ls[j].selector == selector) {
						
						if (node.removeEventListener) {
							
							node.removeEventListener(ls[j].evtAttached,ls[j].fctAttached,false);
							
							if (evt === 'mousewheel') node.removeEventListener('DOMMouseScroll',ls[j].fctAttached,false); //FF
						}
						else node.detachEvent('on'+ls[j].evtAttached,ls[j].fctAttached);
						
						ls.splice(j,1);
						
						break;
					}
				}
			}
			
			return null;
			
		},true);
		
		return this;
	};
	
	/**
	 * même principe que la méthode JSYG.prototype.on mais la fonction n'est execut�e qu'une seule fois.
	 * @see JSYG.prototype.on
	 * @param evt
	 * @param fct
	 * @returns {JSYG}
	 
	JSYG.prototype.one = function(evt,selector,fct) {
		
		if (typeof(evt) === 'object') { //appel r�cursif si on passe un objet en paramêtre
			for (var n in evt) {
				if (evt.hasOwnProperty(n)) {this.one(n,selector,evt[n]); }
			}
			return this;
		}
		
		if (typeof selector == 'function') { fct = selector; selector = null; }
		
		var that = this;
		var evts = evt && evt.split(/ +/) || [];
				
		evts.forEach(function(evt) {
			var newfct = function(e) {
				fct.call(this,e);
				that.off(evt,selector,newfct);
			};
			that.on(evt,selector,newfct);
		});
		
		return this;
	};*/
	
	/**
	 * vérifie si les éléments de la collection contiennent un écouteur d'évènements pour la fonction spécifiée
	 * @param evt nom de l'évènement
	 * @param fct
	 * @returns {Boolean}
	 */
	JSYG.prototype.checkEvtListener = function(evt,fct) {
		
		var test = true;
		
		this.each(function() {
			
			var localtest = false;
			
			var ls = this.data(propListeners);
			if (!ls) { ls = []; this.data(propListeners,ls); }
				
			for (var i=0,N=ls.length;i<N;i++) {
				if (ls[i].evt === evt && ls[i].fct === fct) {
					localtest = true;
					break;
				}
			}
			
			if (!localtest) {
				test = false;
				return false;
			}
			
			return null;
			
		},true);
		
		return test;
	};
	
	/**
	 * déclenchement artificiel d'un évènement donn� sur la collection.
	 * Ne fonctionne (du moins pour le moment) qu'avec les évènements natifs (pas de 'strict-left-click' par exemple).
	 * @param type chaîne, évènement
	 * @returns {JSYG}
	 */
	JSYG.prototype.trigger = function(type) {
		
		if (this['on'+type] !== undefined) { //évènement customis�
			return JSYG.StdConstruct.prototype.trigger.apply(this,arguments);
		}
		
		this.each(function() {
		
			var evt;
			
			if (type == 'focus' || type == 'blur') {
				this[type]();
			}
			else if (document.createEvent) {
				evt = document.createEvent("HTMLEvents");
				evt.initEvent(type, false, true);
				this.dispatchEvent(evt);
			}
			else if (document.createEventObject) {
				
				evt = document.createEventObject();
				try {
					this.fireEvent('on'+type,evt);
				} catch (e) {}
			}
			
		});
		
		return this;
		
		/*
		
		e = e || {};
		
		if (type.match(/(mouse|click)/)) {
			
			evt = document.createEvent("MouseEvents");
			
			evt.initMouseEvent(
				type,					//the string to set the event's type to. Possible types for mouse events include: click, mousedown, mouseup, mouseover, mousemove, mouseout.
				true,					//whether or not the event can bubble. Sets the value of event.bubbles.
				true,					//whether or not the event's default action can be prevented. Sets the value of event.cancelable.
				window,					//the Event's AbstractView. You should pass the window object here. Sets the value of event.view.
				e.detail||0,			//the Event's mouse click count. Sets the value of event.detail.
				e.screenX||0,			//the Event's screen x coordinate. Sets the value of event.screenX.
				e.screenY||0,			//the Event's screen y coordinate. Sets the value of event.screenY.
				e.clientX||0,			//the Event's client x coordinate. Sets the value of event.clientX.
				e.clientY||0,			//the Event's client y coordinate. Sets the value of event.clientY.
				e.ctrlKey||false,		//whether or not control key was depressed during the Event. Sets the value of event.ctrlKey.
				e.altKey||false,		//whether or not alt key was depressed during the Event. Sets the value of event.altKey.
				e.shiftKey||false,		//whether or not shift key was depressed during the Event. Sets the value of event.shiftKey.
				e.metaKey || false,		//whether or not meta key was depressed during the Event. Sets the value of event.metaKey.
				e.button||0,			//the Event's mouse event.button.
				e.relatedTarget||null	//the Event's related EventTarget. Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
			);
		}
		else if (type.match(/key/)) {
			
			evt = document.createEvent("KeyboardEvent");
			
			if (evt.initKeyBoardEvent) { //W3C
				
				var arg = '';
				if (e.ctrlKey) { arg+='Control ';}
				if (e.altKey) { arg+='Alt ';}
				if (e.shiftKey) { arg+='Shift ';}
				if (e.metaKey) { arg+='Meta '; }
				
				arg = arg.replace('/ $/','');
				
				evt.initKeyBoardEvent(                                                                                      
					type,        					//  in DOMString typeArg,                                                           
					true,            				//  in boolean canBubbleArg,                                                        
					true,             				//  in boolean cancelableArg,                                                       
					null,             				//  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.
					e.key || null,					// The key identifier. This value is returned in the key property of the event.
					e.location || null,				// The location of the key on the device. This value is returned in the location property of the event. 
					arg								// A white space separated list of modifier key identifiers to be activated on this object.
				);
			}
			else if (evt.initKeyEvent) { //Firefox mais pas W3C
				
				evt.initKeyEvent(                                                                                      
					type,        					//  in DOMString typeArg,                                                           
					true,            				//  in boolean canBubbleArg,                                                        
					true,             				//  in boolean cancelableArg,                                                       
					null,             				//  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.     
					e.ctrlKey || false,            	//  in boolean ctrlKeyArg,                                                               
	                e.altKey || false,            	//  in boolean altKeyArg,                                                        
	                e.shiftKey || false,            //  in boolean shiftKeyArg,                                                      
	                e.metaKey || false,            	//  in boolean metaKeyArg,                                                       
	                e.keyCode || 9,               	//  in unsigned long keyCodeArg,                                                      
	                e.charCode || 0					//  in unsigned long charCodeArg);
				);
			} else { //sinon version d�grad�e : initKeyboardEvent 
				evt.initEvent(type, false, true);
			}
			
		}
		else {
		    
			evt = document.createEvent("HTMLEvents");
		    evt.initEvent(type, false, true);
		}

		
		if (!evt) { throw type+" n'est pas un évènement connu."; }
				
		this[0].dispatchEvent(evt);
				
		return this;
		*/
	};
	
	/**
	 * Renvoie ou définit le nombre de pixels d'un d�placement souris au del� duquel
			les évènements customis�s 'strict-click' et 'strict-mouseup' ne seront pas d�clench�s.
	 * @param px nombre de pixels
	 * @returns {Number,JSYG}
	 */
	JSYG.prototype.dragTolerance = function(px) {
		
		if (px == null) { return this.data('dragTolerance') || 0; }
		
		this.data('dragTolerance',px);
		return this;
	};
	
	/**
	 * Fonction qui stoppe la propagation des évènements
	 * <code>function(e) { e.stopPropagation(); }</code>
	 */
	JSYG.stopPropagation = function(e) { e.stopPropagation(); };
	
	/**
	 * Fonction qui annule le comportement par défaut
	 * <code>function(e) { preventDefault(); }</code>
	 */
	JSYG.preventDefault = function(e) { e.preventDefault(); };
	
	/**
	 * Stoppe la propagation de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.stopPropagation = function(evt) { return this.on(evt,JSYG.stopPropagation); };
	
	/**
	 * R�tablit la propagation de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.releasePropagation = function(evt) { return this.off(evt,JSYG.stopPropagation); };
	
	/**
	 * Annule l'action par défaut de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.preventDefault = function(evt) { return this.on(evt,JSYG.preventDefault); };
	
	/**
	 * R�tablit l'action par défaut de l'évènement donn�
	 * @param evt nom de l'évènement
	 */
	JSYG.prototype.releaseDefault = function(evt) { return this.off(evt,JSYG.preventDefault); };
	
	
	

	new JSYG(window).on('load',function() { windowLoaded = true; });
	
	
}(window.jQuery || window.JSYG));