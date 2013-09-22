var map;
var feature;

function load_map() {
  map = new L.Map('map', {zoomControl: false});

  var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttribution = 'Map data &copy; 2012 <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    osm = new L.TileLayer(osmUrl, {maxZoom: 18, attribution: osmAttribution});

  map.setView(new L.LatLng(40, -75.1), 12).addLayer(osm);
}

/*function alert_handler(sf1) {
            alert("The 2010 population of "+ sf1['metadata']['NAME'] + " was " + sf1['data']['2010']['P1']['P001001'] + ".");
        }
function fetch_data(geoid, success_handler) {
    callback = 'geoid_' + geoid;
    url = 'http://censusdata.ire.org/' + geoid.substr(0,2) + '/' + geoid + '.jsonp';
    console.log('calling: ' + url);
    $.ajax(url, {
        dataType: "jsonp",
        jsonpCallback: callback,
        success: success_handler
    });
}
fetch_data('1571550',alert_handler);

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
};*/
var userGeoID;
var returnGeoID = function(json) {
	console.log("returnGeoID" + json.objects[0].metadata.GEOID10);
	userGeoID = json.objects
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
		map.fitBounds(bounds);
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

window.onload = load_map;