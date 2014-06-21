require.config({
	 paths: {
	    "jquery": '../bower_components/jquery/dist/jquery',
	    "zepto": '../bower_components/zepto/zepto',
	    "jsyg": '../src/JSYG'
	 },
	 urlArgs: "bust=" + new Date()
});

require(["jquery","jsyg"],function($,JSYG) {
		
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
		
		equal( container[0].tagName , "DIV", "DIV" );
		
		container.append(div[0]);
		
		equal( container[0].tagName , "DIV", "DIV" );
		
		svg.appendTo(div[0]);
		
		equal( container[0].tagName , "DIV", "DIV" );
		
		ok( container.find("div").length , "Elements HTML" );
		
		equal( container[0].tagName , "DIV", "DIV" );
		
		ok( container.find("svg").length , "Elements SVG" );
		
		equal( container[0].tagName , "DIV", "DIV" );
	});
	
	test("Manipulation du css", function() {
		
		var color = "rgb(255, 0, 0)";
		
		div.css("background-color",color);
		
		var rect = new JSYG('<rect>').attr({width:50,height:50,fill:color}).appendTo(svg[0]);
		
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
		
		svg = new JSYG('<rect>').attr({width:50,height:50}).appendTo(svg[0]);
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
	
	test("Traversing",function() {
		
		var a = new JSYG('<a>').appendTo(container[0]);
		var b = $('<a>').appendTo(container[0]);
		
		equal( container[0].tagName , "DIV", "DIV" );
		equal( a.parent()[0].tagName , container[0].tagName, "Parent d'élément HTML" );
		
		equal( container[0].tagName , "DIV", "DIV" );
		equal( a[0].tagName , "A", "Parent d'élément HTML" );
		
		equal( container[0].tagName , "DIV", "DIV" );
		equal( b.parent()[0].tagName , container[0].tagName, "Parent d'élément HTML" );
		
		equal( container[0].tagName , "DIV", "DIV" );
		equal( b[0].tagName , "A", "Parent d'élément HTML" );
		
	});
	
	test("Dimensions",function() {
		
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
		
		var ellipse = new JSYG('<ellipse>')
		.attr({
			cx:100,
			cy:100,
			rx:50,
			ry:50
		})
		.appendTo('svg');
		
		var line = new JSYG('<line>')
		.attr({
			x1:100,
			y1:50,
			x2:200,
			y2:100
		})
		.appendTo('svg');
		
		var div = new JSYG('<div>')
		.css({
			position:"absolute",
			top:50,
			left:50,
			width:100,
			height:150
		})
		.appendTo(container);
		
		equal( svg.width(), 500, "Taille des balises SVG inline dans la page" );
		equal( svg.height(), 500, "Taille des balises SVG inline dans la page" );
		
		equal( ellipse.width() , 100, "Taille des éléments SVG" );
		equal( ellipse.height() , 100, "Taille des éléments SVG" );
		
		equal( line.width() , 100, "Taille des éléments SVG" );
		equal( line.height() , 50, "Taille des éléments SVG" );
		
		equal( rect.width() , 100, "Taille des éléments SVG" );
		equal( rect.height() , 100, "Taille des éléments SVG" );
		
		equal( div.width() , 100, "Taille des éléments HTML" );
		equal( div.height() , 150, "Taille des éléments HTML" );
		
		rect.width(200).height(200);
		
		equal( rect.width() , 200, "Taille des éléments SVG" );
		equal( rect.height() , 200, "Taille des éléments SVG" );
		
		
	});
	
	
	/*
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
	});*/
	
	
	
});