JSYG.require("Transform").then(function() {
	
	var toto = new JSYG("<div>").text("TOTO");
	
	toto.appendTo("body");
	
	var svg = new JSYG('<svg>')
	.width(400).height(400)
	.appendTo('body').css("background-color","gray");
	
	new JSYG('<rect>')
	.attr({x:50,y:50,width:50,height:50})
	.css("fill","violet")
	.appendTo(svg)
	.rotate(30);
	
})
["catch"](function(e) { console.log(e); });