require.config({
	paths:{
		"jquery":"../bower_components/jquery/dist/jquery",
		"jsyg":"../src/jsyg",
		"promise":"../src/Promise",
		"promise":"../src/Promise"
	}
});

require(["jquery","jsyg","../src/Promise","../src/Transform"],function($,JSYG,Promise) {
	
	var toto = new JSYG("<div>");//.text("TOTO");
	
	toto.addClass(name);
	
	toto.appendTo("body");
	
	var svg = new JSYG('<svg>')
	.width(400).height(400)
	.appendTo('body').css("background-color","gray");
	
	new JSYG('<rect>')
	.attr({x:50,y:50,width:50,height:50})
	.css("fill","violet")
	.appendTo(svg)
	.rotate(30);
	
});