/* eslint-disable no-param-reassign */
import d3 from 'd3';
import PropTypes from 'prop-types';
import {getColorFromScheme} from '../modules/colors';
import './waterfall.css';

const propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  colorScheme: PropTypes.string,
  waterfallStart: PropTypes.number,
  metric: PropTypes.string,
  showLegend: PropTypes.bool,
};
// SECONDARY FUNCTIONS //
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
      sums.push({[obj]: sum});
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

// MAIN FUNCTION //
function waterfallViz(element, props) {
  console.log('element', element);
  console.log('props', props);
  PropTypes.checkPropTypes(propTypes, props, 'prop', 'WaterfallViz');
  const {
    data,
    metric,
    width,
    height,
    waterfallStart,
    colorScheme,
    showLegend,
  } = props;

  element.innerHTML = '';

  const div = d3.select(element);

  const margin = {top: 0.2 * height, right: 40, bottom: 40, left: 50};

  const x0 = d3.scale.ordinal()
    .rangeRoundBands([0, width - 2 * margin.left], 0, 0.1);

  const x1 = d3.scale.ordinal();

  const y = d3.scale.linear()
    .range([0.75 * height, 0]);

  const color = d3.scale.ordinal()
    .range(['#2DBAD4', '#33CC33', '#00E6B8', '#C9081D']);

  const xAxis = d3.svg.axis()
    .scale(x0)
    .orient('bottom');

  const yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .tickFormat(d3.format('.2s'));

  const svg = div.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


  // If there is series breakdown data, we draw a complex waterfall
  if (isThereBreakdown(data)) {
    const categories = getBreakdownCategories(data);
    const heightEntries = getHeights(data, waterfallStart);
    const lastEntry = heightEntries.slice(-1)[0];
    const lastHeight = getLastHeight(waterfallStart, getSeriesSums(data));
    data.xResult = 'something';
    const test = Object.entries(data);

    x0.domain(test.map(function (d) {
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

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + 0.75 * height + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text(metric);

    const state = svg.selectAll('.state')
      .data(heightEntries)
      .enter().append('g')
      .attr('class', 'g')
      .attr('id', function (d) {
        let id = Math.floor(Math.random() * 10000).toString();
        if (d === lastEntry) {
          id = 'LastEntry';
        }
        return id;
      })
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
      .style('fill', function (d) {
        return getColorFromScheme(d.name, colorScheme);
      });
    // Hook onto last group in the state object
    svg.selectAll('.state')
      .data([lastHeight])
      .enter()
      .append('g')
      .attr('class', 'g')
      .attr('transform', function () {
        return 'translate(' + x0(' ') + ',0)';
      })
      .append('rect')
      .attr('width', x1.rangeBand())
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
      });


    // Legend
    if (showLegend) {
      const legend = svg.selectAll('.legend')
        .data(categories.slice().reverse())
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
          return 'translate(0,' + i * 0.03 * (-height) + ')';
        });

      legend.append('rect')
        .attr('x', (width / 3) - 18)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', function (d) {
          return getColorFromScheme(d, colorScheme);
        });

      legend.append('text')
        .attr('x', (width / 3) - 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(function (d) {
          return d;
        });
    }
  }
}

waterfallViz.propTypes = propTypes;

function adaptor(slice, payload) {
  const {selector, formData} = slice;
  const {color_scheme: colorScheme, waterfall_start: waterfallStart, show_legend: showLegend} = formData;
  const element = document.querySelector(selector);
  console.log('Formdata', formData);

  return waterfallViz(element, {
    data: payload.data.data,
    metric: payload.data.metric,
    width: slice.width(),
    height: slice.height(),
    colorScheme,
    waterfallStart,
    showLegend,
  });
}

export default adaptor;
