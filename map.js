var feature;

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

var svg = d3.select(map.getPanes().overlayPane).append("svg"), 
	g = svg.append("g").attr("class", "leaflet-zoom-hide");

var centers = new Object();

var returnCentroid = function(json) {
	centers[json.external_id] = json.centroid;
};

var getTractCentroid = function(tract) {
	var base_url = "http://census.ire.org/geo/1.0/boundary-set/tracts/";

	url = base_url + tract;
	return $.ajax(url, {
		dataType: "jsonp",
		jsonpCallback: 'returnCentroid',
		async: false
	});
};

var loadState = function(state) {
	var fileExt = '-agged-excluded.json';
	d3.json(state + fileExt, function(json) {
		// this will be input from search box
		var tract = userGeoID;

		g.selectAll("circle")
			.data(json[tract].workTracts)
			.enter()
			.append("circle")
			.attr({
				'id': function(d) {
					return 'w' + d.workTract;
				},
				"r": function(d) {
					var total = 0;
					if (d.industries['goodsProducing']) {
						total += d.industries['goodsProducing'];
					}
					if (d.industries['transTradeUtil']) {
						total += d.industries['transTradeUtil'];
					}
					if (d.industries['allOther']) {
						total += d.industries['allOther'];
					}
					return 5;
				},
				"fill": "blue"
			});

		var wts = json[tract].workTracts;
		for(i = 0; i < wts.length; i++) {
			var promise = getTractCentroid(wts[i].workTract);
			promise.success(function(data) {
				coords = project(data['centroid']['coordinates']);
				d3.select("#w" + data['external_id']).attr({
					"cx": coords[0],
					"cy": coords[1]
				});
			});
		}
	});
};

var states = ['DE', 'MD', 'NJ', 'PA'];

// this function mostly taken from Mike Bostock's http://bost.ocks.org/mike/leaflet/ tutorial
var overlay = function() {

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
					return counties[county_id];
	    		});
	  	}
	});
};

overlay();

// above is Jana's, below is mine 

var userGeoID;
var userTractData;
var returnGeoID = function(json) {
	console.log("returnGeoID" + json.objects[0].metadata.GEOID10);
	userGeoID = json.objects[0].metadata.GEOID10;
	userTractData = json.objects[0].simple_shape;
	for (i = 0; i < states.length; i++) {
		loadState(states[i]);
	}
}

var getCensusTract = function(Lat, Lng) {
	console.log("hello getCensusTract");
	var base_url = "http://census.ire.org/geo/1.0/boundary/?sets=tracts&contains=";
	url = base_url + Lat + ", " + Lng;
	$.ajax(url, {
		dataType: "jsonp",
		/*jsonpCallback: 'returnGeoID',*/
		success: returnGeoID
	});
	/*$.getJSON('http://census.ire.org/geo/1.0/boundary/?sets=tracts&format=jsonp&callback=func&contains=' + Lat + "," + Lng, function(data) {
		console.log("IRE CENSUS " + data.objects[0].external_id)
	})*/
}

function chooseAddr(lat1, lng1, lat2, lng2, osm_type, centerLat, centerLng) {
	var loc1 = new L.LatLng(lat1, lng1);
	var loc2 = new L.LatLng(lat2, lng2);
	var bounds = new L.LatLngBounds(loc1, loc2);

	if (feature) {
		map.removeLayer(feature);
	}
	if (osm_type == "node") {
		feature = L.circle( loc1, 25, {color: 'green', fill: false}).addTo(map);
		map.fitBounds(bounds);
		map.setZoom(18);
	} else {
		var loc3 = new L.LatLng(lat1, lng2);
		var loc4 = new L.LatLng(lat2, lng1);

		feature = L.polyline( [loc1, loc4, loc2, loc3, loc1], {color: 'red'}).addTo(map);
		//map.fitBounds(bounds);
	}

	console.log("Hello world", centerLat, centerLng);
	return getCensusTract(centerLat, centerLng);
}

function addr_search() {
    var inp = document.getElementById("addr");

    $.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + inp.value, function(data) {
        var items = [];

        $.each(data, function(key, val) {
            bb = val.boundingbox;
            geocodeLat = val.lat;
            geocodeLng = val.lon;
            console.log("Location BB:", bb);
            items.push("<li><a href='#' onclick='chooseAddr(" + bb[0] + ", " + bb[2] + ", " + bb[1] + ", " + bb[3]  + ", \"" + val.osm_type + "\", " + geocodeLat + ", " + geocodeLng + ");return false;'>" + val.display_name + '</a></li>');
        });

		$('#results').empty();
        if (items.length != 0) {
            $('<p>', { html: "Search results:" }).appendTo('#results');
            $('<ul/>', {
                'class': 'my-new-list',
                html: items.join('')
            }).appendTo('#results');
        } else {
            $('<p>', { html: "No results found" }).appendTo('#results');
        }
    });
}

//window.onload = load_map;