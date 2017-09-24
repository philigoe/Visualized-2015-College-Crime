<!--
    index.html
    Phillip Igoe

    Giant JS file that powers the vis.
!-->
var crimeData;
var showTotalData;
var showAll;
var key;
var usaProjection;
var width = 800;
var height = 600;
// For the zoom logic, I looked at this block: https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
// and saw how to do it. I used that code as a foundation, and built upon it.
var zoom = d3.zoom()
    .scaleExtent([1, 100])
    .on("zoom", zoomed);
var active;
var path;
var zoomed = false;
var allCollegesData;
var clickedState;
var stateTooltip;
var schoolToolTip;
var chartToolTip;
var currentSelectedStateData;

function calculateTotalCrimeForSchool(d) {
    var violentCrime = parseInt(d["ViolentCrime"]),
        murder = parseInt(d["Murder"]),
        rapeRevised = parseInt(d["Rape(revised)"]),
        rapeLegacy = parseInt(d["Rape(legacy)"]),
        robbery = parseInt(d["Robbery"]),
        aggravatedAssault = parseInt(d["AggravatedAssault"]),
        propertyCrime = parseInt(d["PropertyCrime)"]),
        burglary =  parseInt(d["Burglary"]),
        larcenyTheft = parseInt(d["LarcenyTheft"]),
        motorVehicleTheft = parseInt(d["MotorVehicleTheft"]),
        arson = parseInt(d["Arson"]);
    violentCrime = violentCrime || 0;
    murder = murder || 0;
    rapeRevised = rapeRevised || 0;
    rapeLegacy = rapeLegacy || 0;
    robbery = robbery || 0;
    aggravatedAssault = aggravatedAssault || 0;
    propertyCrime = propertyCrime || 0;
    burglary = burglary || 0;
    larcenyTheft = larcenyTheft || 0;
    motorVehicleTheft = motorVehicleTheft || 0;
    arson = arson || 0;
    return violentCrime + murder + rapeRevised + rapeLegacy + robbery + aggravatedAssault + propertyCrime + burglary + larcenyTheft + motorVehicleTheft + arson;
}

function getIDFromSchool(d) {
    return (d["University/College"]+d["Campus"]+d["State"]).replace(/ /g,'').replace("'",'')
        .replace("&",'').replace("/",'').replace(".",'').replace(/,/g, '');
}

function filterSchools() {
    showTotalData = true;
    if($('#crimesPerStudentCheckbox').is(':checked')) {
        showTotalData = false;
    }

    var currentFilter = $("#crimeFilterDropdown").val();

    showAll = true;
    key = null;

    if(currentFilter != "all") {
        showAll = false;
    } if (currentFilter == "violentCrime") {
        key = 'ViolentCrime';
    } if (currentFilter == "murder") {
        key = 'Murder';
    } if (currentFilter == "rapeRevised") {
        key = 'Rape(revised)';
    } if (currentFilter == "rapeLegacy") {
        key = 'Rape(legacy)';
    } if (currentFilter == "robbery") {
        key = 'Robbery';
    } if (currentFilter == "aggravatedAssault") {
        key = 'AggravatedAssault';
    } if (currentFilter == "propertyCrime") {
        key = 'PropertyCrime';
    } if (currentFilter == "burglary") {
        key = 'Burglary';
    } if (currentFilter == "larcenyTheft") {
        key = 'LarcenyTheft';
    } if (currentFilter == "motorVehicleTheft") {
        key = 'MotorVehicleTheft';
    } if (currentFilter == "arson") {
        key = 'Arson';
    }

    var extent = d3.extent(currentSelectedStateData, function(d) {
        var totalCrime = calculateTotalCrimeForSchool(d);
        var students = parseInt(d.StudentEnrollment);
        if(showTotalData) {
            if(showAll) {
                return parseInt(totalCrime);
            } else {
                return parseInt(d[key]);
            }
        } else {
            if(showAll) {
                var studentPerCrime = 1/(totalCrime/students);
                if(isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                    studentPerCrime = 0;
                }
                return studentPerCrime;
            } else {
                var studentPerCrime = 1/(d[key]/students);
                if(isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                    studentPerCrime = 0;
                }
                return studentPerCrime;
            }
        }
    });

    var colorScaler;

    if(showTotalData) {
        colorScaler = d3.scaleLinear()
            .domain(extent)
            .range(["white", "#9E150F"]);
    } else {
        colorScaler = d3.scaleLinear()
            .domain(extent)
            .range(["#9E150F", "white"]);
    }

    if(showTotalData) {
        currentSelectedStateData.forEach( function(d) {
            if (showAll) {
                d3.select("#map svg").select("#" +getIDFromSchool(d))
                    .transition()
                    .style("fill",  colorScaler(parseInt(calculateTotalCrimeForSchool(d))));
            } else {
                d3.select("#map svg").select("#" + getIDFromSchool(d))
                    .transition()
                    .style("fill", colorScaler(parseInt(d[key])));
            }
        });
    } else {
        currentSelectedStateData.forEach(function(crimeDataFromSchool) {
            var totalCrime = calculateTotalCrimeForSchool(crimeDataFromSchool);
            var students = parseInt(crimeDataFromSchool.StudentEnrollment);
            var studentPerCrime = 1/(totalCrime/students);
            if (showAll) {
                if(isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                    studentPerCrime = 0;
                }
                d3.select("#map svg").select("#" + getIDFromSchool(crimeDataFromSchool))
                    .transition()
                    .style("fill", function(d) {
                        if(studentPerCrime == 0) {
                            return "white";
                        } else {
                            return colorScaler(studentPerCrime)
                        }
                    });
            } else {
                var perStudentValue = 1/(parseInt(crimeDataFromSchool[key])/students);
                if(isNaN(perStudentValue)) {
                    perStudentValue = 0;
                }
                d3.select("#map svg").select("#" + getIDFromSchool(crimeDataFromSchool))
                    .transition()
                    .style("fill", function(d) {
                        if(perStudentValue == 0) {
                            return "white";
                        } else {
                            return colorScaler(perStudentValue)
                        }
                    })
                ;
            }
        });
    }


    updateRankingsListForState(currentSelectedStateData);
}

function filterMap() {
    showTotalData = true;
    if($('#crimesPerStudentCheckbox').is(':checked')) {
        showTotalData = false;
    }

    var currentFilter = $("#crimeFilterDropdown").val();

    showAll = true;
    key = null;

    if(currentFilter != "all") {
        showAll = false;
    } if (currentFilter == "violentCrime") {
        key = 'TotalViolentCrime';
    } if (currentFilter == "murder") {
        key = 'TotalMurder';
    } if (currentFilter == "rapeRevised") {
        key = 'TotalRapeRevised';
    } if (currentFilter == "rapeLegacy") {
        key = 'TotalRapeLegacy';
    } if (currentFilter == "robbery") {
        key = 'TotalRobbery';
    } if (currentFilter == "aggravatedAssault") {
        key = 'TotalAggravatedAssault';
    } if (currentFilter == "propertyCrime") {
        key = 'TotalPropertyCrime';
    } if (currentFilter == "burglary") {
        key = 'TotalBurglary';
    } if (currentFilter == "larcenyTheft") {
        key = 'TotalLarcenyTheft';
    } if (currentFilter == "motorVehicleTheft") {
        key = 'TotalMotorVehicleTheft';
    } if (currentFilter == "arson") {
        key = 'TotalArson';
    }

    var extent = d3.extent(crimeData, function(d) {
        if(showTotalData) {
            if(showAll) {
                return parseInt(d.TotalCrimes);
            } else {
                return parseInt(d[key]);
            }
        } else {
            if(showAll) {
                var studentPerCrime = 1/d.CrimesPerStudent;
                if(isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                    studentPerCrime = 0;
                }
                return studentPerCrime;
            } else {
                var studentPerCrime = 1/(d[key]/d.TotalStudents);
                if(isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                    studentPerCrime = 0;
                }
                return studentPerCrime;
            }
        }
    });

    var colorScaler;

    if(showTotalData) {
        colorScaler = d3.scaleLinear()
            .domain(extent)
            .range(["white", "#9E150F"]);
    } else {
        console.log(extent)
        colorScaler = d3.scaleLinear()
            .domain(extent)
            .range(["#9E150F", "white"]);
    }

    if(zoomed) {
        crimeData.forEach( function(crimeDataForState) {
            d3.select("#map svg").select("#" + crimeDataForState.State.replace(/ /g,''))
                .transition()
                .style("fill", "white");
        });

        // Color the selected state
        d3.select("#"+clickedState.properties.name.replace(/ /g,''))
            .transition()
            .style("fill", "#D9DFD1");
    } else {
        if(showTotalData) {
            crimeData.forEach( function(crimeDataForState) {
                if (showAll) {
                    d3.select("#map svg").select("#" + crimeDataForState.State.replace(/ /g,''))
                        .transition()
                        .style("fill",  colorScaler(parseInt(crimeDataForState.TotalCrimes)));
                } else {
                    d3.select("#map svg").select("#" + crimeDataForState.State.replace(/ /g,''))
                        .transition()
                        .style("fill", colorScaler(parseInt(crimeDataForState[key])));
                }
            });
        } else {
            crimeData.forEach( function(crimeDataForState) {
                if (showAll) {
                    var studentPerCrime = 1/crimeDataForState.CrimesPerStudent;
                    if(isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                        studentPerCrime = 0;
                    }
                    d3.select("#map svg").select("#" + crimeDataForState.State.replace(/ /g,''))
                        .transition()
                        .style("fill", function(d) {
                            if(studentPerCrime == 0) {
                                return "white";
                            } else {
                                return colorScaler(studentPerCrime)
                            }
                        });
                } else {
                    var perStudentValue = crimeDataForState[key]/crimeDataForState.TotalStudents;
                    perStudentValue = 1/perStudentValue;
                    console.log(1/perStudentValue);
                    if(isNaN(perStudentValue)) {
                        perStudentValue = 0;
                    }

                    d3.select("#map svg").select("#"+crimeDataForState.State.replace(/ /g,''))
                        .transition()
                        .style("fill", function(d) {
                            if(perStudentValue == 0) {
                                return "white";
                            } else {
                                return colorScaler(perStudentValue)
                            }
                        })
                    ;
                }
            });
        }
    }

}

function createMap() {

    // US State JSON data downloaded from: https://gist.githubusercontent.com/michellechandra/0b2ce4923dc9b5809922/raw/a476b9098ba0244718b496697c5b350460d32f99/us-states.json
    // I reuploaded under a GIST I created (just in case it's removed from the source for whatever reason)

    d3.json("https://gist.githubusercontent.com/philigoe/3ffb4f3f79da3d6bfdb072f23fdbc0fe/raw/462abe11fc9f42e48685fcf475de5ff0b6c60bfa/us-states.json", function(error, us) {
        usaProjection = d3.geoAlbersUsa()
            .fitSize([width,height], us);

        path = d3.geoPath()
            .projection(usaProjection);

        var titleDiv = d3.select("#titleContainer");
        var titleSvg = titleDiv.append("svg")
            .attr("width", width)
            .attr("height", 25);

        var div = d3.select("#map");
        var svg = div.append("svg")
            .attr("width", width)
            .attr("height", height);

        var legendDiv = d3.select("#legendContainer");
        var legendSvg = legendDiv.append("svg")
            .attr("width", 110)
            .attr("height", 225);

        stateTooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("width", "200px")
            .style("height", "70px")
            .style("padding", "5px")
            .style("background-color", "black")
            .style("visibility", "hidden");

        svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(us.features)
            .enter().append("path")
            .attr("d", path)
            .style("stroke", "black")
            .style("stroke-width", "0.2")
            .style("fill", "white")
            .style("cursor", "pointer")
            .attr("id", function(d) { return d.properties.name.replace(/ /g,''); })
            .on("click", clicked)
            .on("mouseover", function(d) {
                if(crimeData && !zoomed) {
                    var stateName = d.properties.name;
                    var returnedCrimeData = crimeData.find(function (i) {
                        return (i.State == stateName);
                    });

                    var crimeText = '';

                    if (showTotalData) {
                        crimeText = 'Total';
                        if (showAll) {
                            crimeText += ' all crimes: ' + parseInt((returnedCrimeData.TotalCrimes)).toLocaleString('en-US');
                        } else {
                            crimeText += ' ' + $("#crimeFilterDropdown option:selected").text() + ': ' + (returnedCrimeData[key]).toLocaleString('en-US');

                        }
                    } else {


                        if (showAll) {
                            studentPerCrime = 1 / returnedCrimeData.CrimesPerStudent;
                            if (isNaN(studentPerCrime) || !isFinite(studentPerCrime)) {
                                studentPerCrime = 0;
                            }

                            crimeText = Math.round(studentPerCrime).toLocaleString('en-US') + " students for every crime";
                            //crimeText = 'all crimes: '+ returnedCrimeData.CrimesPerStudent;
                        } else {
                            var perCrimeValue = 1 / (returnedCrimeData[key] / returnedCrimeData.TotalStudents);
                            if (isNaN(perCrimeValue) || !isFinite(perCrimeValue)) {
                                perCrimeValue = 0;
                            }

                            crimeText = (Math.round(perCrimeValue).toLocaleString('en-US')) + ' students for every ' + $("#crimeFilterDropdown option:selected").text();
                            //crimeText = 'for '+$("#crimeFilterDropdown option:selected").text()+': '+ (Math.round(perCrimeValue)) +' students per crime';
                        }

                    }

                    stateTooltip.html("<b style='color:white'>" + d.properties.name + "</b><br><p style='color:white'>" + crimeText + "</p>");
                    return stateTooltip.style("visibility", "visible");
                } else {
                    return stateTooltip.style("visibility", "hidden");
                }
            })
            .on("mousemove", function(){return stateTooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
            .on("mouseout", function(){return stateTooltip.style("visibility", "hidden");});

        svg.append("g")
            .attr("class", "stateSpecificData");

        schoolToolTip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("width", "200px")
            .style("height", "140px")
            .style("padding", "5px")
            .style("background-color", "black")
            .style("visibility", "hidden");

        // Create the legend

        // I learned how to do gradients here: https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient.html
        // They had some great example code, which I incorporated here and built off of / modified
        var linearGradient = svg.append("linearGradient")
            .attr("id", "linear-gradient");
        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "white"); // White
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#9E150F"); // Red

        var legendGroup = legendSvg.append("g")
            .attr("class","legend");

        legendGroup.append("rect")
            .attr("width", 200)
            .attr("height", 20)
            .attr('transform', 'translate(5,220)rotate(-90)')
            .style("fill", "url(#linear-gradient)")
            .style("stroke", "black");

        // Add legend text
        var mostCrime = legendGroup.append("g")
            .attr("class", "title")
            .append("text")
            .attr("x", 65)
            .attr("y", 23.5)
            .style("font", "15px open-sans")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("- Most Crime");

        var leastCrime = legendGroup.append("g")
            .attr("class", "title")
            .append("text")
            .attr("x", 65)
            .attr("y", 223.5)
            .style("font", "15px open-sans")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("- Least Crime");

        svg.append("g")
            .attr("class", "barchart")
            .attr("transform", "translate(100, 75)")
            .style("visible", "hidden");

        chartToolTip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("width", "200px")
            .style("height", "75px")
            .style("padding", "5px")
            .style("background-color", "black")
            .style("visibility", "hidden");

        titleSvg.append("text")
            .attr("class", "titleText")
            .attr("x", (width / 2))
            .attr("y", 20)
            .style("font", "30px open-sans")
            .style("text-anchor", "middle")
            .text("Country View - USA");


        d3.csv("https://gist.githubusercontent.com/philigoe/a96a9b3cf374bb9b60cd939afd89906d/raw/f68ff431e2d532a111fb8e4eb570d71b902b1ad9/2015-aggregated-state-data.csv", function(error, loadedCrimeData) {
            d3.csv("https://gist.githubusercontent.com/philigoe/3d39d8586dfb79743f065ae4f9b49250/raw/17cec665f96f043e099b39c97da9913facc8ec69/all-college-data.csv", function(error, allData) {
                crimeData = loadedCrimeData;
                allCollegesData = allData;
                filterMap();
            });
        });
    });
}

// As mentioned before, for the zoom logic, I looked at this block: https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
// and saw how to do it. I used that code as a foundation, and built upon it. I did some pretty big motifications here for the
// zoomed, reset, and clicked functions
function zoomed() {
    d3.select(".states").attr("transform", d3.event.transform); // updated for d3 v4
    d3.select("g.stateSpecificData").attr("transform", d3.event.transform);
}

function reset() {
    d3.select("svg").transition()
        .duration(750)
        .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
    zoomed = false;
    filterMap();

    d3.select(".titleText")
        .transition()
        .text("Country View - USA");
}

function clicked(d) {
    clickedState = d;
    currentActive = d3.select("#"+d.properties.name.replace(/ /g,''));//d3.select(this).classed("active", true);
    if(!zoomed && !lookingAtChart) {
        // zoom in
        currentActive.classed("active", true);
        var bounds = path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
            translate = [width / 2 - scale * x, height / 2 - scale * y];
        d3.select("svg").transition()
            .duration(750)
            // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
            .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
        zoomed = true;

        currentState = d;

        filterMap();
        addStateSpecificData();

        // Show the top rankings list
        d3.select("#rankingsList")
            .transition()
            .style("opacity", 1);

    } else if(!lookingAtChart) {
        // we gotta zoom back out
        currentActive.classed("active", false);
        removeAllStateSpecificData();
        reset();

        // Hide the top rankings list
        d3.select("#rankingsList")
            .transition()
            .style("opacity", 0);

    }
    if(active) {
        active.classed("active", false);
    }
    active = currentActive;
}

var currentState;

function updateRankingsListForState(data) {
    console.log(currentState.properties.name);
    $("#currentStateName").text(currentState.properties.name);

    console.log(data);

    var showTotalData = true;
    if($('#crimesPerStudentCheckbox').is(':checked')) {
        showTotalData = false;
    }

    var currentFilter = $("#crimeFilterDropdown").val();

    var showAll = true;
    key = null;

    if(currentFilter != "all") {
        showAll = false;
    } if (currentFilter == "violentCrime") {
        key = 'ViolentCrime';
    } if (currentFilter == "murder") {
        key = 'Murder';
    } if (currentFilter == "rapeRevised") {
        key = 'Rape(revised)';
    } if (currentFilter == "rapeLegacy") {
        key = 'Rape(legacy)';
    } if (currentFilter == "robbery") {
        key = 'Robbery';
    } if (currentFilter == "aggravatedAssault") {
        key = 'AggravatedAssault';
    } if (currentFilter == "propertyCrime") {
        key = 'PropertyCrime';
    } if (currentFilter == "burglary") {
        key = 'Burglary';
    } if (currentFilter == "larcenyTheft") {
        key = 'LarcenyTheft';
    } if (currentFilter == "motorVehicleTheft") {
        key = 'MotorVehicleTheft';
    } if (currentFilter == "arson") {
        key = 'Arson';
    }

    var headerText = '';

    // Let's sort according to the filters
    var sortedData = data.sort(function(a, b) {
        var aValue, bValue;
        if(showTotalData) {
            if (showAll) {
                headerText = "Total Crime";
                aValue = calculateTotalCrimeForSchool(a);
                bValue = calculateTotalCrimeForSchool(b);
            } else {
                headerText = key;
                aValue = parseInt(a[key]);
                bValue = parseInt(b[key]);
            }
        } else {
            var aTotalCrime = calculateTotalCrimeForSchool(a);
            var aStudents = parseInt(a.StudentEnrollment);
            var aStudentPerCrime = 1 / (aTotalCrime / aStudents);
            if (isNaN(aStudentPerCrime) || !isFinite(aStudentPerCrime)) {
                aStudentPerCrime = 0;
            }

            var bTotalCrime = calculateTotalCrimeForSchool(b);
            var bStudents = parseInt(b.StudentEnrollment);
            var bStudentPerCrime = 1 / (bTotalCrime / bStudents);
            if (isNaN(bStudentPerCrime) || !isFinite(bStudentPerCrime)) {
                bStudentPerCrime = 0;
            }

            if (showAll) {
                headerText = "SPC";
                if(aStudentPerCrime == 0) {
                    aStudentPerCrime = Infinity;
                }
                if(bStudentPerCrime == 0) {
                    bStudentPerCrime = Infinity;
                }
                aValue = aStudentPerCrime;
                bValue = bStudentPerCrime;
            } else {
                headerText = "SPC - "+key;
                var aPerStudentValue = 1 / (parseInt(a[key]) / aStudents);
                var bPerStudentValue = 1 / (parseInt(b[key]) / bStudents);
                if (isNaN(aPerStudentValue)) {
                    aPerStudentValue = 0;
                }
                if (isNaN(bPerStudentValue)) {
                    bPerStudentValue = 0;
                }

                if(aPerStudentValue == 0) {
                    aPerStudentValue = Infinity;
                }
                if(bPerStudentValue == 0) {
                    bPerStudentValue = Infinity;
                }

                aValue = aPerStudentValue;
                bValue = bPerStudentValue;
            }
        }

        // We set the value to show for future use (when displaying in the table, this saves us from
        // having to recompute the same value twice)
        a.ValueToShow = aValue.toFixed(2);
        b.ValueToShow = bValue.toFixed(2);

        if(showTotalData) {
            if (aValue < bValue) {
                return 1;
            }
            if (aValue > bValue) {
                return -1;
            }
        } else {
            if (aValue < bValue) {
                return -1;
            }
            if (aValue > bValue) {
                return 1;
            }
        }


        // else they're equal....
        return 0;
    });

    $("#tableCrimeTypeHeader").text(headerText);

    $("#listOfSchools").empty();
    sortedData.forEach(function(item, index) {
       $("#listOfSchools").append("<tr><td>"+(index+1)
           +"</td><td>"+item['University/College']
           +" "+item['Campus']+"</td><td>"
            +item.ValueToShow+"</td></tr>")
    });

    // Now, scroll this table back to the top
    $("tbody").animate({
        scrollTop: 0
    }, 'slow');
}

function addStateSpecificData() {
    // Hide the state tooltip
    stateTooltip.style("visibility", "hidden");

    // Update the title text to reflect looking at this state
    d3.select(".titleText")
        .transition()
        .text("State View - "+clickedState.properties.name);

    currentSelectedStateData = allCollegesData.filter(function(d) {
        if(d.State.replace(/ /g,'').toLowerCase() == clickedState.properties.name.replace(/ /g,'').toLowerCase()) {
            return d;
        }
    });

    d3.select("g.stateSpecificData")
        .selectAll("circle")
        .remove();

    d3.select("g.stateSpecificData")
        .selectAll("circle")
        .data(currentSelectedStateData)
        .enter().append("circle")
        .attr("id", function(d) {
            return getIDFromSchool(d);
        })
        .attr("cx", function(d) {
            var coordinates = [d.Longitude, d.Latitude];
            var projectedCoordinates = usaProjection(coordinates);
            if(projectedCoordinates) {
                return projectedCoordinates[0];
            } else {
                return 0;
            }

        })
        .attr("cy", function(d) {
            var coordinates = [d.Longitude, d.Latitude];
            var projectedCoordinates = usaProjection(coordinates);
            if(projectedCoordinates) {
                return projectedCoordinates[1];
            } else {
                return 0;
            }
        })
        .attr("r", function(d) {
            return 1;
        })
        .style("cursor", "pointer")
        .on("mouseover", function(d) {
            if(zoomed) {
                var crimeText;

                var returnedCrimeData = currentSelectedStateData.find(function (i) {
                    return (getIDFromSchool(i) == getIDFromSchool(d));
                });

                var totalCrimes = calculateTotalCrimeForSchool(returnedCrimeData);
                //console.log(returnedCrimeData);
                if (showTotalData) {
                    crimeText = 'Total';
                    if (showAll) {
                        crimeText += ' all crimes: ' + parseInt((totalCrimes)).toLocaleString('en-US');
                    } else {
                        crimeText += ' ' + $("#crimeFilterDropdown option:selected").text() + ': ' + (returnedCrimeData[key]).toLocaleString('en-US');

                    }
                } else {
                    if (showAll) {
                        var perStudentValue = parseInt(returnedCrimeData.StudentEnrollment)/totalCrimes;

                        if (isNaN(perStudentValue) || !isFinite(perStudentValue)) {
                            perStudentValue = 0;
                        }

                        crimeText = (Math.round(perStudentValue * 100) / 100).toLocaleString('en-US') + " students for every crime";
                    } else {
                        var perStudentValue = parseInt(returnedCrimeData.StudentEnrollment) / parseInt(returnedCrimeData[key]);
                        if (isNaN(perStudentValue) || !isFinite(perStudentValue)) {
                            perStudentValue = 0;
                        }

                        crimeText = (Math.round(perStudentValue * 100) / 100).toLocaleString('en-US') + ' students for every ' + $("#crimeFilterDropdown option:selected").text();
                    }

                }


                schoolToolTip.html("<b style='color:white'>" + d["University/College"] + "</b><br><b style='color:white'>" + d["Campus"] + "</b><br> <p style='color:white'>" + crimeText + "</p>");
                schoolToolTip.style("opacity", "0.7");

                return schoolToolTip.style("visibility", "visible");



            } else {
                return schoolToolTip.style("visibility", "hidden");
            }
        })
        .on("mousemove", function(){return schoolToolTip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
        .on("mouseout", function(){return schoolToolTip.style("visibility", "hidden");})
        .on("click", clickedOnCollege);

    filterSchools();

}

function removeAllStateSpecificData() {
    d3.select("g.stateSpecificData")
        .selectAll("circle")
        .remove();
}

function clickedOnCollege(d) {
    /*
    d3.select("g.states")
        .transition()
        .style("visibility", "hidden");

    d3.select("g.stateSpecificData")
        .transition()
        .style("visibility", "hidden");
*/
    d3.select("g.legend")
        .transition()
        .style("opacity", 1);

    d3.select("g.barchart")
        .attr("class", "barchart")
        .style("visibility", "visible");

    d3.select("#filterControls")
        .transition()
        .style("opacity", 0);

    d3.select("#rankingsList")
        .transition()
        .style("opacity", 0);

    chartCollege(d);
}

var lookingAtChart = false;
function chartCollege(college) {

    lookingAtChart = true;

    // Hide the college tooltip
    schoolToolTip.style("visibility", "hidden");

    d3.select(".titleText")
        .transition()
        .text("College View - "+college["University/College"]+" "+college["Campus"]);

    // Remove any previous bar chart artifacts
    d3.select(".barchart").selectAll("*").remove();

    var dataToChart = [
        {Type: "Violent Crime", Value: parseInt(college["ViolentCrime"])},
        {Type: "Murder", Value: parseInt(college["Murder"])},
        {Type: "Rape( revised)", Value: parseInt(college["Rape(revised)"])},
        {Type: "Rape (legacy)", Value: parseInt(college["Rape(legacy)"])},
        {Type: "Robbery", Value: parseInt(college["Robbery"])},
        {Type: "Assault", Value: parseInt(college["AggravatedAssault"])},
        {Type: "Property Crime", Value: parseInt(college["PropertyCrime"])},
        {Type: "Burglary", Value: parseInt(college["Burglary"])},
        {Type: "Larceny", Value: parseInt(college["LarcenyTheft"])},
        {Type: "Vehicle Theft", Value: parseInt(college["MotorVehicleTheft"])},
        {Type: "Arson", Value: parseInt(college["Arson"])}
    ];

    var yExtent = d3.extent(dataToChart, function(d) {
        return d.Value;
    });

    var colorScaler = d3.scaleLinear()
        .domain(yExtent)
        .range(["white", "#9E150F"]);

    var chartHeight = height - 200,
        chartWidth = width - 50;

    var yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([chartHeight,0]);

    var xScale = d3.scaleBand()
        .domain(dataToChart.map(function(d) { return d.Type}))
        .range([0, chartWidth]);

    d3.select(".barchart").append("rect")
        .attr("x", -75)
        .attr("y", -20)
        .attr("width", chartWidth + 25)
        .attr("height", chartHeight + 100)
        .style("fill", "white")
        .style("stroke", "black")
        .style("opacity", 0.8);

    d3.select(".barchart")
        .selectAll("rect")
        .data(dataToChart)
        .enter().append("rect")
        .attr("x", function(d) { return (xScale(d.Type) + 30); })
        .attr("y", function(d) {
            return yScale(d.Value)
        })
        .attr("width",  10 )
        .attr("height", function(d) { return chartHeight - yScale(d.Value) })
        .style("fill", function(d) {
            return colorScaler(d.Value);
        })
        .style("stroke", "black")
        .on("mouseover", function(d) {
            if (lookingAtChart) {
                console.log(d);

                chartToolTip.html("<b style='color:white'>Crime: " + d["Type"] + "</b><br><b style='color:white'>Number of crimes: " + d["Value"] + "</b>");
                chartToolTip.style("opacity", "0.7");
                return chartToolTip.style("visibility", "visible");

            } else {
                return chartToolTip.style("visibility", "hidden");
            }
        })
        .on("mousemove", function(){return chartToolTip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
        .on("mouseout", function(){return chartToolTip.style("visibility", "hidden");});

    var xAxis = d3.axisBottom(xScale);
    d3.select(".barchart")
        .append("g")
        .attr("transform", "translate(0, "+(chartHeight)+")")
        .call(xAxis);
    d3.select(".barchart").append("text")
        .attr("x", (chartWidth / 2) - 50)
        .attr("y", chartHeight+50)
        .style("text-anchor", "middle")
        .text("Type of Crime");

    var yAxis = d3.axisLeft(yScale);

    d3.select(".barchart").append("g")
        .call(yAxis);

    d3.select(".barchart").append("text")
        .attr("x", -200)
        .attr("y", -60)
        .attr("transform", "rotate(-90)")
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Crimes");

    // Adding in back button
    d3.select(".barchart")
        .append('rect')
        .attr("x", "-72")
        .attr("y", "0")
        .attr("width", "45")
        .style("cursor", "pointer")
        .attr("height", 50)
        .style("fill", "grey")
        .on('click', backToMap);

    d3.select(".barchart").append("text")
        .attr("x", "-58")
        .attr("y", "0")
        .attr("dy", "1.5em")
        .style("font-size", "20px")
        .style("text-anchor", "right")
        .style("cursor", "pointer")
        .style("fill", "white")
        .text("X")
        .on('click', backToMap);

}

function backToMap() {
    lookingAtChart = false;

    d3.select("g.states")
        .transition()
        .style("visibility", "visible");

    d3.select("g.stateSpecificData")
        .transition()
        .style("visibility", "visible");

    d3.select("g.legend")
        .transition()
        .style("opacity", 1);

    d3.select("g.barchart")
        .style("visibility", "hidden");

    d3.select(".titleText")
        .transition()
        .text("State View - "+clickedState.properties.name);

    d3.select("#filterControls")
        .transition()
        .style("opacity", 1);

    d3.select("#rankingsList")
        .transition()
        .style("opacity", 1);
}

window.onload = function() {
    createMap();

    $("#totalCrimesCheckbox").change(function() {
        if(!this.checked) {
            $('#totalCrimesCheckbox').prop('checked', true);
        } else {
            $('#crimesPerStudentCheckbox').prop('checked', false);
            if(zoomed == false) {
                filterMap();
            } else {
                filterSchools();
            }

        }
    });
    $('#totalCrimesCheckbox').prop('checked', true);

    $("#crimesPerStudentCheckbox").change(function() {
        if(!this.checked) {
            $('#crimesPerStudentCheckbox').prop('checked', true);

        } else {
            $('#totalCrimesCheckbox').prop('checked', false);
            if(zoomed == false) {
                filterMap();
            } else {
                filterSchools();
            }
        }
    });

    $("#crimeFilterDropdown").on('change', function() {
        if(zoomed == false) {
            filterMap();
        } else {
            filterSchools();
        }
    });
}