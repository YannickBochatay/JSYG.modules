JSYG.require("Animation","StdConstruct",function() {
	
	"use strict";
	
	/**
	 * Gestion d'une file d'animations
	 * @returns {JSYG.AnimationQueue}
	 */
	JSYG.AnimationQueue = function() {
		
		/**
		 * file des animations
		 */
		this.list = [];
		
	};
	
	JSYG.AnimationQueue.prototype = {
			
		constructor : JSYG.AnimationQueue,
		
		/**
		 * indice de l'animation en cours
		 */
		ind : -1,
		
		/**
		 * définit si la file s'exécute en boucle ou non
		 */
		loop : false,
		/**
		 * Fonctions à exécuter au lancement de la file
		 */
		onstart : null,
		/**
		 * Fonctions à exécuter à la fin de l'exécution de la file
		 */
		onend : null,
		/**
		 * Fonctions a exécuter pendant l'exécution de la file
		 */
		onanimate : null,
		/**
		 * Fonctions à exécuter quand on lance la file (quelle que soit la position)
		 */
		onplay : null,
		/**
		 * Fonctions à exécuter quand on suspend la file (quelle que soit la position)
		 */
		onpause : null,
		/**
		 * Fonctions à exécuter quand on arr�te la file.
		 */
		onstop : null,
		
		/**
		 * définition d'un écouteur d'évènement
		 * @param evt
		 * @param fct
		 * @returns {JSYG.AnimationQueue}
		 * @see {JSYG.StdConstruct}
		 */
		on : function(evt,fct) { JSYG.StdConstruct.prototype.on.call(this,evt,fct); return this;},
		/**
		 * 
		 * @param evt
		 * @param fct
		 * @returns {JSYG.AnimationQueue}
		 * @see {JSYG.StdConstruct}
		 */
		off : function(evt,fct) { JSYG.StdConstruct.prototype.off.call(this,evt,fct); return this;},
		
		trigger : JSYG.StdConstruct.prototype.trigger,
		
		set : JSYG.StdConstruct.prototype.set,
		
		/**
		 * R�initialisation de la file et des options
		 */
		reset : function() {
			JSYG.StdConstruct.prototype.reset.call(this);
			this.list = [];
		},
		
		/**
		 * stoppe l'animation en cours (dans l'�tat courant) et r�initialise la file et les options
		 */
		clear : function() {
			this.pause();
			this.reset();
		},
		
		/**
		 * Renvoie l'objet animation en cours
		 * @returns {JSYG.Animation}
		 */
		current : function() { return this.list[this.ind]; },
		
		/**
		 * Passe à l'animation pr�c�dente
		 * @returns {JSYG.AnimationQueue}
		 */
		prev : function() {
			
			var current = this.current();
			current && current._currentTime > 0 && current.currentTime(0);
			
			if (this.ind === 0) {
				if (this.loop === false) return false;
				else {
					while (this.ind < this.list.length-1) this.next();
					current = this.list[this.list.length-1];
					current.currentTime( Animation._getDuration(current.duration) );
					return this;
				}
			}
			else this.ind--;
			
			current = this.current();
			current._currentTime = getDuration(current.duration);
			
			return this;
		},
		
		/**
		 * Passe à l'animation suivante
		 * @returns {JSYG.AnimationQueue}
		 */
		next : function() {
			
			var current = this.current(),
				duration = current && getDuration(current.duration);
			
			if (current && current._currentTime < duration) current.currentTime(duration);

			if (this.ind === this.list.length-1) {
				if (this.loop === false) return false;
				else {
					while (this.ind > 0) this.prev();
					this.list[0].currentTime(0);
					return this;
				}
			}
			else this.ind++;
			
			current = this.current();
			if (current) current._currentTime = 0;
									
			return this;
		},
		
		/**
		 * Renvoie true si l'animation est en cours
		 * @returns {Boolean}
		 */
		inProgress : function() {
			var current = this.current();
			return !!(current && current.inProgress);
		},
		
		/**
		 * Joue la file d'animations (l� ou elle en est)
		 * @returns {JSYG.AnimationQueue}
		 */
		play : function() {
			
			if (this.ind === -1) throw new Error("Aucune animation n'a été définie.");
						
			var current = this.current();
			
			if (current) {
				
				if (current.inProgress) return this;
			
				if (current._currentTime === 0 && this.ind === 0 && this._way === 1 ||
					current._currentTime === getDuration(current.duration) && this.ind === this.list.length-1 && this._way === -1
				) this.trigger('start');
				
				this.trigger('play');
				
				current.play();
			}
						
			return this;
		},
		
		/**
		 * Fige l'animation en cours
		 * @returns {JSYG.AnimationQueue}
		 */
		pause : function() {
			
			var current = this.current();
			if (current && !current.inProgress) return this;
			this.trigger('pause');
			current && current.pause();
			return this;
		},
		
		/**
		* Joue ou suspend l'animation.
		* @returns {JSYG.AnimationQueue}
		*/
		toggle : function() {
			if (this.inProgress()) this.pause();
			else this.play();
			return this;
		},
		
		/**
		 * Stoppe l'animation et revient à l'�tat initial de la file
		 * @returns {JSYG.AnimationQueue}
		 */
		stop : function() {
			
			var current;
			current = this.current();
			
			if (this.ind === 0 && current._currentTime == 0) return this;
			
			current && current.stop();
			
			while (this.ind > 0) this.prev();
			
			current = this.current();
			current && current.currentTime(0);
			
			//on purge les �tats de départ au cas où l'élément est modifi� entre 2 lancements d'animation.
			this.list.forEach(function(anim) { anim.from = null; });
			
			this.trigger('stop');
			
			return this;
		},	
		
		/**
		* récupère ou fixe la position dans le temps
		* @param ms optionnel, si défini fixe la position
		* @returns {JSYG.AnimationQueue,Number} position (en millisecondes) ou objet lui-même.
		*/
		currentTime : function(ms) {
			
			var i,currentTime,current,duration;
			
			if (ms == null) {
				ms=0;
				for (i=0;i<this.ind;i++) ms+= getDuration(this.list[i].duration);
				ms+= this.current()._currentTime;
				return ms;
			}
			else {
			
				currentTime = this.currentTime();
				ms = setCurrentTime( currentTime, ms );
				ms = JSYG.clip(ms,0,this.duration());
				
				if (currentTime == ms) return this;
				
				//RAZ par simplicité
				while (this.ind > 0) this.prev();
				
				current = this.current();
				current && current.currentTime(0);
				
				duration = getDuration(current.duration);
				
				while (ms > duration && this.next()) {
					ms-= duration;
					current = this.current();
					duration = getDuration(current.duration);
				}
				
				current.currentTime(ms);
				
				return this;
			}
		},
		
		/**
		* Renvoie la dur�e totale en millisecondes de la file.
		*/
		duration : function() {
			var ms=0;
			for (var i=0,N=this.list.length;i<N;i++) ms+= getDuration(this.list[i].duration);
			return ms;
		},
		
		_way : 1,
		/**
		 * définit ou récupère le sens d'exécution de la file et des animations
		 * @param val optionnel, si défini fixe le sens de l'animation (1 sens normal, -1 sens inverse). La valeur sp�ciale "toogle" permet
		 * d'inverser la valeur.
		 * @returns {Number,JSYG.AnimationQueue} le sens de l'animation si val est indéfini, l'objet lui-même sinon.
		 */
		way : function(val) {
			
			var inProgress;
			
			if (val == null) return this._way;
			else {
				
				if (val == 'toggle') val = this._way * -1;
				
				if (val !== 1 && val !== -1) throw new Error("la valeur de 'way' doit être 1 ou -1");
				
				inProgress = this.inProgress();
				inProgress && this.pause();
				
				this._way = val;
				this.list.forEach(function(anim) { anim.way = val; });
				
				inProgress && this.play();
								
				return this;
			}
		},
		
		/**
		 * Insert une animation à la file
		 * @param animation instance de JSYG.Animation
		 * @param ind optionnel, indice où insérer l'animation
		 * @returns {JSYG.AnimationQueue}
		 */
		add : function(animation,ind) {
			
			if(!(animation instanceof JSYG.Animation)) throw new Error("Argument incorrect pour la méthode JSYG.AnimationQueue.add : "+animation);
			if (this.list.indexOf(animation) !== -1) throw new Error("l'animation est déjà dans la liste.");
			
			var that = this;
			
			animation.queueFunctions = {
				end : function() {
					if ((that._way === 1 && that.next()) || (that._way===-1 && that.prev())) {
						that.current().play();
					}
					else that.trigger('end');
				},				
				animate : function() {
					that.trigger('animate');
				}
			};
			
			animation.on(animation.queueFunctions);
			
			if (ind == null) ind = this.list.length;
			this.list.splice(ind,0,animation);
			
			if (this.ind == -1) this.ind = 0;
			
			return this;
		},
		
		/**
		 * Suppression d'une animation de la file
		 * @param {Number} ind indice de l'animation (ou objet JSYG.Animation)
		 * @returns {JSYG.AnimationQueue}
		 */
		remove : function(ind) {
			
			if (ind instanceof JSYG.Animation) ind = this.list.indexOf(ind);
			
			var animation = this.list[ind];
			animation.off(animation.queueFunctions);
			
			this.list.splice(ind,1);
			
			if (this.list.length === 0) this.ind = -1;
			
			return this;
		}
	};
	
}();