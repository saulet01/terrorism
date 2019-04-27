// ------- Quiz Block Section -------
$('.test_div').addClass('animation_quiz')
$("input[type='radio']").click(function(){
  $("#isil").addClass('is-valid')
  $("#al_qaeda").addClass('is-invalid')
  $("#boko_haram").addClass('is-invalid')
  $("#ltte").addClass('is-invalid')
  $("#taliban").addClass('is-invalid')
  $("input[type='radio']").prop("disabled", true)
  $('.bubble_chart').addClass('animation_section');
  $('.note_organization').addClass('note_animation');
});

// Adapted from: https://github.com/inorganik/CountUp.js
// ------- CountUp.js -------
var c4 = new CountUp("count_number", 1970, 2017, 0, 7,{
  useEasing: false
});
c4.start();

var c5 = new CountUp("count_number_2", 1970, 2017, 0, 7,{
  useEasing: false
});
c5.start();

// Adapted from: https://github.com/mattboldt/typed.js/
// ------- Typed.js -------
var typed = new Typed('#typed',{
    strings: ['Guess, which is the deadliest terrorist organization in the world today?'],
    typeSpeed: 40
  });
$(".typed-cursor").css("font-size","35px")

// ------- Data Wrangle for Terrorist Organizations -------
d3.csv('data/organization.csv', wrangleData)
function wrangleData(data){
  data.forEach( d => {
    d.nkill = +d.nkill;
    d.nwound = +d.nwound;
    d.iyear = +d.iyear;
  });

  // Wrangle Data According to Timeline
  // Inspired from: Information Visualization: Programming with D3.js (Coursera) - https://www.coursera.org/learn/information-visualization-programming-d3js
  let line_chart_data = data.reduce((line_chart_data, d) => {
    let data_action = line_chart_data[d.iyear] || {
      "Year": d.iyear,
      "Count": 0,
      "Victims": d.nkill + d.nwound
    }
    data_action.Count += 1
    data_action.Victims += d.nkill + d.nwound
    line_chart_data[d.iyear] = data_action
    return line_chart_data
  }, {})

  line_chart_data = Object.keys(line_chart_data).map(key => line_chart_data[key])
  create_lineChart(line_chart_data)

  let result = data.reduce((result, d) => {

    let organization = result[d.gname] || {
      "Organization": d.gname,
      "Dead": parseInt(d.nkill),
      "Wound": d.nwound,
      "Total": d.nkill + d.nwound,
      "Count": 0
    }
    organization.Count += 1
    organization.Dead += d.nkill
    organization.Wound += d.nwound
    organization.Total += d.nkill + d.nwound
    result[d.gname] = organization
    return result
  }, {})

  // Wrangle Data According to Organization
  // Inspired from: Information Visualization: Programming with D3.js (Coursera) - https://www.coursera.org/learn/information-visualization-programming-d3js
  result = Object.keys(result).map(key => result[key])
  result.sort((a, b) => {
    return d3.descending(a.Total, b.Total)
  });
  let terorist_organizations = result.filter( (d, i) => { return d.Organization != "Unknown" && i <= 25});
  createVisualization(terorist_organizations)
}

function create_lineChart(data){
  let margin_line = {left: 50, bottom: 50}
  let width_line = 600 - margin_line.left
  let height_line = 500 - margin_line.bottom;
  let svg = d3.select("#line_chart_count").append("svg")
      .attr("width", width_line + margin_line.left)
      .attr("height", height_line + margin_line.bottom)

  let svg2 = d3.select("#line_chart_victims").append("svg")
      .attr("width", width_line + margin_line.left)
      .attr("height", height_line + margin_line.bottom)

  let yScale = d3.scaleLinear()
                 .domain([0, d3.max(data, d => d.Count)])
                 .range([height_line, 0])

  let yScale2 = d3.scaleLinear()
                 .domain([0, d3.max(data, d => d.Victims)])
                 .range([height_line, 0])
  svg.append("g")
     .call(d3.axisLeft(yScale))
     .attr("transform", "translate(50,0)")
     .attr("class", "text_y")

 svg2.append("g")
    .call(d3.axisLeft(yScale2))
    .attr("transform", "translate(50,0)")
    .attr("class", "text_y")

  let xCale = d3.scaleLinear()
                .domain(d3.extent(data, d => d.Year))
                .range([0, width_line])

  svg.append("g")
     .call(d3.axisBottom(xCale).tickFormat(d3.format('.0f')))
     .attr("transform", "translate(50," + height_line + ")")
     .attr("class", "text_axis")

  svg2.append("g")
      .call(d3.axisBottom(xCale).tickFormat(d3.format('.0f')))
      .attr("transform", "translate(50," + height_line + ")")
      .attr("class", "text_axis")

  let area_scale = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.Count)])
          .range([height_line, 0]);

  let area_scale2 = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.Victims)])
          .range([height_line, 0]);

  let area_generator = d3.area()
                         .x((d,i) => {
                           return i * (width_line / data.length)
                         })
                         .y0(height_line)
                         .y1(function(d){
                           return area_scale(d.Count)
                         });

   let area_generator2 = d3.area()
                          .x((d,i) => {
                            return i * (width_line / data.length)
                          })
                          .y0(height_line)
                          .y1(function(d){
                            return area_scale2(d.Victims)
                          });
   svg.append("path")
      .datum(data)
      .attr("d", area_generator)
      .attr("class", "area_chart")
      .attr("transform", "translate(50, 0)")
      .style("stroke-dasharray", 4000)
      .style("stroke-dashoffset", 4000)
      .style("animation", "animate_line 35s ease-out forwards, area 2s 8.5s ease-out forwards")

   svg2.append("path")
       .datum(data)
       .attr("d", area_generator2)
       .attr("class", "area_chart")
       .attr("transform", "translate(50, 0)")
       .style("stroke-dasharray", 4000)
       .style("stroke-dashoffset", 4000)
       .style("animation", "animate_line 35s ease-out forwards, area 2s 10.2s ease-out forwards")
}

function createVisualization(data){
  let width = 740;
  let height = 500;
  let rad3 = 50;

  let svg = d3.select(".bubble_chart").append("svg")
      .attr("class", "bubble_visualization")
      .attr("width", width)
      .attr("height", height)
      .append("g")


  let radScale = d3.scaleLog().domain(d3.extent(data, d => d.Total)).range([30, 75])
  let textScale = d3.scaleLog().domain(d3.extent(data, d => d.Total)).range([7, 18])

  data.forEach(function(d){
    d.radius = radScale(d.Total)
  });

  let simulation = d3.forceSimulation(data)
                     .force('charge', d3.forceManyBody().strength(100))
                     .force('center', d3.forceCenter(width / 2.2, height / 2))
                     .force('collision', d3.forceCollide().radius(d => d.radius))
                     .on('tick', ticked);

  function ticked(){
    // Adapted from: https://d3indepth.com/force-layout/
    let bubbleChart = svg.selectAll("circle")
                         .data(data)
    bubbleChart.enter()
               .append("circle")
               .attr("r", d => d.radius)
               .merge(bubbleChart)
               .attr("cx", d => d.x = Math.max(rad3, Math.min(width - rad3, d.x)))
               .attr("cy", d => d.y = Math.max(rad3, Math.min(height - rad3, d.y)))
               .attr("class", "bubble2")
               .call(d3.drag()
               // Adapted from: Interactive Data Visualization for the Web, 2nd Edition: Chapter 13. 08_force_draggable.html
               .on('start', (d) => {
                 if (!d3.event.active) simulation.alphaTarget(0.2).restart();
                 d.fx = d.x;
                 d.fy = d.y;
               })
               .on('drag', (d) => {
                 d.fx = d3.event.x;
                 d.fy = d3.event.y;
               })
               .on('end', (d) => {
                 if (!d3.event.active) simulation.alphaTarget(0);
                 d.fx = null;
                 d.fy = null;
               }))
               .on('click', function(){
                 $('.detail-information').modal('toggle')
                 let selectedCircle = d3.select(this).datum();
                 Modal_Organizations(selectedCircle);
               });

  // ------- Modal Content -------
   function Modal_Organizations(selectedCircle){
     terror_group.map(d => {
       if(selectedCircle.Organization == d.Name){
         // Adapted from: https://github.com/inorganik/CountUp.js
         // ------- CountUp.js -------
         var c1 = new CountUp("died2", 0, selectedCircle.Dead);
         c1.start();
         var c2 = new CountUp("wounded2", 0, selectedCircle.Wound);
         c2.start();
         var c3 = new CountUp("attacked2", 0, selectedCircle.Count);
         c3.start();
         d3.select('#organization_name').text(`${d.Name}`);
         d3.select('#active_time').text(`${d.Active}`);
         d3.select('#ideology_teror').text(`${d.Ideology}`);
         d3.select('#source_link').text(`https://en.wikipedia.org/wiki/${d.Name}`).attr("href", `${d.Source}`)
         d3.select('#summary-description').text(`${d.Summary}`);
         d3.select('#photo_terror').attr("src", `img/group/${d.Name}.png`).attr("alt", `${d.Name}`)
       }
     })
   };

   let circleTooltip = svg.selectAll("circle")
              .attr("data-toggle", "tooltip")
              .attr("data-html", "true")
              .attr("data-placement", "top")
              .attr("title", d => `Dead: ${d.Dead} </br> Wounded: ${d.Wound} </br> Number of Terrorist Attacks: ${d.Count} </br></br> <small><strong><em>Click to get more information</em</strong><small>`)

    $(function (){
      $('[data-toggle="tooltip"]').tooltip()
    });


    let textElements = svg.selectAll("foreignObject")
                         .data(data)

    textElements.enter()
                .append("foreignObject")
                .attr("width",  d => (2 * d.radius * Math.cos(Math.PI / 4)))
                .attr("height",  d => (2 * d.radius * Math.cos(Math.PI / 4)))
                .attr("class", "foreign_circle")
                .append("xhtml:p")
                .attr("class", "paragraph_circle")
                .html(d => d.Organization)
                .merge(textElements)
                .attr("x", d => d.x - (2 * d.radius * Math.cos(Math.PI / 4)/2))
                .attr("y", d => d.y - (2 * d.radius * Math.cos(Math.PI / 4)/2))
                .attr("font-size", d => textScale(d.Total))
  }
}
