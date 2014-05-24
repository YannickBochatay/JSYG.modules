require.config({
	 paths: {
	    "jquery": '../bower_components/jquery/dist/jquery',
	    "zepto": '../bower_components/zepto/zepto',
	    "jsyg": '../src/JSYG',
	 },
	 urlArgs: "bust=" + new Date()
});

require(["jquery","jsyg"],function(jQuery,JSYG) {
		
	module("JSYG core");
			
	var container = new JSYG("#qunit-fixture"),
		div = new JSYG('<div>'),
		svg = new JSYG('<svg>');
		
	test("Création d'éléments", function() {
		
		expect(2);
		ok( !div.isSVG() && div.length , "Element HTML" );
		ok( svg.isSVG() && svg.length , "Element SVG" );
		
	});
	
	test("Création d'éléments avec innerHTML",function() {
		
		var div = new JSYG("<div><span>TOTO</span></div>");
		var divSvg = new JSYG("<svg width='400' height='500'><rect width='30' height='40'/></svg>");
		
		equal(div.find('span').text(), "TOTO","Elements HTML");
		equal(divSvg.find('rect').attr("width"), "30","Elements SVG");
	});
	
	test("Sélection d'éléments", function() {
		
		container.append(div);
		svg.appendTo(div);
			
		ok( container.find("div").length , "Elements HTML" );
		ok( container.find("svg").length , "Elements SVG" );
	});
	
	test("Manipulation du css", function() {
		
		var color = "rgb(255, 0, 0)";
		
		div.css("background-color",color);
		
		var rect = new JSYG('<rect>').attr({width:50,height:50,fill:color}).appendTo(svg);
		
		rect[0].style.stroke = color;
		rect[0].style.opacity = 0.5;
				
		/*rect.css({
			"stroke":color,
			"opacity":0.5
		});*/
					
		equal( div.css("background-color"), color , "Elements HTML" );
		
		equal( rect.css("fill"), color , "Elements SVG" );
		
		equal( rect.css("stroke"), color , "Elements SVG" );
		equal( rect.css("opacity"), "0.5" , "Elements SVG" );
		
		//equal( rect[0].style.stroke, color , "Elements SVG" );
		//equal( rect[0].style.opacity, "0.5" , "Elements SVG" );
	});
	
	test("Gestion des classes", function() {
		
		div.addClass("red strokeRed");
		
		svg = new JSYG('<rect>').attr({width:50,height:50}).appendTo(svg);
		svg.addClass("red strokeRed");
		
		ok( div.hasClass("red"), "addClass et hasClass sur élements HTML");
		ok( svg.hasClass("strokeRed"), "addClass et hasClass sur élements SVG");
		
		ok( div.hasClass("red"), "addClass et hasClass sur élements HTML");
		ok( svg.hasClass("strokeRed"), "addClass et hasClass sur élements SVG");
		
		div.removeClass("red");
		svg.removeClass("strokeRed");
		
		ok( div.hasClass("strokeRed") , "removeClass et hasClass sur élements HTML");
		ok( !svg.hasClass("strokeRed") && svg.hasClass("red"), "removeClass et hasClass sur élements SVG");
		
		div.addClass(function(j) { return "red strokeRed"+j; });
		svg.addClass(function(j) { return "red strokeRed"+j; });
		
		ok( div.hasClass("strokeRed0"), "addClass avec fonction en argument sur élements HTML");
		ok( svg.hasClass("strokeRed0"), "addClass avec fonction en argument sur élements SVG");
		
		div.toggleClass("strokeRed0");
		svg.toggleClass("strokeRed0");
		
		ok( !div.hasClass("strokeRed0"), "toggleClass sur élements HTML");
		ok( !svg.hasClass("strokeRed0"), "toggleClass sur élements SVG");
		
		div.toggleClass("red");
		svg.toggleClass("red");
				
	});
	
	
	test("Gestion des attributs et liens",function() {
		
		var a = new JSYG('<a>'),
			aSVG = new JSYG('<svg:a>'),
			url = "http://ybochatay.fr/";
		
		a.attr("href",url);
		aSVG.attr("href",url);
		
		equal( a.attr("href") , url, "Attribut href sur éléments HTML" );
		equal( aSVG.attr("href") , url, "Attribut href sur éléments SVG" );
		
		a.attrRemove("href");
		aSVG.attrRemove("href");
		
		equal( a.attr("href"), "", "retrait de l'attribut href sur éléments HTML" );
		equal( aSVG.attr("href"), "", "retrait de l'attribut href sur éléments SVG" );
		
		a.attr({href:url});
		aSVG.attr({href:url});
		
		equal( a.attr("href") , url, "Attributs sous forme d'objet sur éléments HTML" );
		equal( aSVG.attr("href") , url, "Attribut sous forme d'objet sur éléments SVG" );
		
		a.attr("href",function(i) { return url; });
		aSVG.attr("href",function(i) { return url; });
		
		equal( a.attr("href") , url, "Attributs sous forme de fonction sur éléments HTML" );
		equal( aSVG.attr("href") , url, "Attribut sous forme de fonction sur éléments SVG" );
		
	});
	
	
	test("Gestion du positionnement",function() {
		
		var svg = new JSYG('<svg>')
		.css({
			"position":"absolute",
			"top":50,
			"left":50,
			"width":500,
			"height":500
		})
		.appendTo(container);
		
		var rect = new JSYG('<rect>')
		.attr({
			width:100,
			height:100,
			x:50,
			y:50
		})
		.appendTo('svg');
		
		var div = new JSYG('<div>')
		.css({
			position:"absolute",
			top:50,
			left:50
		})
		.appendTo(container);
		
		var offsetParent = $(container).css("position","relative").offset();
				
		equal( svg.offset() , {top:offsetParent.top+50,left:offsetParent.left+50}, "Position des balises SVG inline dans la page" );
		equal( rect.offset() , {top:offsetParent.top+100,left:offsetParent.left+100}, "Position des éléments SVG dans la page" );
		equal( div.offset() , {top:offsetParent.top+50,left:offsetParent.left+50}, "Position des éléments HTML dans la page" );
		equal( offsetParent , {top:offsetParent.top,left:offsetParent.left}, "Position des éléments HTML dans la page" );
	});
	
	
	
});
