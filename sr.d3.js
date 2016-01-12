var sr = sr || {};

(function() {
"use strict";

/////////////////////////////////////////
////////////// Event types //////////////
/////////////////////////////////////////
var EMPTY_EVENTS = [];
var COMMON_EVENTS = EMPTY_EVENTS;
var COORDINATE_CHART_EVENTS = [
    "axisLabelClicked"
];
var IMAGE_MAP_EVENTS = EMPTY_EVENTS;

/////////////////////////////////////////
/////////////// Functions ///////////////
/////////////////////////////////////////
sr.format = function(type, formatString) {
    switch (type) {
        case "number":
            return d3.format(formatString);
            break;
        case "time":
            return d3.time.format(formatString);
            break;
        default:
            return d3.format(formatString);
    }
};

sr.scale = function(type, options) {
    switch (type) {
        case "identity":
            return d3.scale.identity()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "linear":
            return d3.scale.linear()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "log":
            return d3.scale.log()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "pow":
            return d3.scale.pow()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "ordinal":
            return d3.scale.ordinal()
                           .domain(options.domain)
                           .range(options.range)
                           .rangePoints(options.rangePoints);
            break;
        case "quantile":
            return d3.scale.quantile()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "quantize":
            return d3.scale.quantize()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "sqrt":
            return d3.scale.sqrt()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "threshold":
            return d3.scale.threshold()
                           .domain(options.domain)
                           .range(options.range);
            break;
        case "time":
            return d3.time.scale()
                          .domain(options.domain)
                          .range(options.range);
            break;
        default:
            return d3.scale.linear()
                           .domain(options.domain)
                           .range(options.range);
    }
};

function createD3Axis(scale, ticks, tickFormat, tickValues, tickPadding, tickSize, orient) {
    var multiTickValues = (Array.isArray(tickValues) &&
                          (tickValues.length > 0) &&
                           tickValues.every(function(currentValue) {
                               return Array.isArray(currentValue);
                           }));

    if (Array.isArray(scale)) {
        var axes = [];
        scale.forEach(function(currentValue, index) {
            axes.push(d3.svg.axis()
                            .orient(Array.isArray(orient) ? orient[index] : orient)
                            .scale(currentValue)
                            .ticks(Array.isArray(ticks) ? ticks[index] : ticks)
                            .tickFormat(Array.isArray(tickFormat) ? tickFormat[index] : tickFormat)
                            .tickPadding(Array.isArray(tickPadding) ? tickPadding[index] : tickPadding)
                            .tickSize(Array.isArray(tickSize) ? tickSize[index] : tickSize)
                            .tickValues(multiTickValues ? tickValues[index] : tickValues));
        });
        return axes;
    } else {
        return d3.svg.axis()
                     .orient(Array.isArray(orient) ? orient[0] : orient)
                     .scale(scale)
                     .ticks(Array.isArray(ticks) ? ticks[0] : ticks)
                     .tickFormat(Array.isArray(tickFormat) ? tickFormat[0] : tickFormat)
                     .tickPadding(Array.isArray(tickPadding) ? tickPadding[0] : tickPadding)
                     .tickSize(Array.isArray(tickSize) ? tickSize[0] : tickSize)
                     .tickValues(multiTickValues ? tickValues[0] : tickValues)
    }
}

function renderAxis(coordinateChart, parent, type, xOffset, yOffset) {
    var axes;
    var pathStyle, textStyle, tickStyle;

    if ((type === "x") && (coordinateChart.showXAxis)) {
        axes = (Array.isArray(coordinateChart.xAxis) ?
                coordinateChart.xAxis :
                [ coordinateChart.xAxis ]);
        pathStyle = coordinateChart.xPathStyle;
        textStyle = coordinateChart.xTextStyle;
        tickStyle = coordinateChart.xTickStyle;
    } else if ((type === "y") && (coordinateChart.showYAxis)) {
        axes = (Array.isArray(coordinateChart.yAxis) ?
                coordinateChart.yAxis :
                [ coordinateChart.yAxis ]);
        pathStyle = coordinateChart.yPathStyle;
        textStyle = coordinateChart.yTextStyle;
        tickStyle = coordinateChart.yTickStyle;
    } else {
        return;
    }

    axes.forEach(function(currentValue, index) {
        var g = parent.append("g")
                      .attr("class", (type + " axis"))
                      .attr("transform", ("translate(" +
                                         (Array.isArray(xOffset) ? xOffset[index] : xOffset) + "," +
                                         (Array.isArray(yOffset) ? yOffset[index] : yOffset) + ")"))
                      .call(currentValue);

        g.selectAll("path").style(Array.isArray(pathStyle) ? pathStyle[index] : pathStyle);
        g.selectAll("line").style(Array.isArray(tickStyle) ? tickStyle[index] : tickStyle);
        g.selectAll("text")
         .on("click", function() { coordinateChart.dispatcher.axisLabelClicked.apply(this, arguments); })
         .attr("dy", ".15em")
         .style(Array.isArray(textStyle) ? textStyle[index] : textStyle);

        if (coordinateChart.showUnit) {
            g.append("text")
             .attr("transform", coordinateChart.unitStyle.transform)
             .attr(coordinateChart.unitStyle.offsetAxis, coordinateChart.unitStyle.offset)
             .attr(coordinateChart.unitStyle.offsetAxisd, coordinateChart.unitStyle.offsetd)
             .style("text-anchor", coordinateChart.unitStyle.anchor)
             .text(coordinateChart.unitStyle.text);
        }
    });
}

function createContainer(parent, chart) {
    if (typeof parent === 'string') {
        parent = d3.select(parent);
    }

    return parent.append("svg")
                     .attr("id", chart.id)
                     .attr("height", (chart.height + chart.margin.top + chart.margin.bottom))
                     .attr("width", (chart.width + chart.margin.left + chart.margin.right))
                 .append("g")
                     .attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")");
}

function animatePath(path, marker, duration, repeat) {
    var transition = path.transition()
                         .duration(duration)
                         .attrTween("stroke-dasharray", function() {
                             var l = path.node().getTotalLength();
                             var i = d3.interpolateString("0," + l, l + "," + l);

                             if ((marker == null) || (marker === undefined)) {
                                 return function(t) { return i(t); }
                             } else {
                                 return function(t) {
                                     var p = path.node().getPointAtLength(t * l);
                                     marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
                                     return i(t);
                                 }
                             }
                         });

    if (repeat) {
        transition.each("end", function() { d3.select(this).call(animatePath, marker, duration, repeat); });
    }
}

/*
 * 'D3Chart' is the base class for all D3 related chart renderer.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
var D3Chart = function(id, config, eventTypes) {
    this.id = id;
    this.height = (config.height || 0);
    this.width  = (config.width  || 0);
    this.margin = (config.margin || { top: 0, right: 0, bottom: 0, left: 0 });
    this.dispatcher = d3.dispatch.apply(null, eventTypes.concat(COMMON_EVENTS));

    for (var key in config.eventListeners) {
        if (config.eventListeners.hasOwnProperty(key)) {
            var listener = config.eventListeners[key];
            if (typeof listener === "function") {
                this.dispatcher.on(key, listener);
            }
        }
    }
};

/*
 * 'CoordinateChart' inherit from 'D3Chart' and depicts a coordinate-based chart.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
var CoordinateChart = function(id, config, eventTypes) {
    D3Chart.call(this, id, config, eventTypes.concat(COORDINATE_CHART_EVENTS));

    this.xScale = (config.xScale || d3.scale.linear());
    this.yScale = (config.yScale || d3.scale.linear());

    this.xOrient = (config.xOrient || "bottom");
    this.yOrient = (config.yOrient || "left");

    this.xPathStyle = config.xPathStyle;
    this.yPathStyle = config.yPathStyle;

    this.xTickStyle = config.xTickStyle;
    this.yTickStyle = config.yTickStyle;

    this.xTextStyle = config.xTextStyle;
    this.yTextStyle = config.yTextStyle;

    this.xTicks = config.xTicks;
    this.yTicks = config.yTicks;

    this.xTickFormat = config.xTickFormat;
    this.yTickFormat = config.yTickFormat;

    this.xTickPadding = (config.xTickPadding || 3);
    this.yTickPadding = (config.yTickPadding || 3);

    this.xTickSize = ((typeof config.xTickSize == 'number') ?  config.xTickSize : 6);
    this.yTickSize = ((typeof config.yTickSize == 'number') ?  config.yTickSize : 6);

    this.xTickValues = config.xTickValues;
    this.yTickValues = config.yTickValues;

    this.showXAxis = ((config.showXAxis === undefined) ? true : config.showXAxis);
    this.showYAxis = ((config.showYAxis === undefined) ? true : config.showYAxis);

    this.showUnit = config.showUnit;
    this.unitStyle = config.unitStyle;

    this.xAxis = createD3Axis(this.xScale,
                             this.xTicks,
                             this.xTickFormat,
                             this.xTickValues,
                             this.xTickPadding,
                             this.xTickSize,
                             this.xOrient);
    this.yAxis = createD3Axis(this.yScale,
                             this.yTicks,
                             this.yTickFormat,
                             this.yTickValues,
                             this.yTickPadding,
                             this.yTickSize,
                             this.yOrient);
};

CoordinateChart.prototype = Object.create(D3Chart.prototype);
CoordinateChart.prototype.constructor = CoordinateChart;

/*
 * 'ImageMap' inherit from 'CoordinateChart', and it is used to display a two-dimensional map as its background.
 *
 * @version	v1.0, 08/12/2015
 * @author	Eddie Yeh
 */
var ImageMap = function(id, config, eventTypes) {
    CoordinateChart.call(this, id, config, eventTypes.concat(IMAGE_MAP_EVENTS));

    this.imageUri = config.imageUri;
};

ImageMap.prototype = Object.create(CoordinateChart.prototype);
ImageMap.prototype.constructor = ImageMap;

/*
 * This class inherit from 'CoordinateChart' and it is used to render bubble charts.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
sr.BubbleChart = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.circleStyle = config.circleStyle;
    this.dataPointText = (config.dataPointText);
    this.dataPointTextStyle = config.dataPointTextStyle;
    this.dataPointMarkerUri = config.dataPointMarkerUri;
    this.dataPointMarkerHeight = ((typeof config.dataPointMarkerHeight === 'number') ?
                                   config.dataPointMarkerHeight : 16);
    this.dataPointMarkerWidth = ((typeof config.dataPointMarkerWidth === 'number') ?
                                  config.dataPointMarkerWidth : 16);
    this.linkOrient = (config.linkOrient || "vertical");
    this.linkStyle = config.linkStyle;
    this.pieChartConfig = config.pieChartConfig;
    this.radiusScaleDomain = (config.radiusScaleDomain);
    this.radiusScaleRange = (config.radiusScaleRange || [1, 20]);
    this.radiusMagnification = d3.max([config.radiusMagnification,1]);
    this.showLinks = ((config.showLinks === undefined) ? false : config.showLinks);
    this.showDataPointMarker = config.showDataPointMarker;
    this.showDataPointText = config.showDataPointText;
};

sr.BubbleChart.prototype = Object.create(CoordinateChart.prototype);
sr.BubbleChart.prototype.constructor = sr.BubbleChart;

sr.BubbleChart.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    var getDatumPositionX = function(d) { return xScale(d.x); };
    var getDatumPositionY = function(d) { return yScale(d.y); };
    var radiusScale = d3.scale.linear()
                        .domain(this.radiusScaleDomain)
                        .range(this.radiusScaleRange);
    var radiusMagnification = this.radiusMagnification;

    if (this.showLinks &&
       ((this.linkOrient === "vertical") ||
        (this.linkOrient === "horizontal"))) {
        var isVertical = (this.linkOrient === "vertical");

        var nest = d3.nest()
                     .key(isVertical ?
                          function(d) { return d.x; } :
                          function(d) { return d.y; })
                     .sortValues(isVertical ?
                                 function(i,j) { return i.y > j.y; } :
                                 function(i,j) { return i.x > j.x; })
                     .entries(data);

        nest.forEach(function(pair) {
            var minVal = pair.values[0],
                maxVal = pair.values[pair.values.length - 1];

            var x1, y1, x2, y2;
            var minRadius = radiusScale(minVal.size)*radiusMagnification,
                maxRadius = radiusScale(maxVal.size)*radiusMagnification;

            if (isVertical) {
                x1 = x2 = xScale(pair.values[0].x);
                y1 = getDatumPositionY(minVal);
                y2 = getDatumPositionY(maxVal);

                if (y1 >= y2) {
                    y1 -= minRadius;
                    y2 += maxRadius;
                } else {
                    y1 += minRadius;
                    y2 -= maxRadius;
                }
            } else {
                y1 = y2 = yScale(pair.values[0].y);
                x1 = getDatumPositionX(minVal);
                x2 = getDatumPositionX(maxVal);

                if (x1 >= x2) {
                    x1 -= minRadius;
                    x2 += maxRadius;
                } else {
                    x1 += minRadius;
                    x2 -= maxRadius;
                }
            }

            svg.append("line")
               .attr("class", "link")
               .attr({
                   "x1": x1,
                   "y1": y1,
                   "x2": x2,
                   "y2": y2
               })
               .style(this.linkStyle);
        }, this);
    }

    var dataPoint = svg.selectAll(".dataPoint")
                       .data(data)
                       .enter()
                       .append("g")
                       .attr("class", "dataPoint")
                       .attr("transform", function(d) { return "translate(" + getDatumPositionX(d) + "," + getDatumPositionY(d) + ")"; });

    if (data.every(function(d) { return (typeof d.fillSize === 'number'); })) {
        var computeDiagram = function(d) { return radiusScale(d.size) * 2.0; };

        var fillPattern = svg.append("defs")
                             .selectAll(".fill-pattern")
                             .data(data)
                             .enter()
                             .append("pattern")
                             .attr({
                                 "class": "fill-pattern",
                                 "id": function(d, i) { return "pattern" + i; },
                                 "patternUnits": "objectBoundingBox",
                                 "x": 0,
                                 "y": 0,
                                 "height": computeDiagram,
                                 "width": computeDiagram
                             });

        fillPattern.append("rect")
                   .attr({
                       "x": 0,
                       "y": 0,
                       "height": function(d) { return computeDiagram(d) * (1.0 - d.fillSize); },
                       "width": computeDiagram
                   })
                   .style("fill", "White");

        fillPattern.append("rect")
                   .attr({
                       "x": 0,
                       "y": function(d) { return computeDiagram(d) * (1.0 - d.fillSize); },
                       "height": function(d) { return computeDiagram(d) * d.fillSize; },
                       "width": computeDiagram
                   })
                   .style("fill", this.circleStyle.fill);

        this.circleStyle.fill = function(d, i) { return "url(#pattern" + i + ")"; };
    }

    var circleStyle = this.circleStyle;
    var pieChartConfig = this.pieChartConfig;

    dataPoint.filter(function(d) { return (d.pie === undefined); })
             .append("circle")
             .attr("r", .1)
             .style(circleStyle)
             .transition()
             .duration(300)
             .attr("r", function(d) { return d3.max([radiusScale(d.size)*radiusMagnification, 2]); });

    dataPoint.filter(function(d) { return (d.pie !== undefined); })
             .each(function(d, i) {
                 pieChartConfig.outerRadius = radiusScale(d.size);
                 pieChartConfig.height = pieChartConfig.width = (pieChartConfig.outerRadius * 2.0);
                 pieChartConfig.margin = { top: 0, right: 0, bottom: 0, left: 0 };

                 var pieChart = new sr.PieChart(("pie-chart-" + i), pieChartConfig);

                 pieChart.addGraph(d3.select(this)
                                     .append("g")
                                     .attr("transform", function() { return "translate(" + (-radiusScale(d.size)) + ",0)"; }),
                                   d.pie);
             });

    if (this.showDataPointText) {
        dataPoint.append("text")
                 .attr("text-anchor", "middle")
                 .attr("dy", ".5em")
                 .style(this.dataPointTextStyle)
                 .text(this.dataPointText);
    }

    if (this.showDataPointMarker) {
        dataPoint.append("image")
                 .attr("height", this.dataPointMarkerHeight)
                 .attr("width", this.dataPointMarkerWidth)
                 .attr("xlink:href", this.dataPointMarkerUri)
                 .attr("preserveAspectRatio", "none")
                 .attr("transform", function() { return "translate(" + 8 + ",-14)"; });
    }
};

/*
 * This class inherit from 'CoordinateChart' and it is used to render bubbled histogram.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
sr.BubbledHistogram = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.circleRadius = (config.circleRadius || 10);
    this.circleStyle  = (config.circleStyle || {});
    this.positiveGrow = ((config.positiveGrow === undefined) ? true : config.positiveGrow);
};

sr.BubbledHistogram.prototype = Object.create(CoordinateChart.prototype);
sr.BubbledHistogram.prototype.constructor = sr.BubbledHistogram;

sr.BubbledHistogram.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    var circleRadius = this.circleRadius;
    var circleDiameter = (this.circleRadius * 2.0);
    var circleStyle = this.circleStyle;
    var positiveGrow = this.positiveGrow;

    if (circleStyle.opacity === undefined) {
        var opacityScale = d3.scale.linear()
                             .domain([0, (this.height / circleDiameter)])
                             .range([.2, 1.0]);

        circleStyle.opacity = function(d) { return opacityScale(d); };
    }

    svg.selectAll(".bar")
       .data(data)
       .enter()
       .append("g")
       .attr("class", "bar")
       .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + (positiveGrow ? yScale(d.y) : 0) + ")"; })
       .each(function(d) {
           var bar = d3.select(this);
           var barHeight = Math.abs(yScale.range()[0] - yScale(d.y));

           for (var j = 0; j < Math.ceil(barHeight / circleDiameter); ++j) {
               bar.append("circle")
                  .datum(j)
                      .attr("cy", (positiveGrow ? barHeight : 0))
                      .attr("r", .1)
                      .style(circleStyle)
                  .transition()
                  .duration(1500)
                  .delay(200)
                      .attr("cy", (positiveGrow ? (barHeight - (j * circleDiameter) - circleRadius) : ((j * circleDiameter) + circleRadius)))
                      .attr("r", circleRadius);
           }
       });
};

/*
 * This class inherit from 'CoordinateChart' and it is used to render heatmap.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
sr.Heatmap = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.colors = config.colors;
    this.rectAnimationPeriod = ((typeof config.rectAnimationPeriod === 'number') ?
                                config.rectAnimationPeriod : 2000);
};

sr.Heatmap.prototype = Object.create(CoordinateChart.prototype);
sr.Heatmap.prototype.constructor = sr.Heatmap;

sr.Heatmap.prototype.addGraph = function(parent, data) {
    var svg = createContainer(parent, this);

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    var xScale = this.xScale;
    var yScale = this.yScale;
    var distinctX = d3.map(data, function(d) {return d.x; }).keys();
    var distinctY = d3.map(data, function(d) {return d.y; }).keys();
    var gridWidth = (this.width / distinctX.length);
    var gridHeight = (this.height / distinctY.length);

    var colorScale = d3.scale.quantile()
                       .domain(d3.extent(data, function(d) { return d.size; }))
                       .range(this.colors);

    svg.selectAll("rect")
       .data(data)
       .enter()
       .append("rect")
           .attr("class", "dataGrid")
           .attr({
               "x": function(d) { return xScale(d.x) - (gridWidth / 2.0); },
               "y": function(d) { return yScale(d.y) - (gridHeight / 2.0); },
               "width": gridWidth,
               "height": gridHeight
           })
           .style({
               "fill": this.colors[0],
               "opacity": .5
           })
       .transition()
       .delay(function(d) { return (distinctX.indexOf(d.x) * 15); })
       .duration(this.rectAnimationPeriod)
           .style("fill", function(d) { return colorScale(d.size); });
};

/*
 * This class inherit from 'CoordinateChart' and it is used to render histogram.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
sr.Histogram = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.barWidth       = (config.barWidth || 26);
    this.barRectStyle   = config.barRectStyle;
    this.direction      = (config.direction || "vertical");
    this.positiveGrow   = ((config.positiveGrow === undefined) ? true : config.positiveGrow);
    this.showBarText    = config.showBarText;
};

sr.Histogram.prototype = Object.create(CoordinateChart.prototype);
sr.Histogram.prototype.constructor = sr.Histogram;

sr.Histogram.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;
    var positiveGrow = this.positiveGrow;

    var svg = createContainer(parent, this);

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    var barWidth = this.barWidth;

    var formatCount = d3.format(",.0f");

    if (this.direction === "vertical") {
        var height = this.height;

        var bar = svg.append("g")
                     .attr("id", "bars")
                     .selectAll("rect").data(data)
                     .enter();

        bar.append("rect")
           .attr("height", 0)
           .attr("width", barWidth)
           .attr({
               "x": function(d) { return (xScale(d.x) - (barWidth / 2.0)); },
               "y": ((this.positiveGrow) ? this.height : 0)
           })
           .style(this.barRectStyle);

        if (this.showBarText) {
            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", function (d) {
                    return positiveGrow ? yScale(d.y) - 11 : yScale(d.y) + 3;
                })
                .attr("x", function (d) {
                    return (xScale(d.x));
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return formatCount(d.y);
                })
                .style(this.xTextStyle);
        }

        var rect = svg.selectAll("rect")
                      .data(data)
                      .transition()
                      .duration(300);

        if (this.positiveGrow) {
            rect.attr("y", function(d) { return yScale(d.y); })
                .attr("height", function(d) { return height - yScale(d.y); })
        } else {
            rect.attr("height", function(d) { return yScale(d.y); });
        }
    } else if (this.direction === "horizontal") {
        svg.append("g")
           .attr("id", "bars")
           .selectAll("rect").data(data)
           .enter()
           .append("rect")
           .attr("height", barWidth)
           .attr("width", 0)
           .attr({
               "x": 0,
               "y": function(d) { return (yScale(d.y) - (barWidth / 2.0)); }
           })
           .style(this.barRectStyle);

        svg.selectAll("rect")
           .data(data)
           .transition()
           .duration(300)
           .attr("width", function(d) {return xScale(d.x); });
    }
};

/*
 * This class inherit from 'Histogram' and it is used to render grouped histogram
 *
 * @version	v1.0, 08/24/2015
 * @author	Eddie Yeh
 */
sr.GroupedHistogram = function(id, config) {
    sr.Histogram.call(this, id, config);

    this.xGroupScale = (config.xGroupScale || d3.scale.linear());
};

sr.GroupedHistogram.prototype = Object.create(sr.Histogram.prototype);
sr.GroupedHistogram.prototype.constructor = sr.GroupedHistogram;

sr.GroupedHistogram.prototype.addGraph = function(parent, data) {
    var height = this.height;
    var xGroupScale = this.xGroupScale;
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    var barWidth = this.barWidth;

    var groupedBars = svg.selectAll("g")
                         .data(data)
                         .enter();
        //.append("g")
        //.attr("class", "groupedBars")
        //.attr("transform", function(d) { return "translate(" + xScale(d.key) + ", 0)"; });

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    groupedBars.append("g")
        .attr("class", "groupedBars")
        .attr("transform", function(d) { return "translate(" + xScale(d.key) + ", 0)"; });
    
    if (this.direction === "vertical") {
        var rectangles = svg.selectAll(".groupedBars").selectAll("rect")
                                    .data(function(d) { return d.values; })
                                    .enter()
                                    .append("rect")
                                    .attr("height", 0)
                                    .attr("width", barWidth)
                                    .attr({
                                        "x": function(d) { return (xGroupScale(d.x) - (barWidth / 2.0)); },
                                        "y": ((this.positiveGrow) ? this.height : 0)
                                    })
                                    .style(this.barRectStyle)
                                    .transition().duration(300);

        if (this.positiveGrow) {
            rectangles.attr("y", function(d) { return yScale(d.y); })
                      .attr("height", function(d) { return height - yScale(d.y); })
        }
        else {
            rectangles.attr("height", function(d) { return yScale(d.y); });
        }
    }


};

/*
 * This class inherit from 'CoordinateChart' and it is used to render line chart.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
sr.LineChart = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.datapointCircleRadius = (config.datapointCircleRadius || 3);
    this.datapointCircleStyle = config.datapointCircleStyle;
    this.lineAnimationPeriod = ((typeof config.lineAnimationPeriod === 'number') ?  config.lineAnimationPeriod : 2000);
    this.polylinePathStyle = config.polylinePathStyle;
};

sr.LineChart.prototype = Object.create(CoordinateChart.prototype);
sr.LineChart.prototype.constructor = sr.LineChart;

sr.LineChart.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    var getDatumPositionX = function(d) { return xScale(d.x); };
    var getDatumPositionY = function(d) { return yScale(d.y); };
    var line = d3.svg.line()
                     .x(getDatumPositionX)
                     .y(getDatumPositionY);

    for (var i = 0; i < data.length; ++i) {
        var polyline = svg.append("g");

        polyline.append("path")
                .datum(data[i].values)
                .attr("class", "line")
                .attr("d", line)
                .style(Array.isArray(this.polylinePathStyle) ?
                       this.polylinePathStyle[i] :
                       this.polylinePathStyle)
                .call(animatePath, null,
                      (Array.isArray(this.lineAnimationPeriod) ?
                       this.lineAnimationPeriod[i] :
                       this.lineAnimationPeriod), false);

        polyline.selectAll("circle")
                .data(data[i].values)
                .enter()
                .append("circle")
                .attr("class", "dataPoint")
                .attr("cx", getDatumPositionX)
                .attr("cy", getDatumPositionY)
                .attr("r", Array.isArray(this.datapointCircleRadius) ?
                           this.datapointCircleRadius[i] :
                           this.datapointCircleRadius)
                .style(Array.isArray(this.datapointCircleStyle) ?
                       this.datapointCircleStyle[i] :
                       this.datapointCircleStyle);
    }
};

/*
 * This class inherit from 'ImageMap', and it is used to render bidirectional arrows on two-dimensional map.
 *
 * @version	v1.0, 08/12/2015
 * @author	Eddie Yeh
 */
sr.MapArrowChart = function(id, config) {
    ImageMap.call(this, id, config, EMPTY_EVENTS);

    this.arrowPathStyle1 = config.arrowPathStyle1;
    this.arrowPathStyle2 = config.arrowPathStyle2;
    this.dataPointCircleStyle = config.dataPointCircleStyle;
    this.dataPointText = config.dataPointText;
    this.dataPointTextStyle = config.dataPointTextStyle;
    this.radiusScaleDomain = (config.radiusScaleDomain);
    this.radiusScaleRange  = (config.radiusScaleRange || [0, 40]);
    this.arrowScale = config.arrowScale || 0.35;
};

sr.MapArrowChart.prototype = Object.create(ImageMap.prototype);
sr.MapArrowChart.prototype.constructor = sr.MapArrowChart;

sr.MapArrowChart.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;
    var arrowScale = this.arrowScale;

    var svg = createContainer(parent, this);

    svg.append("image")
       .attr("height", this.height)
       .attr("width", this.width)
       .attr("xlink:href", this.imageUri);

    var radiusScale = d3.scale.linear()
                        .domain(this.radiusScaleDomain)
                        .range(this.radiusScaleRange);

    var dataPoint = svg.selectAll("g")
                       .data(data)
                       .enter()
                       .append("g")
                       .attr("class", "dataPoint")
                       .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });

    var arrowPathAttr = {
        d: "M121.7,57.681L83,26.881c-4-3.1-10-0.3-10,4.8v10.3c0,3.3-2.2,6.2-5.5,6.2H6c-3.3,0-6,2.4-6,5.8v16.2c0,3.2,2.7,6,6,6h61.5    \
            c3.3,0,5.5,2.601,5.5,5.9v10.3c0,5,6,7.8,9.9,4.7l38.6-30C124.7,64.781,124.8,60.081,121.7,57.681z",
        transform: "scale(" + arrowScale + "," + arrowScale + ")" + "translate(" + (-10) + "," + (-60) + ")"
    };

    dataPoint.append("g")
             .attr("transform", function(d) { return "rotate(" + d.rotate1 + ")"; })
             .append("path")
             .attr(arrowPathAttr)
             .style(this.arrowPathStyle1);

    dataPoint.append("g")
             .attr("transform", function(d) { return "rotate(" + d.rotate2 + ")"; })
             .append("path")
             .attr(arrowPathAttr)
             .style(this.arrowPathStyle2);

    dataPoint.append("circle")
             .attr("r", .1)
             .style(this.dataPointCircleStyle)
             .transition().duration(300).delay(0)
             .attr("r", function(d) { return radiusScale(d.size); });

    dataPoint.append("text")
             .attr("text-anchor", "middle")
             .attr("dy", 10)
             .style(this.dataPointTextStyle)
             .text(this.dataPointText);
};

/*
 * This class inherit from 'ImageMap', and it is used to render bubbles on two-dimensional map.
 *
 * @version	v1.0, 08/12/2015
 * @author	Eddie Yeh
 */
sr.MapBubbleChart = function(id, config) {
    ImageMap.call(this, id, config, EMPTY_EVENTS);

    this.dataPointCircleStyle = config.dataPointCircleStyle;
    this.dataPointText = config.dataPointText;
    this.dataPointTextStyle = config.dataPointTextStyle;
    this.radiusScaleDomain = (config.radiusScaleDomain);
    this.radiusScaleRange  = (config.radiusScaleRange || [0, 40]);
    this.showTooltip = ((config.showTooltip === undefined) ? false : config.showTooltip);
    this.tooltipHeight = (config.tooltipHeight || 25);
    this.tooltipWidth = (config.tooltipWidth || 80);
    this.tooltipRectStyle = config.tooltipRectStyle;
    this.tooltipTextStyle = config.tooltipTextStyle;
};

sr.MapBubbleChart.prototype = Object.create(ImageMap.prototype);
sr.MapBubbleChart.prototype.constructor = sr.MapBubbleChart;

sr.MapBubbleChart.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    svg.append("image")
       .attr("height", this.height)
       .attr("width", this.width)
       .attr("xlink:href", this.imageUri);

    var radiusScale = d3.scale.linear()
                        .domain(this.radiusScaleDomain)
                        .range(this.radiusScaleRange);
    var dataPoint = svg.selectAll("g")
                       .data(data)
                       .enter()
                       .append("g")
                       .attr("class", "dataPoint")
                       .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });

    dataPoint.append("circle")
             .attr("r", .1)
             .style(this.dataPointCircleStyle)
             .transition().duration(500).delay(200)
             .attr("r", function(d) { return radiusScale(d.size); });

    dataPoint.append("text")
             .attr("text-anchor", "middle")
             .attr("dy", 8)
             .style(this.dataPointTextStyle)
             .text(this.dataPointText);

    if (this.showTooltip) {
        dataPoint.append("rect")
                 .attr("height", this.tooltipHeight)
                 .attr("width", this.tooltipWidth)
                 .attr("rx", 5)
                 .attr("ry", 5)
                 .style(this.tooltipRectStyle);

        dataPoint.append("text")
                 .attr("dx", 60)
                 .attr("dy", 20)
                 .attr("text-anchor", "middle")
                 .style(this.tooltipTextStyle)
                 .text(function(d) { return d.tooltip; });
    }
};

/*
 * This class inherit from 'ImageMap', and it is used to render routes on two-dimensional map.
 *
 * @version	v1.0, 08/15/2015
 * @author	Eddie Yeh
 */
sr.MapRouteChart = function(id, config) {
    ImageMap.call(this, id, config, EMPTY_EVENTS);

    this.dashedLine = ((typeof config.dashedLine === 'undefined') ? false : config.dashedLine);
    this.dashLength = ((typeof config.dashLength === 'number') ?  config.dashLength : 10);
    this.dashGap = ((typeof config.dashGap === 'number') ?  config.dashGap : 10);
    this.dataPointText = config.dataPointText;
    this.dataPointTextStyle = config.dataPointTextStyle;
    this.dataPointCircleStyle = config.dataPointCircleStyle;
    this.lineAnimationPeriod = ((typeof config.lineAnimationPeriod === 'number') ?  config.lineAnimationPeriod : 2000);
    this.lineAnimationRepeat = ((typeof config.lineAnimationRepeat === 'undefined') ? false : config.lineAnimationRepeat);
    this.linePathStyle = config.linePathStyle;
    this.rScale = (config.rScale || d3.scale.linear());
};

sr.MapRouteChart.prototype = Object.create(ImageMap.prototype);
sr.MapRouteChart.prototype.constructor = sr.MapRouteChart;

sr.MapRouteChart.prototype.addGraph = function(parent, data) {
    var rScale = this.rScale;
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    svg.append("image")
       .attr("height", this.height)
       .attr("width", this.width)
       .attr("preserveAspectRatio", "none")
       .attr("xlink:href", this.imageUri);

    var line = d3.svg.line()
                     .interpolate("cardinal")
                     .x(function(d) { return xScale(d.x); })
                     .y(function(d) { return yScale(d.y); });

    for (var i = 0; i < data.length; ++i) {
        var path = svg.append("path")
                      .datum(data[i])
                      .attr("d", function(d) { return line(d.points); })
                      .style(this.linePathStyle);

        if (this.dashedLine) {
            path.style("opacity", 0);

            var dashedPath = svg.append("path")
                                .datum(data[i])
                                .attr("d", function(d) { return line(d.points); })
                                .style(this.linePathStyle);

            var pathLength = dashedPath.node().getTotalLength();
            var dashArray = this.dashLength;

            for (var length = (this.dashLength + this.dashGap);
                 length < pathLength;
                 length += (this.dashLength + this.dashGap)) {
                dashArray += ("," + this.dashGap + "," + this.dashLength);
            }

            dashedPath.attr("stroke-dasharray", (dashArray + "," + pathLength))
                      .attr("stroke-dashoffset", pathLength)
                      .transition()
                      .duration(this.lineAnimationPeriod)
                      .ease("linear")
                      .attr("stroke-dashoffset", 0);
        }

        var dataPoint = svg.append("g")
                           .datum(data[i])
                           .attr("class", "dataPoint")
                           .attr("transform", function(d) { return "translate(" + d.points[0].x + ")"; });

        dataPoint.append("circle")
                 .attr("r", function(d) { return rScale(d.size); })
                 .style(this.dataPointCircleStyle);

        dataPoint.append("text")
                 .attr("text-anchor", "middle")
                 .attr("dy", ".5em")
                 .style(this.dataPointTextStyle)
                 .text(this.dataPointText);

        path.call(animatePath, dataPoint, this.lineAnimationPeriod, this.lineAnimationRepeat);
    }
};

/*
 * This class inherit from 'D3Chart', and it is used to render radar chart.
 *
 * @version	v1.0, 08/15/2015
 * @author	Eddie Yeh
 */
sr.RadarChart = function(id, config) {
    D3Chart.call(this, id, config, EMPTY_EVENTS);

    this.datapointCircleRadius = (config.datapointCircleRadius || 3);
    this.numOfLevels = (config.numOfLevels || 3);
    this.scaleFactor = (config.scaleFactor || 1);
};

sr.RadarChart.prototype = Object.create(D3Chart.prototype);
sr.RadarChart.prototype.constructor = sr.RadarChart;

sr.RadarChart.prototype.addGraph = function(parent, axesConfig, data, options) {
    var cfg = {
        factorLegend: .85,
        opacityArea: 0.5,
        ToRight: 5,
        color: d3.scale.category10()
    };

    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) {
                cfg[i] = options[i];
            }
        }
    }

    var scaleFactor = this.scaleFactor;
    var center = { x: (this.width / 2), y: (this.height / 2) };
    var allAxis = (data[0].map(function(d) { return d.axis; }));
    var axisFormats = axesConfig.map(function(d) { return d3.format(d.format); });
    var radius = scaleFactor * Math.min(center.x, center.y);

    if (typeof parent === 'string') {
        d3.select(parent).select("svg").remove();
    } else {
        parent.select("svg").remove();
    }

    var g = createContainer(parent, this);

    var theta = (2 * Math.PI / allAxis.length);
    var computeFactorizeSin = function(val) { return scaleFactor * Math.sin(val); };
    var computeFactorizeCos = function(val) { return scaleFactor * Math.cos(val); };

    //Circular segments
    for (var j = 0; j < this.numOfLevels - 1; j++) {
        var levelFactor = scaleFactor * radius * ((j + 1) / this.numOfLevels);
        g.selectAll(".levels")
            .data(allAxis)
            .enter()
            .append("svg:line")
            .attr("x1", function(d, i) { return levelFactor * (1 - computeFactorizeSin(i * theta)); })
            .attr("y1", function(d, i) { return levelFactor * (1 - computeFactorizeCos(i * theta)); })
            .attr("x2", function(d, i) { return levelFactor * (1 - computeFactorizeSin((i + 1) * theta)); })
            .attr("y2", function(d, i) { return levelFactor * (1 - computeFactorizeCos((i + 1) * theta)); })
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-opacity", "0.75")
            .style("stroke-width", "0.3px")
            .attr("transform", "translate(" + (center.x - levelFactor) + ", " + (center.y - levelFactor) + ")");
    }

    //Text indicating at what % each level is
    for (var idx = 0; idx < axesConfig.length; ++idx) {
        if (axesConfig[idx].displayLevel) {
            for (var j = 0; j < this.numOfLevels; j++) {
                var levelFactor = scaleFactor * radius * ((j + 1) / this.numOfLevels);

                g.selectAll(".levels").data([idx])
                    .enter()
                    .append("svg:text")
                    .attr("x", function(d) { return levelFactor * (1 - computeFactorizeSin(d * theta)); })
                    .attr("y", function(d) { return levelFactor * (1 - computeFactorizeCos(d * theta)); })
                    .attr("class", "legend")
                    .style("font-family", "sans-serif")
                    .style("font-size", "10px")
                    .attr("transform", "translate(" + (center.x - levelFactor + cfg.ToRight) + ", " + (center.y - levelFactor) + ")")
                    .attr("fill", "#737373")
                    .text(axisFormats[idx]((j + 1) * axesConfig[idx].max / this.numOfLevels));
            }
        }
    }

    var axis = g.selectAll(".axis")
                .data(allAxis)
                .enter()
                .append("g")
                .attr("class", "axis");

    var computeAxisXPos = function(d, i) { return center.x * (1 - computeFactorizeSin(i * theta)); };
    var computeAxisYPos = function(d, i) { return center.y * (1 - computeFactorizeCos(i * theta)); };

    axis.append("line")
        .attr("x1", center.x)
        .attr("y1", center.y)
        .attr("x2", computeAxisXPos)
        .attr("y2", computeAxisYPos)
        .attr("class", "line")
        .style("stroke", "grey")
        .style("stroke-width", "1px");

    axis.append("text")
        .attr("class", "legend")
        .text(function(d) { return d })
        .style("font-family", "sans-serif")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "1.5em")
        .attr("transform", "translate(0, -10)")
        .attr("x", function(d, i) { return center.x * (1 - cfg.factorLegend * Math.sin(i * theta)) - 60 * Math.sin(i * theta); })
        .attr("y", function(d, i) { return center.y * (1 - Math.cos(i * theta)) - 20 * Math.cos(i * theta); });


    var series = 0;
    var dataValues = [];

    data.forEach(function(y, x) {
        dataValues = [];

        g.selectAll(".nodes")
         .data(y, function(j, i) {
             dataValues.push([
                 center.x * (1 - (parseFloat(Math.max(j.value, 0)) / axesConfig[i].max) * computeFactorizeSin(i * theta)),
                 center.y * (1 - (parseFloat(Math.max(j.value, 0)) / axesConfig[i].max) * computeFactorizeCos(i * theta))
             ]);
         });
        dataValues.push(dataValues[0]);
        g.selectAll(".area")
            .data([dataValues])
            .enter()
            .append("polygon")
            .attr("class", "radar-chart-serie" + series)
            .style("stroke-width", "2px")
            .style("stroke", cfg.color(series))
            .attr("points", function(d) {
                var str = "";
                for (var pti = 0; pti < d.length; pti++) {
                    str = str + d[pti][0] + "," + d[pti][1] + " ";
                }
                return str;
            })
            .style("fill", cfg.color(series))
            .style("fill-opacity", cfg.opacityArea)
            .on("mouseover", function() {
                var z = "polygon." + d3.select(this).attr("class");
                g.selectAll("polygon")
                    .transition(200)
                    .style("fill-opacity", 0.1);
                g.selectAll(z)
                    .transition(200)
                    .style("fill-opacity", .7);
            })
            .on("mouseout", function() {
                g.selectAll("polygon")
                    .transition(200)
                    .style("fill-opacity", cfg.opacityArea);
            });
        series++;
    });

    var scaleX = d3.scale.linear(),
        scaleY = d3.scale.linear();

    var tooltip = g.append('text')
        .style('opacity', 0)
        .style('font-family', 'sans-serif')
        .style('font-size', '13px');

    var dataRadius = this.datapointCircleRadius;
    series = 0;

    data.forEach(function(y, x) {
        g.selectAll(".nodes")
            .data(y).enter()
            .append("svg:circle")
            .attr("class", "radar-chart-serie" + series)
            .attr('r', dataRadius)
            .attr("alt", function(j) { return Math.max(j.value, 0) })
            .attr("cx", function(d, i) {
                dataValues.push([
                    center.x * (1 - (parseFloat(Math.max(d.value, 0)) / axesConfig[i].max) * computeFactorizeSin(i * theta)),
                    center.y * (1 - (parseFloat(Math.max(d.value, 0)) / axesConfig[i].max) * computeFactorizeCos(i * theta))
                ]);

                scaleX.domain([0, axesConfig[i].max])
                    .range([center.x, computeAxisXPos(d, i)]);

                return scaleX(d.value);
            })
            .attr("cy", function(d, i) {
                scaleY.domain([0, axesConfig[i].max])
                    .range([center.y, computeAxisYPos(d, i)]);

                return scaleY(d.value);
            })
            .attr("data-id", function(j) { return j.axis })
            .style("fill", cfg.color(series)).style("fill-opacity", .9)
            .on("mouseover", function(d, index) {
                var newX = parseFloat(d3.select(this).attr('cx')) - 10;
                var newY = parseFloat(d3.select(this).attr('cy')) - 5;

                tooltip.attr('x', newX)
                    .attr('y', newY)
                    .text(axisFormats[index](d.value))
                    .transition(200)
                    .style('opacity', 1);

                var z = "polygon." + d3.select(this).attr("class");
                g.selectAll("polygon")
                    .transition(200)
                    .style("fill-opacity", 0.1);
                g.selectAll(z)
                    .transition(200)
                    .style("fill-opacity", .7);
            })
            .on("mouseout", function() {
                tooltip.transition(200)
                    .style('opacity', 0);
                g.selectAll("polygon")
                    .transition(200)
                    .style("fill-opacity", cfg.opacityArea);
            })
            .append("svg:title")
            .text(function(j) { return Math.max(j.value, 0) });

        series++;
    });
};

/*
 * This class inherit from 'D3Chart', and it is used to render pie chart.
 *
 * @version	v1.0, 09/10/2015
 * @author	Eddie Yeh
 */
sr.PieChart = function(id, config) {
    D3Chart.call(this, id, config, EMPTY_EVENTS);

    this.innerRadius = ((typeof config.innerRadius === 'number') ? config.innerRadius : 0);
    this.outerRadius = ((typeof config.outerRadius === 'number') ? config.outerRadius : 100);
    this.textOffset = ((typeof config.textOffset === 'number') ? config.textOffset : 14);
    this.tweenDuration = ((typeof config.tweenDuration === 'number') ? config.tweenDuration : 300);
    this.arcPathStyle = config.arcPathStyle;
    this.backgroundCircleStyle = config.backgroundCircleStyle;
    this.centerTitle = config.centerTitle;
    this.centerTitleTextStyle = config.centerTitleTextStyle;
    this.centerValue = config.centerValue;
    this.centerValueTextStyle = config.centerValueTextStyle;
    this.tickNameTextStyle = config.tickNameTextStyle;
    this.tickPercentTextStyle = config.tickPercentTextStyle;
    this.tickStyle = config.tickStyle;

    this.arc = null;
    this.data = [
        {
            "data": {
                "name": "",
                "value": 1
            },
            "value": 1,
            "startAngle": 0,
            "endAngle": 0,
            "padAngle": 0,
            "name": ""
        }
    ];
};

sr.PieChart.prototype = Object.create(D3Chart.prototype);
sr.PieChart.prototype.constructor = sr.PieChart;

sr.PieChart.prototype.addGraph = function(parent, data) {
    var svg = createContainer(parent, this);

    //D3 helper function to draw arcs, populates parameter "d" in path object
    this.arc = d3.svg.arc()
                    .startAngle(function(d) { return d.startAngle; })
                    .endAngle(function(d) { return d.endAngle; })
                    .innerRadius(this.innerRadius)
                    .outerRadius(this.outerRadius);

    ///////////////////////////////////////////////////////////
    // CREATE VIS & GROUPS ////////////////////////////////////
    ///////////////////////////////////////////////////////////

    // GROUP FOR ARCS/PATHS
    var arcGroup = svg.append("g")
                      .attr("class", "arc")
                      .attr("transform", "translate(" + (this.width / 2) + "," + (this.height / 2) + ")");

    // PLACEHOLDER GRAY CIRCLE
    arcGroup.append("circle")
            .attr("fill", "#EFEFEF")
            .attr("r", this.outerRadius);

    // GROUP FOR LABELS
    svg.append("g")
       .attr("class", "label_group")
       .attr("transform", "translate(" + (this.width / 2) + "," + (this.height / 2) + ")");

    // GROUP FOR CENTER TEXT
    var centerGroup = svg.append("g")
                         .attr("class", "center_group")
                         .attr("transform", "translate(" + (this.width / 2) + "," + (this.height / 2) + ")");

    ///////////////////////////////////////////////////////////
    // CENTER TEXT ////////////////////////////////////////////
    ///////////////////////////////////////////////////////////

    // WHITE CIRCLE BEHIND LABELS
    centerGroup.append("circle")
        .attr(this.backgroundCircleStyle)
        .attr("r", this.innerRadius);

    // TITLE LABEL
    centerGroup.append("text")
        .attr("class", "label")
        .attr("dy", -15)
        .attr("text-anchor", "middle")
        .style(this.centerTitleTextStyle)
        .text(this.centerTitle);

    // TOTAL TRAFFIC VALUE
    centerGroup.append("text")
        .attr("class", "total")
        .attr("dy", 7)
        .attr("text-anchor", "middle")
        .style(this.centerValueTextStyle)
        .text("Waiting...");

    // UNITS LABEL
    //centerGroup.append("text")
    //    .attr("class", "units")
    //    .attr("dy", 21)
    //    .attr("text-anchor", "middle") // text-align: right
    //    .text("kb");

    this.update(data);
};

sr.PieChart.prototype.update = function(data) {
    var donut = d3.layout.pie()
        .value(function(d) { return d.value; });

    var arc = this.arc;
    var oldPieData = this.data;
    var pieData = donut(data);
    var outerRadius = this.outerRadius;
    var textOffset = this.textOffset;
    var tweenDuration = this.tweenDuration;

    var totalValue = 0;
    var filteredPieData = pieData.filter(function(element, index) {
        element.name = data[index].name;
        element.value = data[index].value;
        totalValue += element.value;
        return (element.value > 0);
    });

    this.data = filteredPieData;

    if ((filteredPieData.length > 0) && (oldPieData.length > 0)) {
        var container = d3.select("#" + this.id);
        var arcGroup = container.select(".arc");
        var labelGroup = container.select(".label_group");
        var paths = arcGroup.selectAll("path").data(filteredPieData);

        var pieTween = function(d, i) {
            var s0, e0;

            if (oldPieData[i]) {
                s0 = oldPieData[i].startAngle;
                e0 = oldPieData[i].endAngle;
            } else if (!(oldPieData[i]) && oldPieData[i - 1]) {
                s0 = oldPieData[i - 1].endAngle;
                e0 = oldPieData[i - 1].endAngle;
            } else if (!(oldPieData[i - 1]) && (oldPieData.length > 0)) {
                s0 = oldPieData[oldPieData.length - 1].endAngle;
                e0 = oldPieData[oldPieData.length - 1].endAngle;
            } else {
                s0 = 0;
                e0 = 0;
            }
            var interpolate = d3.interpolate({
                startAngle  : s0,
                endAngle    : e0
            }, {
                startAngle  : d.startAngle,
                endAngle    : d.endAngle
            });

            return function(t) {
                return arc(interpolate(t));
            };
        };

        var removePieTween = function(d) {
            var s0 = 2 * Math.PI,
                e0 = 2 * Math.PI;

            var interpolate = d3.interpolate({
                startAngle  : d.startAngle,
                endAngle    : d.endAngle
            }, {
                startAngle  : s0,
                endAngle    : e0
            });

            return function(t) {
                return arc(interpolate(t));
            };
        };

        var textTween = function(d, i) {
            var a;
            if (oldPieData[i]) {
                a = ((oldPieData[i].startAngle + oldPieData[i].endAngle - Math.PI) / 2);
            } else if (!(oldPieData[i]) && oldPieData[i-1]) {
                a = ((oldPieData[i - 1].startAngle + oldPieData[i - 1].endAngle - Math.PI) / 2);
            } else if (!(oldPieData[i - 1]) && (oldPieData.length > 0)) {
                a = ((oldPieData[oldPieData.length - 1].startAngle + oldPieData[oldPieData.length - 1].endAngle - Math.PI) / 2);
            } else {
                a = 0;
            }
            var b = ((d.startAngle + d.endAngle - Math.PI) / 2);

            var fn = d3.interpolateNumber(a, b);
            return function(t) {
                var val = fn(t);
                return "translate(" + Math.cos(val) * (outerRadius + textOffset) + "," + Math.sin(val) * (outerRadius + textOffset) + ")";
            };
        };

        // REMOVE PLACEHOLDER CIRCLE
        arcGroup.selectAll("circle").remove();

        if (typeof this.centerValue === 'function') {
            var centerValue = this.centerValue;
            container.select(".center_group .total")
                     .text(function() {
                         return centerValue(totalValue);
                     });
        } else {
            container.select(".center_group .total")
                     .text(this.centerValue);
        }

        // DRAW ARC PATHS
        paths.enter()
             .append("path")
             .style(this.arcPathStyle)
             .transition()
             .duration(tweenDuration)
             .attrTween("d", pieTween);
        paths.transition()
             .duration(tweenDuration)
             .attrTween("d", pieTween);
        paths.exit()
             .transition()
             .duration(tweenDuration)
             .attrTween("d", removePieTween)
             .remove();

        // DRAW TICK MARK LINES FOR LABELS
        var lines = labelGroup.selectAll("line")
                              .data(filteredPieData);
        lines.enter()
             .append("line")
             .attr({
                 "x1": 0,
                 "x2": 0,
                 "y1": (-outerRadius - 3),
                 "y2": (-outerRadius - 8)
             })
             .style(this.tickStyle)
             .attr("transform", function(d) {
                 return "rotate(" + (((d.startAngle + d.endAngle) / 2) * (180 / Math.PI)) + ")";
             });
        lines.transition()
             .duration(tweenDuration)
             .attr("transform", function(d) {
                 return "rotate(" + (((d.startAngle + d.endAngle) / 2) * (180 / Math.PI)) + ")";
             });
        lines.exit().remove();

        // DRAW LABELS WITH PERCENTAGE VALUES
        var percentTextDy = function(d) {
            if ((((d.startAngle + d.endAngle) / 2) > (Math.PI / 2)) &&
                (((d.startAngle + d.endAngle) / 2) < (Math.PI * 1.5))) {
                return 5;
            } else {
                return -7;
            }
        };
        var percentTextAnchor = function(d) {
            if (((d.startAngle + d.endAngle) / 2) < Math.PI) {
                return "start";
            } else {
                return "end";
            }
        };
        var percentText = function(d) {
            var percentage = (d.value / totalValue * 100);
            return percentage.toFixed(1) + "%";
        };

        var percentLabels = labelGroup.selectAll("text.value")
                                      .data(filteredPieData)
                                      .attr("dy", percentTextDy)
                                      .attr("text-anchor", percentTextAnchor)
                                      .style(this.tickPercentTextStyle)
                                      .text(percentText);
        percentLabels.enter()
                     .append("text")
                     .attr("class", "value")
                     .attr("transform", function(d) {
                         return ("translate("
                                + Math.cos((d.startAngle + d.endAngle - Math.PI) / 2) * (outerRadius + textOffset)
                                + ","
                                + Math.sin((d.startAngle + d.endAngle - Math.PI) / 2) * (outerRadius + textOffset)
                                + ")");
                     })
                     .attr("dy", percentTextDy)
                     .attr("text-anchor", percentTextAnchor)
                     .style(this.tickPercentTextStyle)
                     .text(percentText);
        percentLabels.transition()
                     .duration(tweenDuration)
                     .attrTween("transform", textTween);
        percentLabels.exit().remove();

        // DRAW LABELS WITH ENTITY NAMES
        var nameTextDy = function(d) {
            if ((((d.startAngle + d.endAngle) / 2) > (Math.PI / 2)) &&
                (((d.startAngle + d.endAngle) / 2) < (Math.PI * 1.5))) {
                return 17;
            } else {
                return 5;
            }
        };
        var nameTextAnchor = function(d) {
            if (((d.startAngle + d.endAngle) / 2) < Math.PI) {
                return "start";
            } else {
                return "end";
            }
        };
        var nameText = function(d) { return d.name; };

        var nameLabels = labelGroup.selectAll("text.units")
                                   .data(filteredPieData)
                                   .attr("dy", nameTextDy)
                                   .attr("text-anchor", nameTextAnchor)
                                   .style(this.tickNameTextStyle)
                                   .text(nameText);
        nameLabels.enter()
                  .append("text")
                  .attr("class", "units")
                  .attr("transform", function(d) {
                      return ("translate("
                             + Math.cos((d.startAngle + d.endAngle - Math.PI) / 2) * (outerRadius + textOffset)
                             + ","
                             + Math.sin((d.startAngle + d.endAngle - Math.PI) / 2) * (outerRadius + textOffset)
                             + ")");
                  })
                  .attr("dy", nameTextDy)
                  .attr("text-anchor", nameTextAnchor)
                  .style(this.tickNameTextStyle)
                  .text(nameText);
        nameLabels.transition()
                  .duration(tweenDuration)
                  .attrTween("transform", textTween);
        nameLabels.exit().remove();
    }
};

/*
 * This class inherit from 'CoordinateChart' and it is used to render Sankey diagram.
 *
 * @version	v1.0, 08/26/2015
 * @author	Eddie Yeh
 */
sr.SankeyDiagram = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.lineAnimationPeriod = ((typeof config.lineAnimationPeriod === 'number') ?  config.lineAnimationPeriod : 2000);
    this.ribbonWidthRange = (config.ribbonWidthRange || [0, 16]);
    this.ribbonPathStyle  = config.ribbonPathStyle;
};

sr.SankeyDiagram.prototype = Object.create(CoordinateChart.prototype);
sr.SankeyDiagram.prototype.constructor = sr.SankeyDiagram;

sr.SankeyDiagram.prototype.addGraph = function(parent, data) {
    if (!Array.isArray(this.xScale)) return;

    var svg = createContainer(parent, this);

    renderAxis(this, svg, "x", 0, this.xScale.map(function(currentValue, index) {
        return this.yScale(index);
    }, this));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    data.nodes.forEach(function(node) {
        node.sourceLinks = [];
        node.targetLinks = [];
    });
    data.links.forEach(function(link) {
        var sourceNode = data.nodes[link.source];
        var targetNode = data.nodes[link.target];

        sourceNode.sourceLinks.push(link);
        targetNode.targetLinks.push(link);
    });

    var ribbonWidthScale = d3.scale.linear()
                             .domain(d3.extent(data.links, function(d) { return d.size; }))
                             .range(this.ribbonWidthRange);

    data.nodes.forEach(function(node) {
        function computeLinkWidth(d) {
            return (d.width = ribbonWidthScale(d.size));
        }

        var nodeWidth = Math.max(d3.sum(node.sourceLinks, computeLinkWidth),
                                 d3.sum(node.targetLinks, computeLinkWidth));

        var nodeX = this.xScale[node.y](node.x) - (nodeWidth / 2.0),
            nodeY = this.yScale(node.y);

        var xOffset = 0;
        for (var i = 0; i < node.sourceLinks.length; ++i) {
            var sourceLink = node.sourceLinks[i];
            sourceLink.x0 = nodeX + xOffset + (sourceLink.width / 2.0);
            sourceLink.y0 = nodeY;
            xOffset += sourceLink.width;
        }
        xOffset = 0;
        for (var j = 0; j < node.targetLinks.length; ++j) {
            var targetLink = node.targetLinks[j];
            targetLink.x1 = nodeX + xOffset + (targetLink.width / 2.0);
            targetLink.y1 = nodeY;
            xOffset += targetLink.width;
        }
    }, this);
    data.links.forEach(function(link) {
        var yi = ((link.y1 - link.y0) / 2) + link.y0;

        svg.append("path")
           .datum(link)
           .attr("d", "M" + link.x0 + "," + link.y0
                    + "C" + link.x0 + "," + yi
                    + " " + link.x1 + "," + yi
                    + " " + link.x1 + "," + link.y1)
           .attr("stroke-width", function(d) { return ribbonWidthScale(d.size); })
           .style(this.ribbonPathStyle)
           .call(animatePath, null, this.lineAnimationPeriod, false);
    }, this);
};

/*
 * This class inherit from 'CoordinateChart' and it is used to render stacked area chart.
 *
 * @version	v1.0, 08/07/2015
 * @author	Eddie Yeh
 */
sr.StackedAreaChart = function(id, config) {
    CoordinateChart.call(this, id, config, EMPTY_EVENTS);

    this.areaAnimationPeriod = ((typeof config.areaAnimationPeriod === 'number') ?  config.areaAnimationPeriod : 2000);
    this.areaPathStyle  = config.areaPathStyle;
    this.areaTitleStyle = config.areaTitleStyle;
    this.direction      = (config.direction || "horizontal");
    this.showAreaTitle  = ((config.showAreaTitle === undefined) ? false : config.showAreaTitle);
    this.showAreaText    = config.showAreaText;

    this.unitStyle = config.unitStyle;
};

sr.StackedAreaChart.prototype = Object.create(CoordinateChart.prototype);
sr.StackedAreaChart.prototype.constructor = sr.StackedAreaChart;

sr.StackedAreaChart.prototype.addGraph = function(parent, data) {
    var xScale = this.xScale;
    var yScale = this.yScale;

    var svg = createContainer(parent, this);

    var stack = d3.layout.stack()
                  .values(function(d) { return d.values; });

    var browser = svg.selectAll(".browser")
                     .data(stack(data))
                     .enter()
                     .append("g")
                     .attr("class", "browser");

    renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
    renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);

    var initArea = d3.svg.area();
    var computeArea = d3.svg.area();

    if (this.direction === "horizontal") {
        initArea.x(function(d) { return xScale(d.x); })
                .y0(function() { return yScale.range()[0]; })
                .y1(function() { return yScale.range()[0]; });

        computeArea.x(function(d) { return xScale(d.x); })
                   .y0(function(d) { return yScale(d.y0); })
                   .y1(function(d) { return yScale(d.y0 + d.y); });
    } else if (this.direction === "vertical") {
        initArea.y(function(d) { return yScale(d.y); })
                .x0(function() { return xScale.range()[0]; })
                .x1(function() { return xScale.range()[0]; });

        computeArea.y(function(d) { return yScale(d.y); })
                   .x0(0)
                   .x1(function(d) { return xScale(d.x); });
    }

    browser.append("path")
               .attr("class", "area")
               .attr("d", function(d) { return initArea(d.values); })
               .style(this.areaPathStyle)
           .transition()
           .duration(this.areaAnimationPeriod)
               .attr("d", function(d) { return computeArea(d.values); });

    if (this.showAreaTitle) {
        browser.append("text")
               .datum(function(d) { return { key: d.key, value: d.values[d.values.length - 1] }; })
               .style(this.areaTitleStyle)
               .attr("text-anchor", "end")
               .attr("x", -6)
               .attr("dy", ".35em")
               .attr("transform", function(d) { return "translate(" + xScale(d.value[0]) + "," + yScale(d.value.y0 + d.value[1] / 2) + ")"; })
               .text(function(d) { return d.key; });
    }
};

(function() {
    "use strict";

    var weatherPaths = {
        "sunny":            "M104.914,306c0-14.478-11.75-26.229-26.229-26.229H26.229C11.75,279.771,0,291.522,0,306                                          \
                             c0,14.479,11.75,26.229,26.229,26.229h52.457C93.164,332.229,104.914,320.479,104.914,306z M131.143,454.629                       \
                             c-7.239,0-13.796,2.938-18.553,7.676l-34.971,34.972c-4.739,4.756-7.676,11.313-7.676,18.552                                      \
                             c0,14.479,11.733,26.229,26.229,26.229c7.239,0,13.796-2.938,18.535-7.693l34.972-34.972c4.756-4.738,7.694-11.295,7.694-18.534    \
                             C157.372,466.379,145.639,454.629,131.143,454.629z M306,104.914c14.496,0,26.229-11.75,26.229-26.229V26.229                      \
                             C332.229,11.75,320.496,0,306,0c-14.496,0-26.229,11.75-26.229,26.229v52.457C279.771,93.164,291.504,104.914,306,104.914z         \
                             M480.857,157.372c7.239,0,13.796-2.938,18.534-7.676l34.972-34.972c4.756-4.756,7.693-11.313,7.693-18.552                         \
                             c0-14.478-11.732-26.229-26.229-26.229c-7.238,0-13.796,2.938-18.552,7.694l-34.972,34.971                                        \
                             c-4.738,4.739-7.676,11.296-7.676,18.535C454.629,145.621,466.361,157.372,480.857,157.372z M112.59,149.695                       \
                             c4.756,4.738,11.313,7.676,18.553,7.676c14.478,0,26.229-11.75,26.229-26.229c0-7.239-2.938-13.796-7.676-18.552l-34.972-34.971    \
                             c-4.756-4.739-11.313-7.676-18.552-7.676c-14.478,0-26.229,11.75-26.229,26.229c0,7.239,2.938,13.796,7.676,18.535                 \
                             L112.59,149.695z M585.771,279.771h-52.457c-14.479,0-26.229,11.75-26.229,26.229c0,14.479,11.75,26.229,26.229,26.229h52.457      \
                             C600.25,332.229,612,320.479,612,306C612,291.522,600.25,279.771,585.771,279.771z M499.409,462.305                               \
                             c-4.756-4.738-11.312-7.676-18.552-7.676c-14.479,0-26.229,11.75-26.229,26.229c0,7.239,2.938,13.796,7.676,18.534l34.972,34.972   \
                             c4.756,4.756,11.313,7.693,18.552,7.693c14.479,0,26.229-11.75,26.229-26.229c0-7.238-2.938-13.796-7.676-18.552L499.409,462.305   \
                             z M306,507.086c-14.496,0-26.229,11.75-26.229,26.229v52.457C279.771,600.25,291.504,612,306,612                                  \
                             c14.496,0,26.229-11.75,26.229-26.229v-52.457C332.229,518.836,320.496,507.086,306,507.086z M306,122.4                           \
                             c-101.242,0-183.6,82.358-183.6,183.6S204.758,489.6,306,489.6S489.6,407.242,489.6,306S407.242,122.4,306,122.4z M306,437.143     \
                             c-72.321,0-131.143-58.821-131.143-131.143c0-72.321,58.822-131.143,131.143-131.143c72.321,0,131.143,58.822,131.143,131.143      \
                             C437.143,378.321,378.321,437.143,306,437.143z",

        "partlyCloudy":     "M365.707,134.341c12.375,0,22.391-10.031,22.391-22.39v-44.78c0-12.359-10.016-22.391-22.391-22.391                               \
                             c-12.374,0-22.39,10.031-22.39,22.391v44.78C343.317,124.311,353.333,134.341,365.707,134.341z M452.716,383.127                   \
                             c24.479-23.122,39.869-55.736,39.869-92.054c0-70.052-56.812-126.878-126.878-126.878c-42.108,0-79.336,20.599-102.413,52.184      \
                             c-14.822-4.657-30.48-7.404-46.855-7.404c-83.307,0-151.239,65.036-156.254,147.089C24.435,374.753,0,412.115,0,455.269            \
                             C0,517.11,50.109,567.22,111.951,567.22h298.537c53.587,0,97.023-43.438,97.023-97.024                                            \
                             C507.512,431.788,485.077,398.845,452.716,383.127z M365.707,208.976c45.273,0,82.098,36.825,82.098,82.098                        \
                             c0,14.941-4.209,28.854-11.239,40.914c-17.614-36.347-54.244-61.737-97.024-63.125c-9.853-12.494-21.659-23.331-34.795-32.347      \
                             C319.763,219.708,341.437,208.976,365.707,208.976z M410.488,522.439H111.951c-37.033,0-67.171-30.138-67.171-67.171               \
                             c0-25.062,13.853-47.87,36.153-59.514l22.405-11.718l1.538-25.241c3.612-58.901,52.617-105.04,111.563-105.04                      \
                             c34.436,0,66.469,15.613,87.919,42.825l12.897,16.375l20.838,0.672c36.406,1.179,64.932,30.614,64.932,67.006v29.839               \
                             l27.555,11.494c19.524,8.149,32.152,27.077,32.152,48.229C462.731,499.004,439.297,522.439,410.488,522.439z M485.122,194.049      \
                             c6.18,0,11.777-2.508,15.822-6.553l29.854-29.854c4.061-4.06,6.568-9.658,6.568-15.837c0-12.359-10.017-22.39-22.391-22.39         \
                             c-6.18,0-11.777,2.508-15.822,6.568L469.3,155.836c-4.061,4.045-6.568,9.643-6.568,15.823                                         \
                             C462.731,184.018,472.748,194.049,485.122,194.049z M230.455,187.496c4.061,4.045,9.658,6.553,15.837,6.553                        \
                             c12.36,0,22.391-10.031,22.391-22.39c0-6.18-2.508-11.777-6.568-15.837l-29.854-29.854c-4.045-4.045-9.643-6.553-15.822-6.553      \
                             c-12.359,0-22.39,10.031-22.39,22.39c0,6.18,2.508,11.777,6.568,15.823L230.455,187.496z M589.609,268.683h-44.78                  \
                             c-12.359,0-22.39,10.031-22.39,22.39s10.03,22.391,22.39,22.391h44.78c12.359,0,22.391-10.031,22.391-22.391                       \
                             S601.969,268.683,589.609,268.683z",

        "cloudy":           "M460.594,272.607c1.457-15.152,2.331-39.92-4.954-67.019c-10.49-40.503-40.503-93.536-122.966-118.303                             \
                             c-18.066-5.536-35.549-8.159-51.867-8.159c-84.794,0-128.502,73.138-143.946,122.966c-4.662-0.583-10.199-0.874-16.318-0.874       \
                             c-61.483,0-104.025,35.549-117.138,97.324c-10.49,50.702,5.245,83.337,20.106,101.694c27.39,33.801,70.516,45.748,99.072,45.748    \
                             h305.375c1.166,0,3.497,0.291,6.411,0.291l0,0c64.397,0,82.754-44.291,86.834-57.986                                              \
                             C539.269,327.971,495.269,289.216,460.594,272.607z M487.693,378.09c-3.788,12.238-15.444,33.218-53.324,33.218                    \
                             c-2.331,0-3.788,0-3.788,0l0,0c-0.583,0-1.166,0-1.748,0H123.167c-21.854,0-53.907-10.199-71.973-32.635                           \
                             c-14.861-18.357-19.232-42.834-13.112-72.556c9.616-46.622,37.589-69.933,82.754-69.933c14.278,0,24.768,2.622,24.768,2.622        \
                             c4.662,1.166,9.616,0.583,13.695-2.04c4.079-2.622,6.993-6.702,7.867-11.364c0.291-1.166,23.894-111.31,113.933-111.31             \
                             c13.112,0,27.099,2.331,41.96,6.702c126.754,37.88,102.569,154.144,101.694,159.098c-2.04,8.742,2.914,17.483,11.364,20.397        \
                             C438.449,301.163,503.72,324.474,487.693,378.09z",

        "showers":          "M464.454,193.482c1.457-15.152,2.331-39.92-4.954-67.019c-10.49-40.503-40.503-93.536-122.966-118.303                             \
                             C318.469,2.622,300.986,0,284.668,0c-84.794,0-128.502,73.138-143.946,122.966c-4.662-0.583-10.199-0.874-16.318-0.874             \
                             c-61.191,0-103.734,35.549-116.847,97.324c-10.49,50.701,5.245,83.337,20.106,101.694c27.39,33.801,70.516,45.748,99.072,45.748    \
                             h304.792c1.166,0,3.497,0.291,6.411,0.291c64.397,0,82.754-44.291,86.834-57.986C543.129,248.845,499.129,210.091,464.454,193.482z \
                             M491.553,298.964c-3.788,12.238-15.444,33.218-53.324,33.218c-2.331,0-3.788,0-3.788,0c-0.583,0-1.166,0-1.748,0H127.027           \
                             c-21.854,0-53.907-10.199-71.973-32.635c-14.861-18.357-19.232-42.834-13.112-72.556c9.616-46.622,37.589-69.933,82.754-69.933     \
                             c14.278,0,24.768,2.622,24.768,2.622c4.662,1.166,9.616,0.291,13.695-2.04c4.079-2.622,6.993-6.702,7.867-11.364                   \
                             c0-0.291,6.411-29.43,24.185-57.695c22.437-35.549,52.741-53.615,89.747-53.615c13.112,0,27.099,2.331,41.96,6.702                 \
                             c126.754,37.88,102.569,154.144,101.694,159.098c-2.04,8.742,2.914,17.483,11.364,20.397                                          \
                             C442.309,222.038,507.58,245.349,491.553,298.964z M83.027,530.617c-8.159-4.954-10.781-15.735-5.828-24.185l46.913-76.052         \
                             c4.954-8.159,15.735-10.781,24.185-5.828c8.159,4.954,10.781,15.735,5.828,24.185l-46.913,76.052                                  \
                             c-3.205,5.245-9.033,8.45-14.861,8.45C89.147,533.24,85.941,532.366,83.027,530.617z M219.98,530.617                              \
                             c-8.159-4.954-10.781-15.735-5.828-24.185l46.913-76.052c4.954-8.159,15.735-10.781,24.185-5.828                                  \
                             c8.159,4.954,10.781,15.735,5.828,24.185l-46.913,76.052c-3.205,5.245-9.033,8.45-14.861,8.45                                     \
                             C226.099,533.24,222.894,532.366,219.98,530.617z M354.018,530.617c-8.159-4.954-10.781-15.735-5.828-24.185l46.913-76.052         \
                             c4.954-8.159,15.735-10.781,24.185-5.828c8.159,4.954,10.781,15.735,5.828,24.185l-46.913,76.052                                  \
                             c-3.205,5.245-9.033,8.45-14.861,8.45C360.137,533.24,356.932,532.366,354.018,530.617z"
    };

    /*
     * This class inherit from 'CoordinateChart' and it is used to render weather blocks.
     *
     * @version	v1.0, 08/07/2015
     * @author	Eddie Yeh
     */
    sr.WeatherChart = function(id, config) {
        CoordinateChart.call(this, id, config, EMPTY_EVENTS);

        this.blockHeight = (config.blockHeight || 200);
        this.blockWidth  = (config.blockWidth || 100);
        this.blockStyle  = config.blockStyle;
        this.conditionStyle = config.conditionStyle;
        this.iconStyle = config.iconStyle;
        this.tempStyle = config.tempStyle;
    };

    sr.WeatherChart.prototype = Object.create(CoordinateChart.prototype);
    sr.WeatherChart.prototype.constructor = sr.WeatherChart;

    sr.WeatherChart.prototype.addGraph = function(parent, data) {
        var xScale = this.xScale;
        var yScale = this.yScale;

        var svg = createContainer(parent, this);

        var xOffset = -(this.blockWidth / 2.0);
        var yOffset = -(this.blockHeight / 2.0);
        var nodes = svg.selectAll("g")
                       .data(data)
                       .enter()
                       .append("g")
                       .attr("transform", function(d) {
                           return "translate(" + (xScale(d.x) + xOffset) + "," + (yScale(d.y) + yOffset) + ")";
                       });

        nodes.append("rect")
             .attr("height", this.blockHeight)
             .attr("width", this.blockWidth)
             .style(this.blockStyle);

        nodes.append("path")
             .attr("transform", "scale(" + .1 + "," + .1 + ")" + "translate(" + (this.blockWidth * 2) + "," + (this.blockHeight * 2.2) + ")")
             .attr("d", function(d) { return weatherPaths[d.condition]; })
             .style(this.iconStyle);

        nodes.append("text")
             .attr("x", (this.blockWidth * .15))
             .attr("y", (this.blockHeight * .75))
             .style(this.tempStyle)
             .text(function(d) { return d.temperature; });

        nodes.append("text")
             .attr("x", (this.blockWidth * .15))
             .attr("y", (this.blockHeight * .9))
             .style(this.conditionStyle)
             .text(function(d) { return d.condition; });

        renderAxis(this, svg, "x", 0, ((this.xOrient === "bottom") ? this.height : 0));
        renderAxis(this, svg, "y", ((this.yOrient === "right") ? this.width : 0), 0);
    };

})();

})();