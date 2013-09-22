// Latitude first
var map = L.map('map').setView([39.95, -75.17], 9);

L.tileLayer('http://tile.stamen.com/toner-lite/{z}/{x}/{y}.jpg', {
	attribution: '<a id="home-link" target="_top" href="../">Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>',
	maxZoom: 18
}).addTo(map);

var counties = {
	"42101": "Philadelphia, PA",
	"42045": "Delaware, PA",
	"42091": "Montgomery, PA",
	"42017": "Bucks, PA",
	"42029": "Chester, PA",
	"10003": "New Castle, DE",
	"34015": "Gloucester, NJ",
	"34007": "Camden, NJ",
	"34033": "Salem, NJ",
	"34005": "Burlington, NJ",
	"24015": "Cecil, MD"
};

var project = function(x) {
	var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
	return [point.x, point.y];
}

var path = d3.geo.path().projection(project);

var returnCentroid = function(json) {
	console.log(json.centroid);
};

var getTractCentroid = function(tract, returnCentroid) {
	var base_url = "http://census.ire.org/geo/1.0/boundary-set/tracts/";

	url = base_url + tract;
	$.ajax(url, {
		dataType: "jsonp",
		jsonpCallback: 'returnCentroid',
		success: returnCentroid
	});
};

d3.json('all-states-agged-excluded.json', function(error, json) {
	var data = json;
	// this will be input from search box
	var tract = ['42101000500'];
	getTractCentroid(tract);


	// d3.selectAll("circle")
	// 	.data(data[tract])
	// 	.enter()
	// 	.append("circle")
	// 	.attr({
	// 		"cx": function(d) {
				
	// 		}
	// 	})
});

// this function mostly taken from Mike Bostock's http://bost.ocks.org/mike/leaflet/ tutorial
var overlay = function() {
	var svg = d3.select(map.getPanes().overlayPane).append("svg"), 
		g = svg.append("g").attr("class", "leaflet-zoom-hide");

	d3.json('counties.json', function(collection) {

		var bounds = d3.geo.bounds(collection);
			
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

	    	feature.append("title")
	    		.text(function(d) {
					var county_id = d.external_id;
					console.log(counties[county_id]);
					return counties[county_id];
	    		});
	  	}
	});
};

overlay();