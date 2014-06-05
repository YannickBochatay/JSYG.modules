//http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
(function() {
	
	"use strict";
	
	function clearSlashes(path) {
		return path.toString().replace(/\/$/, '').replace(/^\//, '');
	}
	
	function Router() {
		
		this.routes = [];
		this.root = "/";
	}
	
	Router.prototype = new JSYG.StdContruct();
	
	Router.prototype.add = function(re, handler) {
		
		if (typeof re == 'function') {
			handler = re;
			re = '';
		}
		
		this.routes.push({
			re : re,
			handler : handler
		});
		
		return this;
	};
	
	Router.prototype.getFragment = function() {
		
		var fragment = '',match;
		
		if (this.mode === 'history') {
			
			fragment = clearSlashes(decodeURI(location.pathname + location.search));
			fragment = fragment.replace(/\?(.*)$/, '');
			fragment = this.root != '/' ? fragment.replace(this.root, '') : fragment;
		}
		else {
			
			match = window.location.href.match(/#(.*)$/);
			fragment = match ? match[1] : '';
		}
		
		return clearSlashes(fragment);
	};
	
	Router.prototype.remove = function(param) {
		
		var i=0,r,N=this.route.length;
		
		for (;i<N,r=this.routes[i];i++) {
			
			if (r.handler === param || r.re.toString() === param.toString()) {
				this.routes.splice(i, 1);
				return this;
			}
		}
		
		return this;
	};
	
	Router.prototype.flush = function() {
		
		while(this.routes[0]) this.routes.pop();
		
		this.mode = null;
		
		this.root = '/';
		
		return this;
	};
	
	Router.prototype._check = function(f) {
		
		var fragment = f || this.getFragment(),
			match,i=0,N=this.routes.length;
		
		for (;i<N;i++) {
			
			match = fragment.match(this.routes[i].re);
			
			if (match) {
				match.shift();
				this.routes[i].handler.apply({}, match);
				return this;
			}
		}
		
		return this;
	};
			
	Router.prototype.listen = function() {
		
		var that = this;
		
		this.stopListening();
		
		function listen() { that.check(that.getFragment()); }
		
		window.addEventListener("hashchange",listen,false);
		
		this.stopListening = function() {
			window.removeEventListener("hashchange",listen,false);
		};
		
		return this;
	};
	
	Router.prototype.stopListening = function() {
		return this;
	};
	
	Router.prototype.navigate = function(path) {
		
		path = path ? path : '';
		
		if (this.mode === 'history') {
			history.pushState(null, null, this.root + clearSlashes(path));
		}
		else {
			window.location.href.match(/#(.*)$/);
			window.location.href = window.location.href.replace(/#(.*)$/, '')+ '#' + path;
		}
		
		return this;
	};
	
	JSYG.router = new Router();
	
	return JSYG.router;
	
}());