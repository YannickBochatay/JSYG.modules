JSYG
====

Modular library for both html and svg.

**Not ready yet.**

If you only want jQuery to work with SVG, just include this [file](https://raw.githubusercontent.com/YannickBochatay/JSYG/master/src/JSYG.js").

Then you can create, measure, manipulate SVG elements as you do with HTML.

Of course, it won't work with IE<9.

```javascript
var svg = JSYG("<svg>").attr({"width":400,"height":500}).appendTo("body");

var rect = JSYG("rect")
.attr({"x":50,"y":50,"width":100,"height":50})
.css("fill","red")
.addClass("MyClass");
.appendTo(svg);

rect.position(); // {left:50,top:50}
rect.offsetParent()[0] === svg[0] // true

svg.constructor === JSYG // true
svg instanceof jQuery // true
```
