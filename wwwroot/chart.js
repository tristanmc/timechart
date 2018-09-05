$(function() {

/*
PLOT TYPES:
1) time interval
2) timestamp of event
3) timestamp w/ infrequent measurement
4) timestamp w/ frequent measurement
*/

addAxisTime();
//addViz('interval');
addViz('event');
addViz('infreq');
addViz('freq');

//---------------------
// TIME AXIS 
//---------------------

function addAxisTime () {
  const axis = d3.axisTop(getScaleTime());
  addSVG('axis').call(axis);
}

//---------------------
// PLOTS (INITIAL) 
//---------------------

function addViz (plot_type, data) {
  const svg = addSVG(plot_type);
  if (!data) data = getData()[plot_type];
  //const data = getData()[plot_type];

  switch (plot_type) {
    case 'interval':
      plotIntervals(svg, data);
      break;
    case 'event':
      plotEvents(svg, data);
      break;
    case 'infreq':
      plotInfreq(svg, data);
      break;
    case 'freq':
      plotFreq(svg, data);
      break;
    default:
      alert('incorrect plot type');
  }
}

function plotIntervals (selection, data) {
  selection.selectAll('rect')
           .data(data)
           .enter()
           .append('rect')
           .attr('class', 'interval')
           .attr('x', d => getScaleTime()(d.on))
           .attr('y', 0)
           .attr('height', getHeight('interval'))
           .attr('width', d => getScaleTime()(d.off) - getScaleTime()(d.on));
}

function plotEvents (selection, data) {
  selection.selectAll('line')
           .data(data)
           .enter()
           .append('line')
           .attr('class', 'event')
           .attr('x1', d => getScaleTime()(d))
           .attr('x2', d => getScaleTime()(d))
           .attr('y1', 0)
           .attr('y2', getHeight('event'));
}

function plotInfreq (selection, data) {
  const params = {
    data,
    scale_y: getScaleY(data, 'infreq'),
    plot_type: 'infreq'
  };

  addAxisY(selection, params);
  plotLine(selection, params);
  plotCircles(selection, params);
}

function plotFreq (selection, data) {
  const params = {
    data,
    scale_y: getScaleY(data, 'freq'),
    plot_type: 'freq'
  };

  addAxisY(selection, params);
  plotLine(selection, params);
}

function addAxisY (selection, params) {
  const width = getWidth();

  const axis_y = d3.axisLeft(params.scale_y)
                   .ticks(5)
                   .tickSizeInner(width)   
                   .tickSizeOuter(0);

  // extend ticks across plot to aid in discerning data values, ref[0]
  selection.append('g')
           .attr('class', 'axis')
           .attr('transform', `translate(${width}, 0)`)
           .call(axis_y);

  // remove axis domain to minimize chart junk
  selection.select('.domain')
           .remove();
}

function plotCircles (selection, params) {
  selection.append('g')
           .selectAll('circle')
           .data(params.data)
           .enter()
           .append('circle')
           .attr('class', `circle_${params.plot_type}`)
           .attr('cx', d => getScaleTime()(d.date_time))
           .attr('cy', d => params.scale_y(d.ob))
           .attr('r', '5');
           //.style('fill', 'red');
}

function plotLine (selection, params) {
  const line = d3.line()
                 .x(d => getScaleTime()(d.date_time))
                 .y(d => params.scale_y(d.ob));

  selection.append('g')
           .append('path')
           .attr('class', `line_${params.plot_type}`)
           .datum(params.data)
           .attr('d', line);
}

//---------------------
// PLOTS (ZOOM) 
//---------------------

function plotIntervalsZoom (zoom_scale) {
  d3.selectAll('.interval')
    .attr('x', d => zoom_scale(d.on))
    .attr('width', d => zoom_scale(d.off) - zoom_scale(d.on));
}

function plotEventsZoom (zoom_scale) {
  d3.selectAll('.event')
    .attr('x1', d => zoom_scale(d))
    .attr('x2', d => zoom_scale(d));
}

function plotInfreqZoom (zoom_scale) {
  plotLineZoom(zoom_scale, 'infreq');
  plotCirclesZoom(zoom_scale, 'infreq');
}

function plotFreqZoom (zoom_scale) {
  plotLineZoom(zoom_scale, 'freq');
}

function plotCirclesZoom (zoom_scale, plot_type) {
  d3.selectAll(`.circle_${plot_type}`)
    .attr('cx', d => zoom_scale(d.date_time));
}

function plotLineZoom (zoom_scale, plot_type) {
  const data = d3.select(`.line_${plot_type}`).datum();
  const scale_y = getScaleY(data, `${plot_type}`);

  const line_zoom = d3.line()
                      .x(d => zoom_scale(d.date_time))
                      .y(d => scale_y(d.ob));

  d3.select(`.line_${plot_type}`)
    .attr('d', line_zoom);
}

//---------------------
// SVG + DIMENSIONS 
//---------------------

function addSVG (plot_type) {
  const height = getHeight(plot_type);
  const width = getWidth();
  const margin = getMargins(plot_type);

  const svg = d3.select('#container')
                .append('svg')
                .attr('id', `svg_${plot_type}`);

  // clipping mask so that viz does not extend into y-axis during zoom, ref[1]
  if (plot_type !== 'axis') {
    svg.append('defs')
       .append('clipPath')
       .attr('id', `clip_${plot_type}`)
       .append('rect')
       .attr('height', height + margin.verticle)
       .attr('width', width)
       .attr('transform', `translate(0, -${margin.top})`);
  }

  return (
    svg.attr('height', height + margin.verticle)
       .attr('width', width + margin.horizontal)
       .call(
         d3.zoom()
           .scaleExtent([1, 10])
           .on('zoom', zoomed)
       )
       .append('g')
       .attr('transform', `translate(${margin.left}, ${margin.top})`)
       .attr('class', `g_${plot_type}`)
  );
}

function getHeight (svg_type) {
  let height;

  // svg height excluding margins
  switch (svg_type) {
    case 'axis':
      height = 10;
      break;
    case 'interval':
      height = 5;
      break;
    case 'event':
      height = 20;
      break;
    case 'infreq':
      height = 75;
      break;
    case 'freq':
      height = 75;
      break;
    default:
      height = 20;
  }
return height;
}

function getWidth () {
  return 550;
}

// margin convention, ref[2]
function getMargins (svg_type) {
  return {
    top: svg_type === 'axis' ? 20 : 10, 
    bottom: 10,
    right: 20, 
    left: 100,
    get verticle () { return this.top + this.bottom; },
    get horizontal () { return this.left + this.right; }
  };
}

//---------------------
// ZOOM 
//---------------------

function zoomed () {
  const transform_svg = d3.zoomTransform(this);

  // re-scale time axis, ref[3]
  const zoom_scale = transform_svg.rescaleX(getScaleTime());

  // transition axis
  d3.select('.g_axis')
    .transition()
    .duration(50)
    .call(
      d3.axisTop(getScaleTime())
        .scale(zoom_scale)
    );


  // update viz w/ re-scaled axis;
  plotIntervalsZoom(zoom_scale);
  plotEventsZoom(zoom_scale);
  plotInfreqZoom(zoom_scale);
  plotFreqZoom(zoom_scale);

  // apply zoom state to all SVGs
  // (states stored on the element to which the zoom is applied rather 
  // than globally to allow for independent zoom of elements - ref[4]; however 
  // coordinated states are needed here, without which jumping occurs when 
  // zooming in on one plot and out on another)
  d3.selectAll('svg')
    .call(
      d3.zoom().transform,
      transform_svg 
    );
}

//---------------------
// SCALES 
//---------------------

function getScaleTime () {
  const date_extent = [
    getDateExtent().start, 
    getDateExtent().end
  ];

  return (
    d3.scaleTime()
      .domain(date_extent)
      .range([0, getWidth()])
  );
}

function getScaleY (data, plot_type) {
  const height = getHeight(plot_type);

  return (
    d3.scaleLinear()
      .domain(d3.extent(data, d => d.ob))
      .range([height, 0])
  );
}

//---------------------
// MOCK DATA 
//---------------------

// start/end dates
function getDateExtent () { 
  return {
    start: new Date(2017, 4, 1), 
      end: new Date(2017, 4, 15) 
  };
}

// date-time interval
function getDataInterval () {
  const days = d3.range(1, 16);
  const data = days.map(day => {
                     return { 
                        on: new Date(2017, 4, day, 7), 
                       off: new Date(2017, 4, day, 22) 
                     };
                   })
                   .filter(date_time => {
                     return date_time.on  <= getDateExtent().end && 
                            date_time.off <= getDateExtent().end;
                   });
  return data;
}

// date-time of event
function getDataEvent () {
  const days = d3.range(1, 16);
  const hours = d3.range(0, 24, 8);

  const data = d3.cross(days, hours, (day, hour) => {
                   return new Date(2017, 4, day, hour);
                 })
                 .filter(date_time => {
                   return date_time <= getDateExtent().end;
                 });
  return data;
}

// date-time of infrequent observations
function getDataInfreq () {
  const obs = [0.5, 0.75, 3, 4, 10, 11, 15, 17];
  const data = obs.map((ob, i) => {
                     return { 
                       date_time: new Date(2017, 4, (i + 1) * 2 , 9), 
                       ob: ob 
                     };
                  })
                  .filter(obs => {
                    return obs.date_time <= getDateExtent().end;
                  });
  return data;
}

// date-time of frequent observations
function getDataFreq () {
  const data = d3.timeMinute
                 .every(60)
                 .range(
                   getDateExtent().start,
                   getDateExtent().end
                 )
                 .map((date_time, i) => {
                   return { 
                     date_time: date_time,
                     ob: -Math.log(Math.random() * (i + 1)) 
                   };
                 });
  return data;
}

function getData () {
  return {
    interval: getDataInterval(),
    event: getDataEvent(),
    infreq: getDataInfreq(),
    freq: getDataFreq()
  };
}

/*
REFERENCES
[0] https://bl.ocks.org/mbostock/3371592
[1] https://bl.ocks.org/mbostock/431a331294d2b5ddd33f947cf4c81319
[2] https://bl.ocks.org/mbostock/3019563
[3] https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f
[4] https://github.com/d3/d3-zoom/blob/master/README.md#zoom-transforms
*/


    "use strict";

    console.log('Hubbing ...')
    
    var connection = new signalR.HubConnectionBuilder().withUrl("/dataHub").build();
    
    connection.on("ReceiveMessage", function (user, data) {
        
        //addAxisTime();
        //addViz('interval', );
        //addViz('event');
        //addViz('infreq');
        //addViz('freq');
        
        const days = d3.range(1, 16);
        const d = days.map(day => {
                     return { 
                        on: new Date(2017, 4, day, 7), 
                       off: new Date(2017, 4, day, 22) 
                     };
                   })
                   .filter(date_time => {
                     return date_time.on  <= getDateExtent().end && 
                            date_time.off <= getDateExtent().end;
                   });


        // console.log(d[0]);

        addViz('interval');

        //var svg = d3.select('svg');
        //plotIntervals(svg, d1);
    });
    
    
    
    connection.start().catch(function (err) {
        return console.error(err.toString());
    });
    
});


