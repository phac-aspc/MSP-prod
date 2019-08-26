/* 
    ECMAscript 5
*/

// This function simply finds the longitude and lattitude of a canadian location using a gov API
function findLocation(location, callback){
    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(request.responseText);
            if (data[0] == undefined){
                console.log(location);
            }
            var coordinates = data[0].geometry.coordinates;
            callback(coordinates);
        }
    };

    request.open("GET", "https://www.geogratis.gc.ca/services/geolocation/en/locate?q=" + location, true);
    request.send();
}
