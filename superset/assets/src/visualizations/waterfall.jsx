/* eslint-disable no-param-reassign */
import d3 from 'd3';
import PropTypes from 'prop-types';
import { getColorFromScheme } from '../modules/colors';
import './waterfall.css';

const propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  colorScheme: PropTypes.string,
  waterfallStart: PropTypes.number,
  waterFallStartMethod: PropTypes.bool,
  breakdownSorted: PropTypes.bool,
  metric: PropTypes.string,
  showLegend: PropTypes.bool,
};
// SECONDARY FUNCTIONS //
// For Hovering
// on mouseover for the legend symbol
function cellover(d) {
  // Dim all blobs
  d3.selectAll('.rectArea')
    .transition().duration(200)
    .style('fill-opacity', 0.2);
  // Bring back the hovered over blob
  d3.selectAll('.' + d)
    .transition().duration(200)
    .style('fill-opacity', 0.9);
}

// on mouseout for the legend symbol
function cellout() {
  // Bring back all blobs
  d3.selectAll('.rectArea')
    .transition().duration(200)
    .style('fill-opacity', 0.9);
}

// Complex (categorized) Waterfall Related //
// Check whether there is further breakdown of series (into legend categories)
function isThereBreakdown(data) {
  for (const obj in data) {
    if (data[obj].values) {
      return true;
    }
  }
  return false;
}

function getBreakdownCategories(data) {
  const categories = ['start'];
  for (const obj in data) {
    if (data[obj].values) {
      for (const value in data[obj].values) {
        const categoryIncluded = categories.find(category => category === value);
        if (!categoryIncluded) {
          categories.push(value);
        }
      }
    }
  }
  return categories;
}

function getSeriesSums(data) {
  const sums = [];
  for (const obj in data) {
    let sum = 0;
    if (data[obj].values) {
      for (const value in data[obj].values) {
        sum += data[obj].values[value];
      }
      sums.push({ [obj]: sum });
    }
  }
  return sums;
}

function getFirstHeightEntry(firstObj, start) {
  const entry = [{
    seriesName: firstObj[0],
    name: 'Start',
    value: start,
    baseHeight: 0,
  }];
  for (const value in firstObj[1].values) {
    let tempValue = firstObj[1].values[value];
    let tempB = start;
    if (tempB + tempValue < tempB) {
      tempB += tempValue;
      tempValue = Math.abs(tempValue);
    }
    entry.push({
      seriesName: firstObj[0],
      name: value,
      value: tempValue,
      baseHeight: tempB,
    });
    start += firstObj[1].values[value];
  }
  return entry;
}

function getNextEntry(prevEntry, prevSum, currentObj) {
  const entry = [{
    seriesName: currentObj[0],
    name: 'Start',
    value: prevEntry[0].value + prevSum,
    baseHeight: 0,
  }];
  let baseH = prevEntry[0].value + prevSum;
  for (const value in currentObj[1].values) {
    let tempValue = currentObj[1].values[value];
    let tempB = baseH;
    if (tempB + tempValue < tempB) {
      tempB += tempValue;
      tempValue = Math.abs(tempValue);
    }
    entry.push({
      seriesName: currentObj[0],
      name: value,
      value: tempValue,
      baseHeight: tempB,
    });
    baseH += currentObj[1].values[value];
  }
  return entry;
}

function appendRemainingHeightEntries(firstEntry, remDataEntries, sums, firstName) {
  const entries = [];
  entries.push(firstEntry);
  let prev = firstEntry;
  let prevSumEntry = sums.find(sum => Object.entries(sum)[0][0] === firstName);
  let prevSum = Object.entries(prevSumEntry)[0][1];
  let temp = remDataEntries.slice(0);
  if (remDataEntries.slice(-1)[0][0] === 'xResult') {
    temp = remDataEntries.slice(0, -1);
  }
  for (const e in temp) {
    const next = getNextEntry(prev, prevSum, temp[e]);
    entries.push(next);
    prevSumEntry = sums.find(sum => Object.entries(sum)[0][0] === temp[e][0]);
    prevSum = Object.entries(prevSumEntry)[0][1];
    prev = next;
  }
  return entries;
}


function getHeights(data, start) {
  const sums = getSeriesSums(data);
  const firstEntry = getFirstHeightEntry(Object.entries(data)[0], start, sums);
  const heightEntries = appendRemainingHeightEntries(firstEntry,
    Object.entries(data).slice(1), sums, Object.entries(data)[0][0]);
  return heightEntries;
}


function getLastHeight(start, sums) {
  let total = 0;
  for (const sum in sums) {
    const temp = Object.entries(sums[sum])[0][1];
    total += temp;
  }
  const baseHeight = 0;
  const value = total + start;
  return {
    baseHeight,
    value,
  };
}

function getLegendWidthByCategoryStringLength(categories) {
  let longest = 0;
  const MULTIPLIER = 20;
  for (const category of categories) {
    const length = category.length;
    if (length > longest) {
      longest = length;
    }
  }
  return Math.round(longest * MULTIPLIER);
}

// Secondary Functions for simple waterfall (no categories)
function getSimpleHeights(data, start, resultant, generateInitialBar) {
  let startHeight = {
    seriesName: Object.entries(data)[0][0],
    baseHeight: start,
    value: Object.entries(data)[0][1].value,
  };
  let heights;
  if (!generateInitialBar) {
    heights = [startHeight];
    let newBase = startHeight.baseHeight + startHeight.value;
    for (const d of Object.entries(data).slice(1)) {
      const height = {
        seriesName: d[0],
        baseHeight: newBase,
        value: d[1].value,
      };
      heights.push(height);
      newBase = height.baseHeight + height.value;
    }
    const lastHeight = {
      seriesName: 'Resultant',
      baseHeight: start,
      value: resultant - start,
    };
    heights.push(lastHeight);
  } else {
    const secondHeight = startHeight;
    startHeight = {
      seriesName: 'Start',
      baseHeight: 0,
      value: start,
    };
    heights = [startHeight, secondHeight];
    let newBase = secondHeight.baseHeight + secondHeight.value;
    for (const d of Object.entries(data).slice(1)) {
      const height = {
        seriesName: d[0],
        baseHeight: newBase,
        value: d[1].value,
      };
      heights.push(height);
      newBase = height.baseHeight + height.value;
    }
    const lastHeight = {
      seriesName: 'Resultant',
      baseHeight: 0,
      value: resultant,
    };
    heights.push(lastHeight);
  }

  return heights;
}

function getSimpleResultant(data, start) {
  let total = start;
  for (const entry of Object.entries(data)) {
    total += entry[1].value;
  }
  return total;
}

function getSimpleEntries(data, resultantValue, generateInitialBar) {
  let temp;
  if (generateInitialBar) {
    temp = [['Start', { value: 'n/a' }]].concat(Object.entries(data));
    temp.push(['Resultant', { value: resultantValue }]);
  } else {
    temp = Object.entries(data);
    temp.push(['Resultant', { value: resultantValue }]);
  }
  return temp;
}

// MAIN FUNCTION //
function waterfallViz(element, props) {
  PropTypes.checkPropTypes(propTypes, props, 'prop', 'WaterfallViz');
  const {
    data,
    metric,
    width,
    height,
    waterfallStart,
    waterFallStartMethod,
    breakdownSorted,
    colorScheme,
    showLegend,
  } = props;


  element.innerHTML = '';


  const div = d3.select(element);

  const margin = { top: 0.2 * height, right: 40, bottom: 40, left: 50 };

  const x0 = d3.scale.ordinal()
    .rangeRoundBands([0, width - 2 * margin.left], 0, 0.1);

  const x1 = d3.scale.ordinal();

  const y = d3.scale.linear()
    .range([0.75 * height, 0]);

  const xAxis = d3.svg.axis()
    .scale(x0)
    .orient('bottom');

  const yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .tickFormat(d3.format('.2s'));

  const chartSvg = div.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // If there is series breakdown data, we draw a complex waterfall
  if (isThereBreakdown(data)) {
    const modifiedData = data;
    if (!breakdownSorted) {
      // If the breakdown data is not sorted, sort it ascendingly here
      for (const d in modifiedData) {
        modifiedData[d].values = Object.entries(modifiedData[d].values)
          .sort()
          .reduce((o, [k, v]) => (o[k] = v, o), {});
      }
    }
    const categories = getBreakdownCategories(modifiedData);
    const heightEntries = getHeights(modifiedData, waterfallStart);

    const lastHeight = getLastHeight(waterfallStart, getSeriesSums(modifiedData));
    modifiedData.xResult = 'something';
    const entries = Object.entries(modifiedData);

    x0.domain(entries.map(function (d) {
      if (d[0] === 'xResult') {
        return ' ';
      }
      return d[0];
    }));
    x1.domain(categories).rangeRoundBands([0, x0.rangeBand()]);

    y.domain([0, d3.max(heightEntries, function (h) {
      return d3.max(h, function (_h) {
        return _h.value + _h.baseHeight;
      });
    })]);

    chartSvg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + 0.75 * height + ')')
      .call(xAxis);

    chartSvg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text(metric);

    const state = chartSvg.selectAll('.state')
      .data(heightEntries)
      .enter().append('g')
      .attr('class', 'g')
      .attr('transform', function (d) {
        return 'translate(' + x0(d[0].seriesName) + ',0)';
      });
    state.selectAll('rect')
      .data(function (d) {
        return d;
      })
      .enter().append('rect')
      .attr('width', x1.rangeBand())
      .attr('x', function (d) {
        return x1(d.name);
      })
      .attr('y', function (d) {
        return y(Math.abs(d.value + d.baseHeight));
      })
      .attr('height', function (d) {
        return Math.abs(0.75 * height - y(d.value));
      })
      .attr('class', function (d) {
        return 'rectArea ' + d.name;
      })
      .style('fill-opacity', 0.9)
      .style('fill', function (d) {
        return getColorFromScheme(d.name, colorScheme);
      })

      .on('mouseover', function () {
        // Dim all rects
        d3.selectAll('.rectArea')
          .transition().duration(200)
          .style('fill-opacity', 0.2);
        // Bring back hovered rect
        d3.select(this)
          .transition().duration(200)
          .style('fill-opacity', 0.9);
      })

      .on('mouseout', function () {
        d3.selectAll('.rectArea')
          .transition().duration(200)
          .style('fill-opacity', 0.9);
      });


    // Hook onto last group in the state object
    chartSvg.selectAll('.state')
      .data([lastHeight])
      .enter()
      .append('g')
      .attr('class', 'g')

      .attr('transform', function () {
        return 'translate(' + x0(' ') + ',0)';
      })
      .append('rect')
      .attr('width', x1.rangeBand())
      .attr('class', function (d) {
        return 'rectArea ' + d.name;
      })
      .attr('fill-opacity', 0.7)
      .attr('x', function () {
        return x1('Start');
      })
      .attr('y', function () {
        return y(Math.abs(lastHeight.value + lastHeight.baseHeight));
      })
      .attr('height', function () {
        return Math.abs(0.75 * height - y(lastHeight.value));
      })
      .style('fill', function () {
        return getColorFromScheme('Start', colorScheme);
      })
      .on('mouseover', function () {
        // Dim all rects
        d3.selectAll('.rectArea')
          .transition().duration(200)
          .style('fill-opacity', 0.2);
        // Bring back hovered rect
        d3.select(this)
          .transition().duration(200)
          .style('fill-opacity', 0.9);
      })

      .on('mouseout', function () {
        d3.selectAll('.rectArea')
          .transition().duration(200)
          .style('fill-opacity', 0.9);
      });


    // Legend
    if (showLegend) {
      const legendPosition = { x: 25, y: 0 };
      const legend = chartSvg.append('g')
        .attr('transform', 'translate(' + legendPosition.x + ',' + legendPosition.y + ')');
      const rectHeight = 30 * categories.length;
      const rectWidth = getLegendWidthByCategoryStringLength(categories);

      // Legend background
      legend.append('rect')
        .attr('x', 10)
        .attr('y', 10)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('id', 'legend-container')
        .style('fill', () => getColorFromScheme('Legend', colorScheme))
        .style('opacity', 0.4);
      // Legend text
      legend
        .selectAll('text')
        .data(categories.slice().reverse())
        .enter()
        .append('text')
        .attr('x', 40)
        .attr('y', (d, i) => (i + 1) * 30)
        .text(d => d)
        .style('fill', d => getColorFromScheme(d, colorScheme));
      // Legend circles
      legend
        .selectAll('circle')
        .data(categories.slice().reverse())
        .enter()
        .append('circle')
        .attr('cx', 25)
        .attr('cy', (d, i) => ((i + 1) * 30) - 5)
        .attr('r', 10)
        .style('fill', d => getColorFromScheme(d, colorScheme))
        .on('mouseover', (d) => {
          cellover(d);
        })
        .on('mouseout', function () {
          cellout();
        });
    }
  } else {
    // There is no breakdown data, draw a simple waterfall
    const resultantValue = getSimpleResultant(data, waterfallStart, waterFallStartMethod);
    const heightEntries = getSimpleHeights(data, waterfallStart, resultantValue, waterFallStartMethod);
    const temp = getSimpleEntries(data, resultantValue, waterFallStartMethod);
    // Axes
    x0.domain(temp.map(function (d) {
      return d[0];
    }));

    y.domain([0, d3.max(heightEntries, function (h) {
      return h.value + h.baseHeight;
    })]);

    chartSvg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + 0.75 * height + ')')
      .call(xAxis);

    chartSvg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text(metric);

    const state = chartSvg.selectAll('.state')
      .data(heightEntries)
      .enter().append('rect')
      .attr('class', (d) => {
        if (d.seriesName !== 'Resultant' && d.seriesName !== 'Start') {
          if (d.value < 0) {
            return 'rectArea Decrease';
          }
          return 'rectArea Increase';
        }
        return 'rectArea ' + d.seriesName;
      })
      .attr('x', function (d) {
        return x0(d.seriesName);
      })
      .attr('y', function (d) {
        if (d.value < 0) {
          return y(Math.abs(d.baseHeight));
        }
        return y(Math.abs(d.value + d.baseHeight));

      })
      .attr('width', x0.rangeBand() * 0.95)
      .attr('height', function (d) {
        return Math.abs(0.75 * height - y(Math.abs(d.value)));
      })
      .style('fill', function (d) {
        if (d.seriesName === 'Resultant' || d.seriesName === 'Start') {
          return getColorFromScheme(d.seriesName, colorScheme);
        } else if (d.value < 0) {
          return getColorFromScheme('Decrease', colorScheme);
        }
        return getColorFromScheme('Increase', colorScheme);

      })
      .style('fill-opacity', 0.9)
      .on('mouseover', function () {
        // Dim all rects
        d3.selectAll('.rectArea')
          .transition().duration(200)
          .style('fill-opacity', 0.2);
        // Bring back hovered rect
        d3.select(this)
          .transition().duration(200)
          .style('fill-opacity', 0.9);
      })
      .on('mouseout', function () {
        d3.selectAll('.rectArea')
          .transition().duration(200)
          .style('fill-opacity', 0.9);
      });

    if (showLegend) {
      const legendPosition = { x: 25, y: 0 };
      const legend = chartSvg.append('g')
        .attr('transform', 'translate(' + legendPosition.x + ',' + legendPosition.y + ')');
      let rectHeight = 120;
      const rectWidth = 150;
      let legendData = ['Start', 'Increase', 'Decrease', 'Resultant'];
      // If we are not providing a start bar
      if (!waterFallStartMethod) {
        rectHeight = 90;
        legendData = ['Increase', 'Decrease', 'Resultant'];
      }
      // Legend background
      legend.append('rect')
        .attr('x', 10)
        .attr('y', 10)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('id', 'legend-container')
        .style('fill', () => getColorFromScheme('Legend', colorScheme))
        .style('opacity', 0.4);
      // Legend text
      legend
        .selectAll('text')
        .data(legendData)
        .enter()
        .append('text')
        .attr('x', 40)
        .attr('y', (d, i) => (i + 1) * 30)
        .text(d => d)
        .style('fill', d => getColorFromScheme(d, colorScheme));
      // Legend circles
      legend
        .selectAll('circle')
        .data(legendData)
        .enter()
        .append('circle')
        .attr('cx', 25)
        .attr('cy', (d, i) => ((i + 1) * 30) - 5)
        .attr('r', 10)
        .style('fill', d => getColorFromScheme(d, colorScheme))
        .on('mouseover', (d) => {
          cellover(d);
        })
        .on('mouseout', function () {
          cellout();
        });
    }
  }
}

waterfallViz.propTypes = propTypes;

function adaptor(slice, payload) {
  const { selector, formData } = slice;
  const {
    color_scheme: colorScheme,
    waterfall_start: waterfallStart, show_legend: showLegend,
    waterFallStartMethod,
  } = formData;
  const element = document.querySelector(selector);

  return waterfallViz(element, {
    data: payload.data.data,
    metric: payload.data.metric,
    breakdownSorted: payload.data.breakdown_sorted,
    width: slice.width(),
    height: slice.height(),
    colorScheme,
    waterfallStart,
    waterFallStartMethod,
    showLegend,
  });
}

export default adaptor;
