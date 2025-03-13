// Verify script is working
console.log('Script loaded successfully!');

// Listen for the window load event
window.addEventListener('load', init);

// Margin and dimensions
const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Color scale
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Transition duration (ms)
const t = 1000;

// Global data and scales
let allData = [];
let xScale, yScale, sizeScale;
let xVar = 'par_income_bin', 
    yVar = 'attend_level_sat', 
    sizeVar = 'attend', 
    schoolVar = 'Ivy Plus',
    specificSchool = 'American University';

let tiers = new Set();
let schools = new Set();
let selected_schools = new Set()

// List of possible variables for x and y dropdowns
const options = [
    "par_income_bin",
    "attend",
    "attend_level",
    "attend_sat",
    "rel_apply",
    "rel_attend",
    "rel_att_cond_app"
];

const desc_labels = { 
    "par_income_bin": "Parental Income Level",
    "attend" : "Attendance Rate",
    "attend_level" : "Normalized Attendance Rate",
    "attend_sat" : "Attendance by SAT",
    "rel_apply" : "Relative Applications",
    "rel_attend": "Relative Attendance",
    "rel_att_cond_app": "Conditional Application"}


// Create an SVG
const svg = d3.select('#vis')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const svg2 = d3.select('#vis')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);


function init() {
  // Load CSV data
  d3.csv('data/CollegeAdmissions_Data.csv', d => ({
    name: d.name,
    par_income_bin: +d.par_income_bin,
    par_income_lab: +d.par_income_lab,
    attend: +d.attend,
    attend_level: +d.attend_level,
    attend_sat: +d.attend_sat,
    attend_level_sat: +d.attend_level_sat,
    rel_apply: +d.rel_apply,
    rel_attend: +d.rel_attend,
    rel_att_cond_app: +d.rel_att_cond_app,
    rel_apply_sat: +d.rel_apply_sat,
    rel_attend_sat: +d.rel_attend_sat,
    rel_att_cond_app_sat: +d.rel_att_cond_app_sat,
    public: d.public,
    flagship: d.flagship,
    tier: d.tier,
    tier_name: d.tier_name,
    test_band_tier: d.test_band_tier
  }))
  .then(data => {
    // Collect unique tiers
    data.forEach(d => {
      tiers.add(d.tier);
      schools.add(d.name)
    });
    console.log('Loaded Data:', data);

    // Store data globally
    allData = data;
    sortedSchools = Array.from(schools)
    sortedSchools.sort()
    console.log(schools)
    // Setup dropdown selectors, axes, visualization
    setupSelector();
    updateAxes();
    updateVis();

    updateAxes2();
    updateVis2();
  })
  .catch(error => console.error('Error loading data:', error));
}


function setupSelector() {
  // For each dropdown with class 'variable', populate with `options`
  d3.selectAll('.variable')
    .each(function(){
      d3.select(this).selectAll('option')
        .data(options)
        .enter()
        .append('option')
        .text(d => desc_labels[d])
        .attr("value", d => d);
    });

  // For the school type dropdown, populate with unique tiers
  d3.selectAll('.schoolVar')
    .each(function(){
      d3.select(this).selectAll('option')
        .data(Array.from(tiers))
        .enter()
        .append('option')
        .text(d => d)
        .attr("value", d => d);
    });

  
  // Set the default values
  d3.select('#xVariable').property('value', xVar);
  d3.select('#yVariable').property('value', yVar);
  d3.select('#schoolVariable').property('value', schoolVar);
  d3.select('#specificSchools').property('value',specificSchool)

  // Detect changes in x or y dropdown
  d3.selectAll('.variable')
    .on("change", function (event) {
      const id = d3.select(this).property("id");
      const val = d3.select(this).property("value");
      if (id === "xVariable") {
        xVar = val;
      } else if (id === "yVariable") {
        yVar = val;
      }
      updateAxes();
      updateVis();
      
      updateAxes2();
      updateVis2();
    });

  // Detect changes in school type dropdown
  d3.selectAll('.schoolVar')
    .on("change", function (event) {
      schoolVar = d3.select(this).property("value");
      updateAxes();
      updateVis();

      updateAxes2();
      updateVis2();
    });

    
  d3.select('#specificSchools')
    .on("change", function (event) {
      specificSchool = d3.select(this).property("value");
      updateAxes();
      updateVis();
      updateVis2();
      console.log(specificSchool)
    });
    
}


function updateAxes() {
  // Remove old axes and labels
  svg.selectAll('.axis').remove();
  svg.selectAll('.labels').remove();

  // X Scale
  xScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d[xVar])])
    .range([0, width]);
  const xAxis = d3.axisBottom(xScale);

  svg.append('g')
    .attr('class','axis x-axis')
    .attr("transform",`translate(0,${height})`)
    .call(xAxis);

  // Y Scale
  yScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d[yVar])])
    .range([height, 0]);
  const yAxis = d3.axisLeft(yScale);

  svg.append('g')
    .attr('class','axis y-axis')
    .call(yAxis);

  // Size Scale (for bubble radius)
  sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(allData, d => d[sizeVar])])
    .range([5, 20]);

  // X-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .text(xVar)
    .attr('class', 'labels');

  // Y-axis label (rotated)
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .text(yVar)
    .attr('class', 'labels');
}

function updateAxes2() {
  // Remove old axes and labels
  svg2.selectAll('.axis').remove();
  svg2.selectAll('.labels').remove();

  /*
  // X Scale
  xScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d[xVar])])
    .range([0, width]);
  const xAxis = d3.axisBottom(xScale); */
  
  xScale2 = d3.scaleBand()
  .domain(allData.map(d => d[xVar]))  // Set domain to the unique categories in xVar
  .range([0, width])  // Range corresponds to the width of the chart
  .padding(0.05);  // Optional: Adds padding between bars

  // Create the x axis based on the band scale
  const xAxis2 = d3.axisBottom(xScale2)
    .tickSize(0);

  svg2.append('g')
    .attr('class','axis x-axis')
    .attr("transform",`translate(0,${height})`)
    .call(xAxis2);

  // Y Scale
  yScale2 = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d[yVar])])
    .range([height, 0]);
  const yAxis2 = d3.axisLeft(yScale2);

  svg2.append('g')
    .attr('class','axis y-axis')
    .call(yAxis2);

  // Size Scale (for bubble radius)
  sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(allData, d => d[sizeVar])])
    .range([5, 20]);

  // X-axis label
  svg2.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .text(xVar)
    .attr('class', 'labels');

  // Y-axis label (rotated)
  svg2.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .text(yVar)
    .attr('class', 'labels');
}





// ------------- UPDATE VISUALIZATION (SCATTERPLOT) ------------- //
function updateVis() {
  // Filter the dataset by selected tier
  let currentData = allData.filter(d => d.tier === schoolVar)
  let school_names = new Set()
  
  currentData.forEach(d => {
    school_names.add(d.name); // Assuming the school name is stored in `school_name`
  });

  console.log(school_names)
  
  d3.selectAll('.specificSchools')
  .each(function(){
    d3.select(this).selectAll('option').remove()
    d3.select(this).selectAll('option')
      .data(Array.from(school_names))
      .enter()
      .append('option')
      .text(d => d)
      .attr("value", d => d)
    });
  
  // Join data to circles
  svg.selectAll('.points')
    .data(currentData, d => d.name)
    .join(
      enter => enter
        .append('circle')
        .attr('class', 'points')
        .attr('cx', d => xScale(d[xVar]))
        .attr('cy', d => yScale(d[yVar]))
        .style('fill', d => colorScale(d.name))
        .style('opacity', 0.5)
        .on('mouseover', function (event, d) {
          d3.select('#tooltip')
            .style("display", 'block')
            .html(`
              <strong>${d.name}</strong><br/>
              Value: ${d.public}
            `)
            // position tooltip near mouse pointer
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY - 28) + "px");

          d3.select(this)
            .style('stroke', 'black')
            .style('stroke-width', '4px');
        })
        .on('mouseout', function (event, d) {
          d3.select('#tooltip')
            .style('display', 'none');
          d3.select(this)
            .style('stroke-width', '0px');
        })
        .transition()
        .duration(t)
        .attr('r', d => sizeScale(d[sizeVar])),

      update => update
        .transition()
        .duration(t)
        .attr('cx', d => xScale(d[xVar]))
        .attr('cy', d => yScale(d[yVar]))
        .attr('r', d => sizeScale(d[sizeVar])),

      exit => exit
        .transition()
        .duration(t)
        .attr('r', 0)
        .remove()
    );
  
  
  svg.selectAll('.points')
    .style('stroke', d => {
    // Apply a black stroke only to the specific point
    console.log(specificSchool)
    return d.name == specificSchool ? 'black' : 'none';  // Replace with the name you want to highlight
  })
  .style('stroke-width', d => {
    // Apply a thicker stroke width for the specific point
    return d.name == specificSchool ? '2px' : '0px';  // Adjust stroke width for highlighting
  }); 
    
}

function updateVis2() {
  let currentData = allData.filter(d => d.name === specificSchool)
  console.log(specificSchool + "highlighted")
  d3.select('#specificSchools').property('value',specificSchool)

  svg2.selectAll('.points')
  .data(currentData, d => d.name)
  .join(
    enter => enter
      .append('rect')
      .attr('class', 'points')
      .attr('x', d => xScale2(d[xVar]))  // Set the x position of the bar
      .attr('y', d => yScale2(d[yVar]))  // Set the y position of the bar (based on yScale)
      .attr('width', xScale2.bandwidth())  // Set the width of each bar
      .attr('height', d => height - yScale2(d[yVar]))  // Set the height of the bar based on yScale
      .style('fill', d => colorScale(d.name))  // Set the color of the bar
      .style('opacity', 0.7)
      .on('mouseover', function (event, d) {
        d3.select('#tooltip')
          .style("display", 'block')
          .html(`
            <strong>${d.name}</strong><br/>
            Income: ${d.par_income_bin}
            <br/>
            Relative Attendance: ${d.rel_attend}
          `)
          // Position tooltip near mouse pointer
          .style("left", (event.pageX + 20) + "px")
          .style("top", (event.pageY - 28) + "px");

        d3.select(this)
          .style('stroke', 'black')
          .style('stroke-width', '4px');
      })
      .on('mouseout', function (event, d) {
        d3.select('#tooltip')
          .style('display', 'none');
        d3.select(this)
          .style('stroke-width', '0px');
      })
      .transition()
      .duration(t)
      .attr('height', d => height - yScale2(d[yVar])),  // Smooth transition for height

    update => update
      .transition()
      .duration(t)
      .attr('x', d => xScale2(d[xVar]))  // Update x position
      .attr('y', d => yScale2(d[yVar]))  // Update y position
      .attr('width', xScale2.bandwidth())  // Maintain width of bars
      .attr('height', d => height - yScale2(d[yVar]))  // Update height of bars
      .transition()

    , exit => exit
      .transition()
      .duration(t)
      .attr('height', 0)  // Shrink the height of bars on exit
      .remove()  // Remove the bars that exit
  );
  /*
  svg2.selectAll('.points')
    .data(currentData, d => d.name)
    .join(
      enter => enter
        .append('circle')
        .attr('class', 'points')
        .attr('cx', d => xScale(d[xVar]))
        .attr('cy', d => yScale(d[yVar]))
        .style('fill', d => colorScale(d.name))
        .style('opacity', 0.5)
        .on('mouseover', function (event, d) {
          d3.select('#tooltip')
            .style("display", 'block')
            .html(`
              <strong>${d.name}</strong><br/>
              Type: ${d.public}
            `)
            // position tooltip near mouse pointer
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY - 28) + "px");

          d3.select(this)
            .style('stroke', 'black')
            .style('stroke-width', '4px');
        })
        .on('mouseout', function (event, d) {
          d3.select('#tooltip')
            .style('display', 'none');
          d3.select(this)
            .style('stroke-width', '0px');
        })
        .transition()
        .duration(t)
        .attr('r', d => sizeScale(d[sizeVar])),

      update => update
        .transition()
        .duration(t)
        .attr('cx', d => xScale(d[xVar]))
        .attr('cy', d => yScale(d[yVar]))
        .attr('r', d => sizeScale(d[sizeVar])),

      exit => exit
        .transition()
        .duration(t)
        .attr('r', 0)
        .remove()
    );
    */
}


