(function(JSYG) {
	
	"use strict";
				
	var slice = Array.prototype.slice;
	/**
	 * Constructeur standard définissant une liste de fonctions utiles pour les plugins ou constructeurs
	 * @returns {JSYG.StdConstruct}
	 */
	JSYG.StdConstruct = function() { };
	
	JSYG.StdConstruct.prototype = {
	
		constructor : JSYG.StdConstruct,
		/**
		 * Permet de définir les propriétés de l'objet et des sous-objets de manière récursive, sans écraser les objets existants
		 * (seules les propriétés précisées sont mises à jour)
		 * @param opt objet contenant les propriétés à modifier
		 * @param _cible en interne seulement pour appel récursif
		 * @returns {JSYG.StdConstruct}
		 */
		set : function(opt,_cible) {
			
			var cible = _cible || this;
			
			if (!JSYG.isPlainObject(opt)) return cible;
									
			for (var n in opt) {
				if (n in cible) {
					if (JSYG.isPlainObject(opt[n]) && cible[n]) this.set(opt[n],cible[n]);
					else if (opt[n] !== undefined) cible[n] = opt[n];
				}
			}
			
			return cible;
		},
		
		/**
		 * Réinitialisation de toutes les propriétés du plugin
		 * @returns {JSYG.StdConstruct}
		 */
		reset : function() {
						
			var ref = Object.getPrototypeOf ? Object.getPrototypeOf(this) : this.__proto__ ? this.__proto__ : this.constructor.prototype; 
			
			for (var n in ref) {
				if (typeof ref[n] !== 'function') this[n] = ref[n];
			}
				
			return this;
		},

		/**
		 * Ajout d'un écouteur d'évènement.<br/>
		 * Cela permet d'ajouter plusieurs fonctions, elles seront conservées dans un tableau.<br/>
		 * Les doublons sont ignorés (même évènement même fonction).<br/>
		 * On peut passer en argument un objet avec les évènements en clés et les fonctions en valeur.<br/>
		 * Par défaut, le mot cl� this fait référence au noeud DOM sur lequel s'applique le plugin.
		 * @param events type(s) d'évènement (propre à chaque module, 'click', 'start', 'end', etc) séparés par des espaces.
		 * @param fct fonction à exécuter lors du déclenchement de l'évènement
		 * @returns {JSYG.StdConstruct}
		 * @see JSYG.StdConstruct.off
		 */
		on : function(events,fct) {
			
			var p,i,N,n=null;
					
			if (JSYG.isPlainObject(events) && fct==null) {
				for (n in events) this.on(n,events[n]);
				return this;
			}
			
			if (typeof fct!== 'function') return this;
			
			events = events.split(/\s+/);
						
			for (i=0,N=events.length;i<N;i++) {
				
				p = this['on'+events[i]];
				
				if (p===undefined) throw events[i]+" n'est pas un évènement connu";
				else if (p === false || p === null) p = [fct];
				else if (typeof p == "function") { if (p!==fct) p = [p,fct]; }
				else if (Array.isArray(p)) { if (p.indexOf(fct)===-1)  p.push(fct); }
				else throw new TypeError(typeof p + "Type incorrect pour la propriété on"+events[i]);
				
				this['on'+events[i]] = p;
			}
			
			return this;
		},
		
		/**
		 * Suppression d'un écouteur d'évènement (Event Listener) de la liste.<br/>
		 * On peut passer en argument un objet avec les évènements en clés et les fonctions en valeur.
		 * @param events type(s) d'évènement (propre à chaque module, 'click', 'start', 'end', etc) séparés par des espaces.
		 * @param fct fonction à supprimer
		 * @returns {JSYG.StdConstruct}
		 * @see JSYG.StdConstruct.on
		 */
		off : function(events,fct) {
			
			var p,i,N,n=null;
			
			if (JSYG.isPlainObject(events) && fct == null) {
				for (n in events) this.off(n,events[n]);
				return this;
			}
			
			if (typeof fct!== 'function') return this;
			
			events = events.split(/\s+/);
						
			for (i=0,N=events.length;i<N;i++) {
				
				p = this['on'+events[i]];
				
				if (p===undefined) throw new Error(event+" n'est pas un évènement connu");
				else if ((typeof p == "function") && p === fct) p = null;
				else if (Array.isArray(p)) p.splice(p.indexOf(fct),1);
				else if (p!==null) throw new TypeError(typeof p + "Type incorrect pour la propriété on"+events[i]);
			}
			
			return this;
		},
		
		/**
		 * Execution d'un évènement donn�
		 * @param event nom de l'évènement
		 * @param context optionnel, objet référencé par le mot clef "this" dans la fonction
		 * Les arguments suivants sont les arguments passés à la fonction (nombre non défini)
		 * @returns {JSYG.StdConstruct}
		 */
		trigger : function(event,context) {
			
			context = context || this.node || null;
			
			var p = this['on'+event],
				returnValue = true,
				i,N;
			
			if (p===undefined) throw new Error(event+" n'est pas un évènement connu");
			else if (p instanceof Function) returnValue = p.apply(context,slice.call(arguments,2));
			else if (Array.isArray(p)) {
				for (i=0,N=p.length;i<N;i++) {
					if (p[i].apply(context,slice.call(arguments,2)) === false) returnValue = false;
				}
			} 
			else if (p!==null && p!==false) throw new TypeError(typeof p + "Type incorrect pour la propriété on"+event);
			
			return returnValue;
		}
	};
		
	return JSYG.StdConstruct;
});