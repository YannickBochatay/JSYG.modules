var define, require;

(function() {

	var registry = {}, seen = {};

	define = function(name, deps, callback) {
		registry[name] = {
			deps : deps,
			callback : callback
		};
	};

	require = function(name) {

		if (seen[name])
			return seen[name];

		seen[name] = {};

		if (!registry[name])
			throw new Error("Could not find module " + name);

		var mod = registry[name], deps = mod.deps, callback = mod.callback, reified = [], exports = null, i, l, value;

		for (i = 0, l = deps.length; i < l; i++) {
			if (deps[i] === 'exports')
				reified.push(exports = {});
			else
				reified.push(require(resolve(deps[i])));
		}

		value = callback.apply(this, reified);

		return seen[name] = exports || value;

		function resolve(child) {

			if (child.charAt(0) !== '.')
				return child;

			var parts = child.split("/"), parentBase = name.split("/").slice(0,
					-1), i, l, part;

			for (i = 0, l = parts.length; i < l; i++) {
				part = parts[i];
				if (part === '..')
					parentBase.pop();
				else if (part === '.')
					continue;
				else
					parentBase.push(part);
			}

			return parentBase.join("/");
		}
	};

})();