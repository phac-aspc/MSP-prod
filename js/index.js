function drawBar(target, xScale, values) {
    var svg = target.append('svg').attr('height', 40).attr("width", $("#information").width());
    var formatter = d3.format(",");

    console.log(values);

    svg.append('g')
        .attr('class', 'bar');

    svg.select('.bar')
        .append('text')
        .attr('text-anchor', 'right')
        .attr('dy', '1.2em')
        .text(0);

    svg.select('.bar')
        .append('rect')
        .attr('height', 40)
        .style("fill", "#ffa502")
        .attr('width', 0)
        .transition()
        .duration(1000)
        .attr('width', xScale(values[0]));

    svg.select('.bar')
        .append('rect')
        .attr('x', xScale(values[0]) + 2)
        .attr('height', 40)
        .style("fill", "#686de0")
        .attr('width', 0)
        .transition()
        .duration(1000)
        .delay(700)
        .attr('width', xScale(values[1]));

    svg.select('.bar')
        .select('text')
        .transition()
        .duration(1000)
        .tween("text", function (d) {
            var el = d3.select(this);
            var interpolator = d3.interpolate(el.text().replace(/[,$]/g, ""), values[0]);
            return function (t) {
                el.text("$" + formatter(interpolator(t).toFixed(0)));
            };
        })
        .attr("x", function (d) {
            return xScale(values[0]) + xScale(values[1]) + 10;
        });
}

function template(data, colors, xScale) {
    var list = d3.select('#project-list').html("");

    for (var d = 0; d < data.length; d++) {
        var item = list
            .datum(data[d])
            .append('li')
            .attr("id", "projectResult" + d)
            .attr("class", "project")
            .style("border-left", "5px solid " + colors[d])
            .style("padding-left", "10px");

        var header = item.append('div').attr('class', 'project-header');

        // adding the project title to the list item
        var titleAndIcons = header
            .append('div')
            .attr('class', 'row');

        var projectName = titleAndIcons.append('h3')
            .attr('class', 'col-md-8')
            .html(function (k) {
                return k["Project"].split(";")[1] || "Unknown Project Name";
            });

        var startDate = new Date(data[d]["Project Start Date"]);
        if (startDate.getFullYear() == new Date().getFullYear()) {
            projectName.append("span")
                .attr("class", "newTag")
                .html("new");
        }


        if (data[d]["Non MSP Projects"].toLowerCase() == "yes") {
            projectName.append("span")
                .attr("class", "nonMspTag")
                .html("Non-MSP");
        }
        var icons = titleAndIcons.append('div')
            .attr('class', 'icons');

        icons
            .append('a')
            .attr('class', 'open-map')
            .attr('href', '#funding-map')
            .append('i')
            .attr('class', 'fas fa-map-marker-alt');

        icons.append('a')
            .attr('href', function (d) {
                return d['Website'];
            })
            .attr('target', '_blank')
            .append('i')
            .attr('class', 'fas fa-external-link-alt');

        var orgAndDate = header.append('div')
            .attr('class', 'row');

        orgAndDate.append('p')
            .attr('class', 'col-md-6')
            .html(function (k) {
                return k["Project"].split(";")[0];
            });

        orgAndDate.append('p')
            .attr('class', 'col-md-6')
            .html(
                function (d) {
                    var monthNames = [
                        "January", "February", "March",
                        "April", "May", "June", "July",
                        "August", "September", "October",
                        "November", "December"
                    ];
                    var startDate = new Date(d['Project Start Date']);
                    var endDate = new Date(d['Project End Date']);

                    return monthNames[startDate.getMonth()] + " " + startDate.getFullYear() + " to " + monthNames[endDate.getMonth()] + " " + endDate.getFullYear();
                }
            ).style('text-align', 'right')
            .style('color', 'black')
            .style('text-decoration', 'underline');

        var amount = item.append('div')
            .attr('class', 'amount');

        drawBar(amount, xScale, [+data[d]["Funding Amount"].replace(/[,$]/g, ""), +data[d]["Leveraged Funds"].replace(/[,$]/g, "")]);

        // adding the project purpose
        item.append('p')
            .html(function (k) {
                return k['Purpose of Project'];
            });

        // partners div
        var partners = data[d]["Partners"].split(/[,;]/);

        if (!(partners.length == 1 && partners[0] == "")) {
            var details = item.append("details")
                .attr("class", "acc-group off wb-lbx");

            details.append("summary")
                .html('Match Funding Partners')
                .attr("class", "tgl-tab wb-init wb-toggle-inited");

            details.selectAll(".partner")
                .data(partners)
                .enter()
                .append('div')
                .attr('class', 'partner')
                .html(function (d) {
                    return d;
                });
        }

        item.on("mouseover", function (d) {
            var affectedAreas = d["Delivery Location"].replace(/[" "]/g, "").split(",");
            if (affectedAreas[0].toLowerCase() != "all") {
                for (var i = 0; i < affectedAreas.length; i++) {
                    d3.select("#" + affectedAreas[i]).style("opacity", 0.5);
                }
            } else {
                d3.selectAll(".province").style("opacity", 0.5);
            }
        });

        item.on("mouseout", function (d) {
            d3.selectAll(".province").style("opacity", 0);
        });
    }
}

function addCoordinates(pointsToProcess, callback) {
    var pointsProcessed = [];

    function process(point, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var data = JSON.parse(request.responseText);
                if (data[0] == undefined) {
                    console.log(point);
                }
                var coordinates = data[0].geometry.coordinates;
                point.coordinates = new L.LatLng(coordinates[1], coordinates[0]);
                callback(point);
            }
        };
        request.open("GET", "https://www.geogratis.gc.ca/services/geolocation/en/locate?q=" + point["Address"], true);
        request.send();
    }

    pointsToProcess.forEach(function (el) {
        process(el, function (newPoint) {
            pointsProcessed.push(newPoint);

            if (pointsProcessed.length == pointsToProcess.length) {
                callback(pointsProcessed);
            }
        });
    });
}

function renderData(data, colors, xScale, map) {
    $("#information").pagination({
        dataSource: data,
        pageSize: 4,
        pageRange: 9999,
        prevText: "Previous",
        nextText: "Next",
        className: "paginationHeight",
        ulClassName: "pagination",
        callback: function (data, pagination) {
            template(data, colors, xScale);
        },
        afterPaging: function () {
            d3.select('.paginationjs-next').select('a').attr('rel', 'next');
            d3.select('.paginationjs-prev').select('a').attr('rel', 'prev');
        }
    });
    d3.select('.paginationjs-next').select('a').attr('rel', 'next');
    d3.select('.paginationjs-prev').select('a').attr('rel', 'prv');
    $("#results-count").text(data.length);
}

function age(lowerBound, upperBound) {
    lowerBound = lowerBound == "All" ? 0 : +lowerBound;
    upperBound = upperBound == "All" ? 300 : +upperBound;

    let ageGroups = {
        "infants": {
            "lower": 0,
            "higher": 4
        },
        "children": {
            "lower": 5,
            "higher": 11
        },
        "youth": {
            "lower": 11,
            "higher": 17
        },
        "adult": {
            "lower": 18,
            "higher": 64
        },
        "olderAdults": {
            "lower": 65,
            "higher": 300
        }
    };

    var results = [];
    var keys = Object.keys(ageGroups);

    for (var i = 0; i < keys.length; i++) {
        var ageGroup = keys[i];
        var group = ageGroups[ageGroup];

        if (lowerBound >= group["lower"] && lowerBound <= group["higher"])
            results.push(ageGroup);
        else if (upperBound <= group["higher"] && upperBound >= group["lower"])
            results.push(ageGroup);
        else if (lowerBound <= group["lower"] && upperBound >= group["higher"])
            results.push(ageGroup);
    }
    return results;
}

function filterByMultipleInterventions(data, interventions) {
    if (interventions.length == 0) {
        return data;
    }

    let filteredData = data.filter(function (el) {
        for (let i = 0; i < interventions.length; i++) {
            if (el["Intervention Type"].toLowerCase() == interventions[i])
                return true;
        }


        return false;
    });

    console.log(data);
    console.log(filteredData);

    return filteredData;
}


// filtering functions
function filterByMultipleAges(data, ages) {
    if (ages.length == 0) {
        return data;
    }

    let filteredData = data.filter(function (el) {
        for (let i = 0; i < ages.length; i++) {
            if (el["ageGroups"].includes(ages[i]))
                return true;
        }
        return false;
    });
    console.log(data);
    console.log(filteredData);

    return filteredData;
}

function filterByMultipleGenders(data, genders) {
    if (genders.length == 0) {
        return data;
    }

    let filteredData = data.filter(function (el) {
        for (let i = 0; i < genders.length; i++) {
            if (el["Gender"].toLowerCase() == genders[i] || el["Gender"].toLowerCase() == "all")
                return true;
        }
        return false;
    });

    console.log(data);
    console.log(filteredData);

    return filteredData;
}

function filterByIntervention(data, type) {
    let filteredData = data.filter(function (el) {
        if (type == "all")
            return true;
        return el["Intervention Type"].toLowerCase() == type;
    });
    return filteredData;
}

d3.csv("./data/partnerships_v12.csv", function (csv) {
    var provinceLookup = {
        "Quebec": "QC",
        "Newfoundland and Labrador": "NL",
        "British Colombia": "BC",
        "Nunavut": "NU",
        "Northwest Territories": "NT",
        "New Brunswick": "NB",
        "Nova Scotia": "NS",
        "Saskatchewan": "SK",
        "Alberta": "AB",
        "Prince Edward Island": "PE",
        "Yukon Territory": "YT",
        "Manitoba": "MB",
        "Ontario": "ON"
    };

    var colors = [
        "#4285F4", // blue
        "#EA4335", // red
        "#FBBC05", // yellow
        "#34A853", // green
    ];

    // places all different intervention types in an array
    var interventionTypes = [];

    csv.forEach(function (el) {
        if (!interventionTypes.includes(el["Intervention Type"])) {
            interventionTypes.push(el["Intervention Type"]);
        }
    });

    // makes a dropdown option of each intervention type
    interventionTypes.forEach(function (type) {
        d3.select('#interventionType')
            .append('div')
            .attr('class', 'bubble')
            .attr('id', type.toLowerCase())
            .html(type);
    });

    var commonRiskFactors = [];

    csv.forEach(function (el) {
        var riskFactors = el["Common Risk Factor"].split(";");

        for (let i = 0; i < riskFactors.length; i++) {
            if (!commonRiskFactors.includes(riskFactors[i])) {
                commonRiskFactors.push(riskFactors[i]);
            }
        }
    });

    console.log(commonRiskFactors);

    // adding an "ageGroups" category to the dataset to make it more verbose
    csv.forEach(function (el) {
        el["ageGroups"] = age(el["Lower Age"], el["Upper Age"]);
    });

    // rendering the map
    var map = L.map('funding-map', {
        center: [54.9641601681754, -90.4160163302575],
        zoom: 4,
        maxZoom: 12,
        minZoom: 3,
        zoomControl: false
    });

    // filtering ages
    var listOfSelectedAges = [];

    // filtering genders
    var listOfSelectedGenders = [];

    // filtering intervention types
    var listOfSelectedInterventions = [];

    // setting the dropdown settings
    // these will dynamically change based on the filter the use picks
    var selectedGender = "all";
    var selectedIntervention = "all";


    var vectorTileStyling = {

        water: {
            fill: true,
            weight: 1,
            fillColor: '#06cccc',
            color: '#06cccc',
            fillOpacity: 0.2,
            opacity: 0.4,
        },
        admin: {
            weight: 1,
            fillColor: 'pink',
            color: 'pink',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        waterway: {
            weight: 0,
            fillColor: '#2375e0',
            color: '#2375e0',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        landcover: {
            fill: true,
            weight: 1,
            fillColor: '#53e033',
            color: '#53e033',
            fillOpacity: 0.2,
            opacity: 0.4,
        },
        landuse: {
            fill: true,
            weight: 1,
            fillColor: '#e5b404',
            color: '#e5b404',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        park: {
            fill: true,
            weight: 0,
            fillColor: '#84ea5b',
            color: '#84ea5b',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        boundary: {
            weight: 1,
            fillColor: '#c545d3',
            color: '#c545d3',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        aeroway: {
            weight: 1,
            fillColor: '#51aeb5',
            color: '#51aeb5',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        road: {	// mapbox & nextzen only
            weight: 1,
            fillColor: '#f2b648',
            color: '#f2b648',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        tunnel: {	// mapbox only
            weight: 0.5,
            fillColor: '#f2b648',
            color: '#f2b648',
            fillOpacity: 0.2,
            opacity: 0.4,
            // 					dashArray: [4, 4]
        },
        bridge: {	// mapbox only
            weight: 0.5,
            fillColor: '#f2b648',
            color: '#f2b648',
            fillOpacity: 0.2,
            opacity: 0.4,
            // 					dashArray: [4, 4]
        },
        transportation: {	// openmaptiles only
            weight: 0.5,
            fillColor: '#f2b648',
            color: '#f2b648',
            fillOpacity: 0.2,
            opacity: 0.4,
            // 					dashArray: [4, 4]
        },
        transit: {	// nextzen only
            weight: 0.5,
            fillColor: '#f2b648',
            color: '#f2b648',
            fillOpacity: 0.2,
            opacity: 0.4,
            // 					dashArray: [4, 4]
        },
        building: {
            fill: true,
            weight: 1,
            fillColor: '#2b2b2b',
            color: '#2b2b2b',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        water_name: {
            weight: 0,
            fillColor: '#022c5b',
            color: '#022c5b',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        transportation_name: {
            weight: 0,
            fillColor: '#bc6b38',
            color: '#bc6b38',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        place: {
            weight: 0,
            fillColor: '#f20e93',
            color: '#f20e93',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        housenumber: {
            weight: 0,
            fillColor: '#ef4c8b',
            color: '#ef4c8b',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        poi: {
            weight: 0,
            fillColor: '#3bb50a',
            color: '#3bb50a',
            fillOpacity: 0.2,
            opacity: 0.4
        },
        earth: {	// nextzen only
            fill: true,
            weight: 1,
            fillColor: '#c0c0c0',
            color: '#c0c0c0',
            fillOpacity: 0.2,
            opacity: 0.4
        },


        // Do not symbolize some stuff for mapbox
        country_label: [],
        marine_label: [],
        state_label: [],
        place_label: [],
        waterway_label: [],
        poi_label: [],
        road_label: [],
        housenum_label: [],


        // Do not symbolize some stuff for openmaptiles
        country_name: [],
        marine_name: [],
        state_name: [],
        place_name: [],
        waterway_name: [],
        poi_name: [],
        road_name: [],
        housenum_name: [],
    };

    vectorTileStyling.buildings = vectorTileStyling.building;
    vectorTileStyling.boundaries = vectorTileStyling.boundary;
    vectorTileStyling.places = vectorTileStyling.place;
    vectorTileStyling.pois = vectorTileStyling.poi;
    vectorTileStyling.roads = vectorTileStyling.road;


    // my server is using Slava's domain because my own IP is blacklisted for phishing :(
    L.vectorGrid.protobuf('http://192.168.0.125:8080/data/v3/{z}/{x}/{y}.pbf', {
        vectorTileLayerStyles: vectorTileStyling,
        rendererFactory: L.canvas.tile,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
    }).addTo(map);

    //add zoom control with your options
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // create the SVG layer on top of the map
    L.svg().addTo(map);

    // add a group in the SVG for the provinces
    d3.select("svg")
        .append("g")
        .attr("id", "provinceGroup");

    // map stuff
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

    // projecting the map
    var transform = d3.geoTransform({
        point: projectPoint
    });
    var path = d3.geoPath().projection(transform);

    // reading in the map json
    d3.json("./data/canada.v2.json", function (geoJson) {
        // creating the provinces on the svg layer
        // opacity will be 0.5 when a user hovers over a project
        var provincePaths = d3.select("#provinceGroup")
            .selectAll(".province")
            .data(geoJson.features)
            .enter()
            .append("g")
            .attr("class", "province")
            .attr("id", function (d) {
                return provinceLookup[d.properties["name"]];
            })
            .style("fill", "#c51b8a")
            .style("opacity", 0)
            .append("path")
            .attr("d", path);

        //update path after user done dragging or zooming
        map.on("moveend", function () {
            provincePaths.attr("d", path);
        });
    });

    // calculating the max value in order to properly scale the bar chart
    // (the /g modifer replaces all occurances)
    var max = d3.max(csv, function (d) {
        var amount = +d["Funding Amount"].replace("$", "").replace(/,/g, "") + +d["Leveraged Funds"].replace("$", "").replace(/,/g, "");
        return amount;
    });

    var xScale = d3.scaleLinear().domain([0, max]).range([0, $("#information").width() - 200]);

    // setting the sortBy default value
    var sortBy = "alphabet";

    // this just groups the circles together
    function drawGroups(target, data) {
        d3.selectAll(".intersection").remove();

        var intersection = d3.select(target)
            .selectAll(".intersection")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "intersection")
            .attr("transform", function (d) {
                return "translate(" + d.coordinates.x + "," + d.coordinates.y + ")";
            });

        intersection.append('circle')
            .attr("pointer-events", "visible")
            .style("fill", "#e74c3c")
            .attr("r", 10)
            .style("stroke-width", 0.5)
            .style("stroke", "black");

        intersection.append('text')
            .attr("text-anchor", "middle")
            .attr("y", 3)
            .style("fill", "#fff")
            .text(function (d) {
                return d.data.length;
            });
    }

    var headquarters = d3.select("#funding-map")
        .select("svg")
        .append("g")
        .attr("id", "headquarters");

    // summary stats
    var formatter = d3.format(",");

    // count up for number of projects
    $("#projectCount").text(0);

    var interval = setInterval(function () {
        $("#projectCount").text(+($("#projectCount").text()) + 1);

        if ($("#projectCount").text() == csv.length)
            clearInterval(interval);
    }, 15);

    var sum = d3.sum(csv, function (d) {
        return +d["Funding Amount"].replace(/[,$]/g, "");
    });

    $("#phacFunding").text("$" + formatter(sum));

    sum = d3.sum(csv, function (d) {
        return +d["Leveraged Funds"].replace(/[,$]/g, "");
    });

    $("#nonTaxPayer").text("$" + formatter(sum));

    var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    // preprocess the data by adding the coordinates
    addCoordinates(csv, function (data) {
        function positionCircles(d) {
            var point = map.latLngToLayerPoint(d["coordinates"]);
            return "translate(" + point.x + "," + point.y + ")";
        }

        function drawCircles(cleanData) {
            return headquarters.selectAll("circle")
                .data(cleanData)
                .enter()
                .append("circle")
                .attr("id", function (d, i) {
                    return "H" + i;
                })
                .attr("class", "headquarter")
                .attr("r", 10)
                .attr("cx", 0)
                .attr("cy", 0)
                .style("stroke-width", 0.5)
                .style("stroke", "black")
                .style("display", "inline")
                .attr("transform", positionCircles)
                .attr("pointer-events", "visible")
                .style("fill", "#e74c3c")
                .on("mouseover", function (d) {
                    var affectedAreas = d["Delivery Location"].replace(/[" "]/g, "").split(",");
                    if (affectedAreas[0].toLowerCase() != "all") {
                        affectedAreas.forEach(function (el) {
                            d3.select("#" + el).style("opacity", 0.5);
                        });
                    } else {
                        d3.selectAll(".province").style("opacity", 0.5);
                    }
                    div.style("opacity", 1);

                    div.html(d["Project"].split(";")[1])
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                }).on("mouseout", function (d) {
                    d3.selectAll(".province").style("opacity", 0);
                    div.style("opacity", 0).style("top", 0).style("left", 0);
                });
        }

        var circles = drawCircles(data);
        var pageData = data;

        // sorting stuff
        pageData = pageData.sort(function (a, b) {
            return d3.ascending(a["Project"].split(";")[1], b["Project"].split(";")[1]);
        });

        renderData(pageData, colors, xScale);

        // groups circles together
        drawGroups("svg", d3.circleCollision(circles, true));

        // repositioning the circles on zoom
        map.on("zoom", function () {
            d3.selectAll(".intersection").remove();

            circles = d3.selectAll('.headquarter')
                .attr("transform", positionCircles)
                .style("display", "inline");

            drawGroups("svg", d3.circleCollision(circles, true));
        });

        // filters
        $("#gender").on("change", function () {
            selectedGender = this.value;

            pageData = filterByGender(data, selectedGender);
            pageData = filterByIntervention(pageData, selectedIntervention);

            // redrawing the circles
            d3.selectAll('.intersection').remove();
            circles.remove();
            circles = drawCircles(pageData);
            drawGroups("svg", d3.circleCollision(circles, true));

            // I'll fix the formatting later :P
            if (sortBy == "alphabet") {
                pageData = pageData.sort(function (a, b) {
                    return d3.ascending(a["Project"], b["Project"]);
                });
            } else if (sortBy == "amount") {
                pageData = pageData.sort(function (a, b) {
                    return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
            }

            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");

            // rendering the data
            renderData(pageData, colors, xScale);
        });

        $("#gender>.bubble").on("click", function () {
            $(this).hasClass("clicked") ? $(this).removeClass("clicked") : $(this).addClass("clicked");

            var selectedId = $(this).attr("id");
            var indexOfGender = listOfSelectedGenders.indexOf(selectedId);

            if (indexOfGender == -1) {
                listOfSelectedGenders.push(selectedId);
            } else {
                listOfSelectedGenders.splice(indexOfGender, 1);
            }
            pageData = filterByMultipleGenders(data, listOfSelectedGenders);
            pageData = filterByMultipleAges(pageData, listOfSelectedAges);
            pageData = filterByMultipleInterventions(pageData, listOfSelectedInterventions);

            d3.selectAll('.intersection').remove();
            circles.remove();
            circles = drawCircles(pageData);

            drawGroups("svg", d3.circleCollision(circles, true));

            // I'll fix the formatting later :P
            if (sortBy == "alphabet") {
                pageData = pageData.sort(function (a, b) {
                    return d3.ascending(a["Project"], b["Project"]);
                });
            } else if (sortBy == "amount") {
                pageData = pageData.sort(function (a, b) {
                    return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
            }

            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");

            // rendering the data
            renderData(pageData, colors, xScale);
        });

        $("#interventionType>.bubble").on("click", function () {
            $(this).hasClass("clicked") ? $(this).removeClass("clicked") : $(this).addClass("clicked");

            var selectedId = $(this).attr("id");
            var indexOfIntervention = listOfSelectedInterventions.indexOf(selectedId);

            if (indexOfIntervention == -1) {
                listOfSelectedInterventions.push(selectedId);
            } else {
                listOfSelectedInterventions.splice(indexOfIntervention, 1);
            }
            console.log(listOfSelectedInterventions);
            pageData = filterByMultipleInterventions(data, listOfSelectedInterventions);
            pageData = filterByMultipleAges(pageData, listOfSelectedAges);
            pageData = filterByMultipleGenders(pageData, listOfSelectedGenders);

            d3.selectAll('.intersection').remove();
            circles.remove();
            circles = drawCircles(pageData);

            drawGroups("svg", d3.circleCollision(circles, true));

            // I'll fix the formatting later :P
            if (sortBy == "alphabet") {
                pageData = pageData.sort(function (a, b) {
                    return d3.ascending(a["Project"], b["Project"]);
                });
            } else if (sortBy == "amount") {
                pageData = pageData.sort(function (a, b) {
                    return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
            }

            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");

            // rendering the data
            renderData(pageData, colors, xScale);
        });

        $("#age>.bubble").on("click", function () {
            $(this).hasClass("clicked") ? $(this).removeClass("clicked") : $(this).addClass("clicked");

            var selectedId = $(this).attr("id");
            var indexOfAge = listOfSelectedAges.indexOf(selectedId);

            if (indexOfAge == -1) {
                listOfSelectedAges.push(selectedId);
            } else {
                listOfSelectedAges.splice(indexOfAge, 1);
            }

            pageData = filterByMultipleAges(data, listOfSelectedAges);
            pageData = filterByMultipleInterventions(pageData, listOfSelectedInterventions);
            pageData = filterByMultipleGenders(pageData, listOfSelectedGenders);

            d3.selectAll('.intersection').remove();
            circles.remove();
            circles = drawCircles(pageData);

            drawGroups("svg", d3.circleCollision(circles, true));

            // I'll fix the formatting later :P
            if (sortBy == "alphabet") {
                pageData = pageData.sort(function (a, b) {
                    return d3.ascending(a["Project"], b["Project"]);
                });
            } else if (sortBy == "amount") {
                pageData = pageData.sort(function (a, b) {
                    return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
            }

            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");

            // rendering the data
            renderData(pageData, colors, xScale);
        });

        $("#alphabeticalSort").on("click", function () {
            sortBy = "alphabet";
            pageData = pageData.sort(function (a, b) {
                return d3.ascending(a["Project"].split(";")[1], b["Project"].split(";")[1]);
            });

            renderData(pageData, colors, xScale);

            $(".sort").removeClass("active");
            $(this).addClass("active");
        });

        $("#amountSort").on("click", function () {
            sortBy = "amount";
            pageData = pageData.sort(function (a, b) {
                return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
            });

            renderData(pageData, colors, xScale);
            $(".sort").removeClass("active");
            $(this).addClass("active");
        });

        $("#timeSort").on("click", function () {
            sortBy = "time";

            pageData = pageData.sort(function (a, b) {
                return d3.descending(new Date(a["Project Start Date"]), new Date(b["Project Start Date"]));
            });

            renderData(pageData, colors, xScale);
            $(".sort").removeClass("active");
            $(this).addClass("active");
        });

        d3.selectAll(".open-map")
            .on("click", function (d) {
                // do something cool
            });
    });
});

// Getting the data from google sheets (NOT PROVIDED FOR NOW) will add once the API is setup
// var request = new XMLHttpRequest();
// var API_KEY = "AIzaSyD0w5ErZNuAyG0yWLfUaJwxpKR-3SXPJq8";
// var MAJOR_DIMENSION = "ROWS";
// var RANGE = "A:Z";
// var params = "?key=" + API_KEY;

// params += "&majorDimension=" + MAJOR_DIMENSION;

// request.onreadystatechange = function() {
//     if (this.readyState == 4 && this.status == 200) {
//         var rawData = JSON.parse(request.responseText).values;
//         var data = rawData.toJSON();
//         console.log(data);
//     }
// };

// request.open("GET", "https://sheets.googleapis.com/v4/spreadsheets/1sGz4xKVpIXwByMDQkDCkn04ZRe0TvRU3ycQE5qkT2Es/values/" + RANGE + params, true);
// request.send();