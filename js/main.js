let width = 1400,
    height = 800,
    active = d3.select(null);

let countryNames = "";
let given_country;

const zoom = d3.zoom()
    .scaleExtent([1.5, 40])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

let svg = d3.select("#worldMap").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", stopped, true);
    // .call(zoom);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

const g = svg.append("g");

let projection = d3.geoMercator()
    .scale(200)
    .translate([width / 2.2, height / 1.7]);

let path = d3.geoPath()
    .projection(projection);

var dragSlider = document.getElementById('drag');
var nodes = [
    document.getElementById('lower-value'), // 0
    document.getElementById('upper-value')  // 1
];

// --------------- Initiate Bar Chart (Scale) ---------------
var marginBar = {top: 40, right: 10, bottom: 60, left: 130};
let svgBarWidth = 1100 - marginBar.left - marginBar.right,
    svgBarHeight = 400  - marginBar.top - marginBar.bottom;

var svgBar = d3.select("#barChart").append("svg")
               .attr("width", svgBarWidth + marginBar.left + marginBar.right)
               .attr("height", svgBarHeight + marginBar.top + marginBar.bottom)
               .append("g")
               .attr("transform", "translate(" + marginBar.left + "," + marginBar.top + ")");

var x = d3.scaleBand()
          .rangeRound([0, svgBarWidth])
	        .paddingInner(0.15);

var y = d3.scaleLinear()
         .range([svgBarHeight, 0]);

let yAxis = d3.axisLeft().scale(y);
let xAxis = d3.axisBottom().scale(x);

let yAxisGroup = svgBar.append("g")
                   .attr("class", "y-axis axis")

let xAxisGroup = svgBar.append("g")
                   .attr("class", "x-axis axis")

// Load data parallel
queue()
    .defer(d3.csv, "data/attack_more_than_3.csv")
    .defer(d3.json, "data/topojson.json")
    // Adapted from: https://blockbuilder.org/abrahamdu/50147e692857054c2bf88c443946e8a5
    .defer(d3.csv, "data/world-country-names.csv") // <- See https://blockbuilder.org/abrahamdu/50147e692857054c2bf88c443946e8a5
    .await(createVisualization);

function getCountryName(o) {
    for (let i = 0; i < countryNames.length; i++) {
      if (countryNames[i].id === +o.id)
          return countryNames[i].name;
    }
    console.log("ERROR");
}

/*
  ****** Modal of Country ******
 */
function modal_country(name, count, dead, wounded){

  // Toggle Modal
  $('.country_information').modal('show')

  $('#country_name').text(name);
  $('#country_attack').text(`Number of attack: ${count}`);
  $('#country_dead').text(`Dead: ${dead}`);
  $('#country_wounded').text(`Wounded: ${wounded}`);
}

function clicked(d) {
    let country = getCountryName(d);

    given_country.map(d => {
      if(d.Name === country){
        modal_country(d.Name, d.Count, d.Dead, d.Wound);
      }
    })

    if (active.node() === this) return reset();
    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    svg.transition()
        .duration(750)
        // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
        .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
}

function reset() {
    active.classed("active", false);
    active = d3.select(null);

    svg.transition()
        .duration(750)
        // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
        .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
}

function zoomed() {
    g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
    g.attr("transform", d3.event.transform); // updated for d3 v4
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}


function createVisualization(error, data_attack, world, countryData) {
    // hide loader
    let div = document.getElementById("loader");
    div.style.display = "none";

    countryNames = countryData;

    // process attack data
    for (let i = 0; i < data_attack.length; i++) {
        data_attack[i].nkill = +data_attack[i].nkill;
        data_attack[i].nwound = +data_attack[i].nwound;
    }

    for(let i = 0; i < countryNames.length; i++) {
        countryNames[i].id = +countryNames[i].id;
    }

    let minYear = d3.min(data_attack, d => d.iyear);
    let maxYear = d3.max(data_attack, d => d.iyear);

    // Adapted from: https://github.com/leongersen/noUiSlider/
    // ------- noUiSlider.js -------
    noUiSlider.create(dragSlider, {
        start: [+minYear, +maxYear],
        behaviour: 'drag',
        connect: true,
        tooltips: true,
        range: {
            'min': +minYear,
            'max': +maxYear
        },
        step: 1
    });

    nodes[0].innerHTML = +minYear;
    nodes[1].innerHTML = +maxYear;
    let updatedData = data_attack.filter(d => {
        return d.iyear >= parseInt(minYear) && d.iyear <= parseInt(maxYear)
    });

    // country zoom referenced: Adapted from: https://bl.ocks.org/piwodlaiwo/90777c94b0cd9b6543d9dfb8b5aefeef
    g.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "feature")
        .on("click", clicked);

    g.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "mesh")
        .attr("d", path);

    updateVisualization(updatedData);

    dragSlider.noUiSlider.on('change', function (values, handle) {
        nodes[0].innerHTML = parseInt(values[0]);
        nodes[1].innerHTML = parseInt(values[1]);

        let updatedData = data_attack.filter(d => {
            return d.iyear >= parseInt(values[0]) && d.iyear <= parseInt(values[1])
        });


        updateVisualization(updatedData);
    });
}

function updateVisualization(updatedData) {
    // console.log(updatedData);
    updatedData.sort((a, b) => (b.nkill + b.nwound) - (a.nkill + a.nwound));
    let maxCasualties = updatedData[0].nkill + updatedData[0].nwound;
    let minCasulaties = updatedData[updatedData.length-1].nkill + updatedData[updatedData.length-1].nwound;

    // Wrangle Data According to country
    // Inspired from: Information Visualization: Programming with D3.js (Coursera) - https://www.coursera.org/learn/information-visualization-programming-d3js
    given_country = updatedData.reduce((given_country, d) => {
      let country_filtering = given_country[d.country_txt] || {
        "Name": d.country_txt,
        "Count": 0,
        "Dead": d.nkill,
        "Wound": d.nwound
      }
      country_filtering.Count += 1
      country_filtering.Dead += d.nkill
      country_filtering.Wound += d.nwound
      given_country[d.country_txt] = country_filtering
      return given_country
    }, {})

    given_country = Object.keys(given_country).map(key => given_country[key])
    console.log(given_country);

    // color scale
    const colorScale = d3.scaleLog()
        .domain([minCasulaties, maxCasualties])
        .range(['#fcffbe', '#ae0000']);

    const scale = d3.scaleLinear()
        .domain([minCasulaties, updatedData[0].nkill + updatedData[0].nwound])
        .range([2, 20]);

    g.selectAll("circle").remove();
    g.selectAll("circle")
        .data(updatedData)
        .enter()
        .append("circle")
        // .transition()
        // .delay(function(d, i) {
        //     return i;
        // })
        // .duration(1000)
        .attr("r", function (d) {
            return scale(d.nkill + d.nwound);
        })
        .attr("fill", function (d) {
            return colorScale(d.nkill + d.nwound);
        })
        .attr('opacity', 0.6)
        .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
        .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
        .attr("data-toggle", "tooltip")
        .attr("data-html", "true")
        .attr("title", d => `Location: ${d.city}, ${d.country_txt} <br /><br /> <small><strong>Click to the circle to get more information</strong></small>`)
        .on('click', function(){
          // --------------- Modal ---------------
          $('.detail-information').modal('toggle')
          let selectedCircle = d3.select(this).datum();
          ModalToggle(selectedCircle);
        })

        function ModalToggle(selectedCircle){
          let random_number = Math.floor(Math.random() * 7) + 1;
          d3.select('#wounded').text(`${selectedCircle.nwound}`);
          d3.select('#organization-terror').text(`${selectedCircle.gname}`);
          d3.select('#location1').text(`${selectedCircle.city}, ${selectedCircle.country_txt}`);
          d3.select('#attack-type').text(`${selectedCircle.attacktype1_txt}`);
          d3.select('#target-type').text(`${selectedCircle.targtype1_txt}`);
          d3.select('#summary-description').text(`${selectedCircle.summary}`);
          d3.select('#image_terror').attr('src', `img/attacks/${random_number}.jpeg`);
          // Adapted from: https://github.com/inorganik/CountUp.js
          // ------- CountUp.js -------
          var c1 = new CountUp("died2", 0, selectedCircle.nkill);
          c1.start();
          var c2 = new CountUp("wounded2", 0, selectedCircle.nwound);
          c2.start();
        };

    // --------------- Legend ---------------
    var linear = d3.scaleLinear()
        .domain([minCasulaties, maxCasualties])
        .range(['#fcffbe', '#ae0000']);

    let legendG = svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(50,450)");

    legendG.append("text")
        .attr("y" , -15)
        .text("Casualties");

    var legendLinear = d3.legendColor()
        .shapeWidth(20)
        .orient('vertical')
        .scale(linear);

    svg.select(".legendLinear")
        .call(legendLinear);

    // --------------- Bar Chart ---------------
    let data_bar = updatedData.filter( (d, i) => i <= 10)
    data_bar.forEach( d => {
      d.sumKilled = parseInt(d.nkill) + parseInt(d.nwound);
      d.location = `${d.city}, ${d.country_txt}`;
    });
    let maxBar = data_bar[0].nkill + data_bar[0].nwound;
    let minBar = data_bar[data_bar.length-1].nkill + data_bar[data_bar.length-1].nwound;
    x.domain(data_bar.map( d => d.location))
    y.domain([0, maxBar])

    let chart = svgBar.selectAll("rect")
                      .data(data_bar)
                      .enter()
                      .append("rect")

    chart.attr("x", function(d) { return x(d.location); })
         .attr("width", x.bandwidth())
         .attr("y", y(0))
         .transition()
         .duration(1400)
         .attr("y", function(d) { return y(d.sumKilled); })
         .attr("width", x.bandwidth())
         .attr("height", function(d) { return svgBarHeight - y(d.sumKilled); })
         .attr("data-toggle", "tooltip")
         .attr("data-html", "true")
         .attr("title", d => `<small><strong>Click to get more information</strong></small>`)
         .attr("class", "bar")

     chart.on('click', function(){
           // --------------- Modal ---------------
           $('.detail-information').modal('toggle')
           let selectedCircle = d3.select(this).datum();
           ModalToggle(selectedCircle);
         })
     // Toggle Tooltip
     $(function () {
       $('[data-toggle="tooltip"]').tooltip()
     })
     svgBar.append("text")
           .attr("x", -290)
           .attr("y", -70)
           .text("Sum number of died and wounded people")
           .attr("fill", "#F16868")
           .attr("class", "bar_legend")

     svgBar.select(".y-axis")
        .transition()
        .duration(1200)
        .call(yAxis)
        .attr("transform", "translate(-10,0)")

     svgBar.select(".x-axis")
        .transition()
        .duration(1200)
        .call(xAxis)
        .attr("transform", "translate(0," + svgBarHeight + ")")
}
