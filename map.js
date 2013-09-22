// Latitude first
var map = L.map('map').setView([39.95, -75.17], 11);

L.tileLayer('http://tile.stamen.com/toner-lite/{z}/{x}/{y}.jpg', {
	attribution: '<a id="home-link" target="_top" href="../">Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>',
	maxZoom: 18
}).addTo(map);

d3.json('PA-agged-excluded.json', function(error, json) {
	var data = json;
	overlay(data);
});

// this function mostly taken from Mike Bostock's http://bost.ocks.org/mike/leaflet/ tutorial
var overlay = function(data) {
	var svg = d3.select(map.getPanes().overlayPane).append("svg"), 
		g = svg.append("g").attr("class", "leaflet-zoom-hide");

	d3.json('tract.json', function(collection) {

		var bounds = d3.geo.bounds(collection),
			path = d3.geo.path().projection(project);
		var feature = g.selectAll("path")
			.data(collection.features)
				.enter().append("path");

		map.on("viewreset", reset);
		reset();

		// Reposition the SVG to cover the features.
	  	function reset() {
	    	var bottomLeft = project(bounds[0]),
	        	topRight = project(bounds[1]);

	    	svg.attr("width", topRight[0] - bottomLeft[0])
	        	.attr("height", bottomLeft[1] - topRight[1])
	        	.style("margin-left", bottomLeft[0] + "px")
	        	.style("margin-top", topRight[1] + "px");

	    	g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

	    	feature.attr("d", path);
	  	}

		function project(x) {
			var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
			return [point.x, point.y];
		}
	});	
};