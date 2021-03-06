require.config({
	baseUrl : "dist",
	paths: {
		"jquery": '../bower_components/jquery/dist/jquery'
	},
	urlArgs: "bust=" + new Date()
});

(function() {
/*
	require(["Builder"],function(builder) {
			
		builder.baseURL = "src";
		
		builder.process("JSYG","Utils").then(function(resul) {
			window.open( builder.toDataURL(resul.content), "result" );
		})
		['catch'](function(e) {
			console.error(e);
		});
			
	});
	
	return;*/
	
	require(["JSYG"],function(JSYG) {
		
		var svg = new JSYG('<svg>')
		.width(400).height(400)
		.css({
			position:"absolute",
			left:80,
			top:80
		})
		.viewBox({
			x:-50,
			y:-50,
			width:300,
			height:300
		})
		.appendTo('body').css("background-color","gray");
		
		var div = new JSYG('<div>')
		.css({top:80,left:80,width:100,height:50,position:'absolute',"background-color":"violet"})
		.text("toto")
		.appendTo("body")
		.rotate(25).translate(10,10);
				
		var innerSVG = new JSYG('<svg>')
		.attr({x:50,y:50,width:200,height:200,viewBox:"-50 -50 300 300"})
		.appendTo(svg);
		
		var rect = new JSYG('<rect>')
		.attr({x:0,y:0})
		.width(100).height(50)
		.css("fill","pink")
		.appendTo(svg);
		
		var innerRect = new JSYG('<rect>')
		.attr({x:50,y:50,width:100,height:50})
		.css("fill","violet")
		.appendTo(innerSVG).rotate(25).translate(10,10);
	
		new JSYG('<div>')
		.css({border:"2px solid orange"})
		.setDim({
			x: innerRect.offset().left,
			y: innerRect.offset().top,
			width:200,
			height:200
		})
		.appendTo('body');
		
	});
	
}());