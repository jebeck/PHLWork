// Latitude first
var map = L.map('map').setView([39.95, -75.17], 9);

L.tileLayer('http://tile.stamen.com/toner-lite/{z}/{x}/{y}.jpg', {
	attribution: '<a id="home-link" target="_top" href="../">Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
}).addTo(map);

var counties = {
	"42101": "Philadelphia County, PA",
	"42045": "Delaware County, PA",
	"42091": "Montgomery County, PA",
	"42017": "Bucks County, PA",
	"42029": "Chester County, PA",
	"10003": "New Castle County, DE",
	"34015": "Gloucester County, NJ",
	"34007": "Camden County, NJ",
	"34033": "Salem County, NJ",
	"34005": "Burlington County, NJ",
	"24015": "Cecil County, MD"
};

// add an SVG for D3 to use as a Leaflet overlayPane to display the 11 counties in the Phila. metro statistical area
var svg = d3.select(map.getPanes().overlayPane).append("svg"), 
// from Bostock's tutorial (http://bost.ocks.org/mike/leaflet/): "The leaflet-zoom-hide class is needed so that the overlay is hidden during Leaflet’s zoom animation; alternatively, you could disable the animation using the zoomAnimation option when constructing the map."
	g = svg.append("g").attr("class", "leaflet-zoom-hide");

// add an SVG for D3 to use as a Leaflet overlayPane to display the user's home census tract
var svgHT = d3.select(map.getPanes().overlayPane).append("svg"), 
	gHT = svgHT.append("g").attr("class", "leaflet-zoom-hide");

var countyBounds;

var countyPaths;

var homeTractBounds;

var homeTractPath;

d3.json('json/counties.json', function(collection) {

	countyBounds = d3.geo.bounds(collection);
		
	countyPaths = g.selectAll("path")
		.data(collection.features)
		.enter()
		.append("path");

	countyPaths.append("title")
		.text(function(d) {
			var county_id = d.external_id;
			return counties[county_id];
		});

	map.on("viewreset", resetCounties);
	resetCounties();
});

// function to convert Leaflet's lat and long to D3 pixel coordinates
var project = function(x) {
	var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
	return [point.x, point.y];
}

// function to convert GeoJSON to SVG
var path = d3.geo.path().projection(project);

// set the dimensions of the SVG to match Leaflet zoom
var resetCounties = function() {
	var bottomLeft = project(countyBounds[0]),
		topRight = project(countyBounds[1]);

	svg.attr("width", topRight[0] - bottomLeft[0])
		.attr("height", bottomLeft[1] - topRight[1])
		.style("margin-left", bottomLeft[0] + "px")
		.style("margin-top", topRight[1] + "px");

	g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

	countyPaths.attr("d", path);
};

var displayHomeTract = function() {

	coll = {'type': 'FeatureCollection', 'features': userTractData}

	homeTractBounds = d3.geo.bounds(coll);

	homeTractPath = gHT.selectAll("path")
		.data(userTractData)
		.enter()
		.append("path")
		.attr("class", "tract");

	homeTractPath.append("title")
		.text(function(d) {
			return "Your home census tract.";
		});

	map.on("viewreset", resetHomeTract);
	var lat = userTractData[0].centroid.coordinates[1];
	var lng = userTractData[0].centroid.coordinates[0];
	map.setZoomAround([lat, lng], 12);
	resetHomeTract();
};

var resetHomeTract = function() {
	var bottomLeft = project(homeTractBounds[0]),
		topRight = project(homeTractBounds[1]);

	svgHT.attr("width", topRight[0] - bottomLeft[0])
		.attr("height", bottomLeft[1] - topRight[1])
		.style("margin-left", bottomLeft[0] + "px")
		.style("margin-top", topRight[1] + "px");

	gHT.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

	homeTractPath.attr("d", path);
};

// above is Jana's, below is mine 

var userGeoID;

var userTractData;

var returnGeoID = function(json) {
	// adding and renaming object keys for D3
	json.objects[0]['type'] = "Feature";
	json.objects[0]['geometry'] = json.objects[0]['simple_shape'];
	delete json.objects[0]['simple_shape'];

	console.log(json.objects[0]);
	userGeoID = json.objects[0].metadata.GEOID10;
	userTractData = json.objects;
	displayHomeTract();
}

var getCensusTract = function(Lat, Lng) {
	// console.log("hello getCensusTract");
	var base_url = "http://census.ire.org/geo/1.0/boundary/?sets=tracts&contains=";
	url = base_url + Lat + ", " + Lng;
	$.ajax(url, {
		dataType: "jsonp",
		success: returnGeoID
	});
}

function chooseAddr(centerLat, centerLng) {
	// console.log("Hello world", centerLat, centerLng);
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
            // console.log("Location BB:", bb);
            items.push("<li><a href='#' onclick='chooseAddr(" + bb[0] + ", " + bb[2] + ", " + bb[1] + ", " + bb[3]  + ", \"" + val.osm_type + "\", " + geocodeLat + ", " + geocodeLng + ");return false;'>" + val.display_name + '</a></li>');
        });

		$('#results').empty();
        if (items.length != 0) {
            $('<p>', { html: "Search results:" }).prependTo('#results');
            $('<ul/>', {
                'class': 'my-new-list',
                html: items.join('')
            }).appendTo('#results');
        } else {
            $('<p>', { html: "No results found" }).prependTo('#results');
        }
    });
}