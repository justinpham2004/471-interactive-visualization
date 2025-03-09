// Verify script is working
console.log('Script loaded successfully!');
/* Why: Immediate feedback in console */
window.addEventListener('load', init);


const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // d3.schemeSet2 is a set of predefined colors. ]
//Consider using this for our own personal data
const t = 1000;
//const options = [super_opeid	name	par_income_bin	par_income_lab	attend	stderr_attend	attend_level	attend_sat	stderr_attend_sat	attend_level_sat	rel_apply	stderr_rel_apply	rel_attend	stderr_rel_attend	rel_att_cond_app	rel_apply_sat	stderr_rel_apply_sat	rel_attend_sat	stderr_rel_attend_sat	rel_att_cond_app_sat]
let allData = []
let xScale, yScale, sizeScale
let xVar = 'par_income_bin', yVar = 'attend_level_sat', sizeVar = 'attend', schoolVar = 'Ivy Plus'
let tiers = new Set()

const options = [
    //"super_opeid",
    //"name",
    "par_income_bin",
    //"par_income_lab",
    "attend",
    //"stderr_attend",
    "attend_level",
    "attend_sat",
    //"stderr_attend_sat",
    //"attend_level_sat",
    "rel_apply",
    //"stderr_rel_apply",
    "rel_attend",
    //"stderr_rel_attend",
    "rel_att_cond_app",
    //"public",
    //"flagship",
    //"tier",
    //"tier_name",
    //"test_band_tier"
];

function init() {
    d3.csv('data/CollegeAdmissions_Data.csv',
        d => ({

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


            
        })
    )
    //callback function
    .then(data => {

        data.forEach(d => {
            tiers.add(d.tier); // Replace 'tier_name' with the attribute you're interested in
        });
        
        console.log(data)
        allData = data
        //build vis and listeners
        setupSelector()     
        updateAxes()
        updateVis()
        //addLegend()
    })
    .catch(error => console.error('Error loading data:', error));
    console.log(tiers)
}


function setupSelector(){
    // Handles UI changes (sliders, dropdowns)
    //Slider

    //Selecting options for the dropdown
    d3.selectAll('.variable')
        .each(function(){
            d3.select(this).selectAll('myOptions')
            .data(options)
            .enter()
            .append('option')
            .text(d => d)
            .attr("value", d => d)
        })
    
    d3.selectAll('.schoolVar')
    .each(function(){
        d3.select(this).selectAll('myOptions')
        .data(Array.from(tiers))
        .enter()
        .append('option')
        .text(d => d)
        .attr("value", d => d)
    })
    d3.select('#xVariable').property('value', xVar)
    d3.select('#yVariable').property('value', yVar)
    //d3.select('#sizeVariable').property('value', sizeVar)
    d3.select('#schoolVariable').property('value', schoolVar)
    
    
    //Detecting Changes:
    d3.selectAll('.variable')
    .each(function() {
        // ... Loop over each dropdown button
    })
    .on("change", function (event) {
        // Placeholder: we’ll change xVar, yVar, or sizeVar here
        console.log(d3.select(this).property("id")) // Logs which dropdown (e.g., xVariable)
        console.log(d3.select(this).property("value")) // Logs the selected value
        if(d3.select(this).property("id") == "xVariable") {
            xVar = d3.select(this).property("value")
        } else if (d3.select(this).property("id") == "yVariable") {
            yVar = d3.select(this).property("value")
        } /*else if (d3.select(this).property("id") == "sizeVariable") {
            sizeVar = d3.select(this).property("value")
        } */



        updateAxes(); 
        updateVis();
    })

    d3.selectAll('.schoolVar')
    .each(function() {
        // ... Loop over each dropdown button
    })
    .on("change", function (event) {
        schoolVar = d3.select(this).property("value")
        updateAxes(); 
        updateVis();
    })
   
   
  }
  
function updateAxes(){
     //Graph
     svg.selectAll('.axis').remove()
     svg.selectAll('.labels').remove()
     xScale = d3.scaleLinear()
        .domain([0,d3.max(allData, d => d[xVar])])
        .range([0, width]);
    const xAxis = d3.axisBottom(xScale)

    svg.append('g')
        .attr('class','axis')
        .attr("transform",`translate(0,${height})`)
        .call(xAxis);
    
        
    // Your turn: Create the y-axis using the same approach.
    // Use d3.scaleLinear() again.
    // Adjust .domain(), .range(), and the .attr("transform", ...) to position it on the left.
    yScale = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d[yVar])])
        .range([height, 0]);
    const yAxis = d3.axisLeft(yScale)

    svg.append('g')
        .attr('class','axis')
        .attr("transform", `translate(0, 0)`)
        .call(yAxis);
    
    sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(allData, d => d[sizeVar])]) // Largest bubble = largest data point 
        .range([5, 20]); // Feel free to tweak these values if you want bigger or smaller bubbles

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(xVar) // Displays the current x-axis variable
        .attr('class', 'labels')
    
    // Y-axis label (rotated)
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(yVar) // Displays the current y-axis variable
        .attr('class', 'labels')
}


function addLegend(){
    let size = 10

    /*
    svg.selectAll('continentSquare')
        .data(continents)
        .enter()
        .append('rect')
        .attr("width", size)
        .attr("height", size)
        .attr("y", -margin.top/2) 
        .attr("x", (d, i) => i * (size + 100) + 100)  
        .style("fill", d => colorScale(d))
        

    svg.selectAll("continentName")
        .data(continents)
        .enter()
        .append("text")
        .attr("y", -margin.top/2 + size) // Align vertically with the square
        .attr("x", (d, i) => i * (size + 100) + 120)  
        .style("fill", d => colorScale(d))  // Match text color to the square
        .text(d => d) // The actual continent name
        .attr("text-anchor", "left")
        .style('font-size', '13px')
        */
}


function updateVis(){
    let currentData = allData.filter(d => d.tier == schoolVar)

    svg.selectAll('.points')
        // Why use d => d.country as the key?
        // Because each country is unique in the dataset for the current year. 
        // This helps D3 know which bubbles to keep, update, or remove.
        .data(currentData, d => d.name)
        .join(
            function(enter){
                return enter
                .append('circle')
                .attr('class', 'points')
                .attr('cx', d => xScale(d[xVar])) // Position on x-axis
                .attr('cy', d => yScale(d[yVar])) // Position on y-axis
                .style('fill', d => colorScale(d.name)) // Assign colors
                .style('opacity', .5) // Slight transparency for 
                .on('mouseover', function (event, d) {
                    console.log(d) // See the data point in the console for debugging
                    d3.select('#tooltip')
                    .style("display", 'block') // Make the tooltip visible
                    .html( // Change the html content of the <div> directly
                    `<strong>${d.name}</strong><br/>
                    Type: ${d.public}`)
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 28) + "px");
                    // placeholder: show it and fill it with our data value
                    d3.select(this) // Refers to the hovered circle
                        .style('stroke', 'black')
                        .style('stroke-width', '4px')
                })
                .on("mouseout", function (event, d) {
                    d3.select('#tooltip')
                        .style('display', 'none') // Hide tooltip when cursor leaves
                    d3.select(this) // Refers to the hovered circle
                        .style('stroke-width', '0px')
                    //placeholder: hide it
                }) 
                .transition(t)
                .attr('r',  d => sizeScale(d[sizeVar]))
                // Apply continent colors
                //better visibility
            },
            function(update){
                return update
                .transition(t)
                .attr('cx', d => xScale(d[xVar]))
                .attr('cy', d => yScale(d[yVar]))
                .attr('r',  d => sizeScale(d[sizeVar]))
                
            },
            function(exit){
                exit.transition(t)
                .attr('r',0)
                .remove()
            }
    
        )
}


// Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);



    



    //Add y axis label “count”

