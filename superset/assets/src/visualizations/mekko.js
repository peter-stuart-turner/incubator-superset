/* eslint-disable no-shadow, no-param-reassign, no-underscore-dangle, no-use-before-define */
import d3 from 'd3';
import { tpColors } from '../modules/colors';

require('./mekko.css');

function mekko(slice, payload) {
  console.log('Payload', payload);
  console.log('Slice', slice);

  /* 'Globals used' */
  let width;
  let height;
  let data;
  let formData;
  const margin = 20;

  /* Select the element from DOM */
  const div = d3.select(slice.selector);

  /* Secondary Functions */
  function initialize() {
    div.selectAll('*').remove(); // Remove all previous things
    width = slice.width();
    height = slice.height();
    data = payload.data.mekkoData;
    formData = slice.formData;
  }
  /* Main Function */
  function drawMekko() {
    const x = d3.scale.linear()
      .range([0, width - 3 * margin]);

    const y = d3.scale.linear()
      .range([0, height - 3 * margin]);

    const z = d3.scale.category10();

    const n = d3.format(',d');
    const p = d3.format('%');

    const svg = div.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + 2 * margin + ',' + margin + ')');

    const offset = 0;
  console.log("DATA", data);
    // Nest values by segment. We assume each segment+market is unique.
    let segments = d3.nest()
      .key(function (d) {
        return d.segment;
      })
      .entries(data);
    console.log("segments", segments);
    // Compute the total sum, the per-segment sum, and the per-market offset.
    // You can use reduce rather than reduceRight to reverse the ordering.
    // We also record a reference to the parent segment for each market.
    const sum = segments.reduce(function (v, p) {
      return (p.offset = v) + (p.sum = p.values.reduceRight(function (v, d) {
        d.parent = p;
        return (d.offset = v) + d.value;
      }, 0));
    }, 0);

    // Add x-axis ticks.
    const xtick = svg.selectAll('.x')
      .data(x.ticks(10))
      .enter().append('g')
      .attr('class', 'x')
      .attr('transform', function (d) {
        return 'translate(' + x(d) + ',' + y(1) + ')';
      });

    xtick.append('line')
      .attr('y2', 6)
      .style('stroke', '#000');

    xtick.append('text')
      .attr('y', 8)
      .attr('text-anchor', 'middle')
      .attr('dy', '.71em')
      .text(p);

    // Add y-axis ticks.
    const ytick = svg.selectAll('.y')
      .data(y.ticks(10))
      .enter().append('g')
      .attr('class', 'y')
      .attr('transform', function (d) {
        return 'translate(0,' + y(1 - d) + ')';
      });

    ytick.append('line')
      .attr('x1', -6)
      .style('stroke', '#000');

    ytick.append('text')
      .attr('x', -8)
      .attr('text-anchor', 'end')
      .attr('dy', '.35em')
      .text(p);

    // Add a group for each segment.
    segments = svg.selectAll('.segment')
      .data(segments)
      .enter().append('g')
      .attr('class', 'segment')
      .attr('xlink:title', function (d) {
        return d.key;
      })
      .attr('transform', function (d) {
        return 'translate(' + x(d.offset / sum) + ')';
      });

    // Add a rect for each market.
    const markets = segments.selectAll('.market')
      .data(function (d) {
        return d.values;
      })
      .enter().append('a')
      .attr('class', 'market')
      .attr('xlink:title', function (d) {
        return d.market + ' ' + d.parent.key + ': ' + n(d.value);
      })
      .append('rect')
      .attr('y', function (d) {
        return y(d.offset / d.parent.sum);
      })
      .attr('height', function (d) {
        return y(d.value / d.parent.sum);
      })
      .attr('width', function (d) {
        return x(d.parent.sum / sum);
      })
      .style('fill', function (d) {
        return z(d.market);
      });
  }

  /* Where the magic happens */
  //initialize();
  //drawMekko();
}

module.exports = mekko;


//   const _draw = function (data, eltWidth, eltHeight, formData, meta) {
//
//     if (formData.bottom_margin === 'auto') {
//       formData.bottom_margin = 50;
//     }
//
//     const margin = { top: 25, right: 325, bottom: formData.bottom_margin, left: 50 };
//     const width = eltWidth - margin.left - margin.right;
//     const height = (eltHeight - margin.top - margin.bottom);
//
//     const x = d3.scale.linear()
//       .range([0, width]);
//
//     const y = d3.scale.linear()
//       .range([0, height]);
//
//     const z = d3.scale.ordinal().range(tpColors);
//
//
//     // const formatNumber = d3.format(meta['number_format']);
//
//     let n = d3.format(',.0f'),
//       p = d3.format('.0%');
//
//     const svg = div
//       .append('svg')
//       .attr('width', eltWidth)
//       .attr('height', eltHeight)
//       .append('g')
//       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
//
//     // console.log(meta);
//     // console.log(meta['x_axis']);
//
//     // Nest values by segment. We assume each segment+market is unique.
//     const segments = d3.nest()
//       .key(function (d) {
//         return d[meta.x_axis];
//       })
//       .entries(data);
//
//     // console.log(segments);
//
//     // Compute the total sum, the per-segment sum, and the per-market offset.
//     // You can use reduce rather than reduceRight to reverse the ordering.
//     // We also record a reference to the parent segment for each market.
//     const sum = segments.reduce(function (v, p) {
//       return (p.offset = v) + (p.sum = p.values.reduceRight(function (v, d) {
//         d.parent = p;
//         return (d.offset = v) + d[meta.metric];
//       }, 0));
//     }, 0);
//
//     // console.log(sum);
//
//     // Add y-axis ticks.
//     const ytick = svg.selectAll('.y')
//       .data(y.ticks(10))
//       .enter().append('g')
//       .attr('class', 'y')
//       .attr('transform', function (d) {
//         return 'translate(0,' + y(1 - d) + ')';
//       });
//
//     ytick.append('line')
//       .attr('x1', -6)
//       .style('stroke', '#000');
//
//     ytick.append('text')
//       .attr('x', -8)
//       .attr('text-anchor', 'end')
//       .attr('dy', '.35em')
//       .style('font-size', '12px')
//       .text(p);
//
//     // Add a group for each segment.
//     const segments_selection = svg.selectAll('.segment')
//       .data(segments)
//       .enter().append('g')
//       .attr('class', 'segment')
//       .attr('xlink:title', function (d) {
//         return d.key;
//       })
//       .attr('transform', function (d) {
//         return 'translate(' + x(d.offset / sum) + ')';
//       });
//
//     // Add a rect for each market.
//     const markets = segments_selection.selectAll('.market')
//       .data(function (d) {
//         return d.values;
//       })
//       .enter().append('a')
//       .attr('class', 'market')
//       .attr('id', function (d) {
//         return d[meta.y_axis].replace(' ', '').replace(',', '');
//       })
//       .attr('xlink:title', function (d) {
//         return d[meta.y_axis] + ' ' + d.parent.key + ': ' + n(d[meta.metric]);
//       })
//       .append('rect')
//       .attr('y', function (d) {
//         if (d.parent.sum > 0) {
//           return y(d.offset / d.parent.sum);
//         }
//           return 0;
//
//       })
//       .attr('height', function (d) {
//         if (d.parent.sum > 0) {
//           return y(d[meta.metric] / d.parent.sum);
//         }
//           return 0;
//
//       })
//       .attr('width', function (d) {
//         return x(d.parent.sum / sum);
//       })
//       .style('fill', function (d) {
//         return z(d[meta.y_axis]);
//       });
//
//     // console.log(segments);
//
//     const legend = svg
//       .append('g')
//       .attr('class', 'legend')
//       .selectAll('.legend_market')
//       .data(segments[0].values)
//       .enter()
// .append('g')
//       .attr('id', function (d) {
//         return d[meta.y_axis].replace(' ', '').replace(',', '');
//       })
//       .attr('transform', function (d, i) {
//         return 'translate(' + (margin.left + width + 5) + ', ' + i * 20 + ')';
//       });
//
//
//     legend.each(function (d) {
//       const id = this.id;
//
//       d3.select(this)
//         .append('a')
//         .append('rect')
//         .attr('width', 15)
//         .attr('height', 15)
//         .style('fill', function (d) {
//           return z(d[meta.y_axis]);
//         });
//
//       d3.select(this)
//         .append('text')
//         .style('font-size', '14px')
//         .text(function (d) {
//           return d[meta.y_axis];
//         })
//         .attr('transform', function (d) {
//           return 'translate(' + 25 + ',' + 15 + ')';
//         });
//
//       d3.select(this)
//         .on('mouseover', function (d) {
//           d3.selectAll('.market')
//             .filter(function (d) {
//               return id != this.id;
//             })
//             .style('opacity', 0.2);
//         })
//         .on('mouseout', function (d) {
//           d3.selectAll('.market')
//             .style('opacity', 1)
//             .selectAll('rect')
//             .style('stroke', '#000');
//         });
//     });
//
//     // Bar descriptions
//     d3.selectAll('.segment').each(function () {
//       const box_width = this.getBBox().width;
//       d3.select(this)
//         .append('text')
//         .attr('text-anchor', 'end')
//         .attr('transform', function (d) {
//           return 'translate(' + (box_width / 2) + ', ' + (height + 10) + ') rotate(-45)';
//         })
//         .append('tspan')
//         .text(d3.select(this)
//           .attr('title'))
//         .attr('font-size', '12px');
//     });
//   };
//
//   // Prevents duplicating svg graphs
//   div.selectAll('*').remove();
//   const width = slice.width();
//   const height = slice.height();
//
//   _draw(payload.data.data, width, height, payload.form_data, payload.data.meta);
