'use strict';

import React from 'react';
import Measure from 'react-measure';
import * as d3 from 'd3';
import cx from 'classnames';
import chroma from 'chroma-js';

import styles from './styles.scss';
import _ from 'lodash';
import Axis from './Axis.js';
import GridLines from './GridLines.js';
import CommitMarker from './CommitMarker.js';
import AsteriskMarker from '../../svg/AsteriskMarker.js';
import XMarker from '../../svg/XMarker.js';
import StackedArea from './StackedArea.js';
import Legend from '../../Legend';

import { parseTime, getChartColors } from '../../../utils.js';

export default class CodeOwnershipRiver extends React.Component {
  constructor(props) {
    super(props);

    this.elems = {};
    this.state = {
      dirty: true,
      dimensions: {
        fullWidth: 0,
        fullHeight: 0,
        width: 0,
        height: 0,
        wMargin: 0,
        hMargin: 0
      },
      transform: d3.zoomIdentity,
      isPanning: false
    };

    this.scales = {
      x: d3.scaleTime().rangeRound([0, 0]),
      y: d3.scaleLinear().rangeRound([0, 0])
    };

    this.updateDomain(props.data);
  }

  updateZoom(evt) {
    this.setState({ transform: evt.transform, dirty: true });
  }

  updateDimensions(dimensions) {
    const fullWidth = dimensions.width;
    const fullHeight = dimensions.height;
    const wPct = 0.7;
    const hPct = 0.7;

    const width = fullWidth * wPct;
    const height = fullHeight * hPct;
    const wMargin = (fullWidth - width) / 2;
    const hMargin = (fullHeight - height) / 2;

    this.scales.x.rangeRound([0, width]);
    this.scales.y.rangeRound([height, 0]);

    this.setState({
      dimensions: {
        fullWidth,
        fullHeight,
        width,
        height,
        wMargin,
        hMargin
      }
    });
  }

  updateDomain(data) {
    if (!data) {
      return;
    }

    const dateExtent = d3.extent(data, d => d.date);
    const commitCountExtent = d3.extent(data, d => d.commits.total);
    const issueCountExtent = d3.extent(data, t => t.issues.total);

    const min = arr => _.min(_.compact(arr));
    const max = arr => _.max(_.compact(arr));

    this.scales.x.domain(dateExtent);
    this.scales.y.domain([
      min([commitCountExtent[0], issueCountExtent[0]]),
      max([commitCountExtent[1], issueCountExtent[1]])
    ]);
  }

  componentWillReceiveProps(nextProps) {
    this.updateDomain(nextProps);
  }

  render() {
    if (!this.props.data || this.props.data.length === 0) {
      return <svg />;
    }

    const dims = this.state.dimensions;

    const translate = `translate(${dims.wMargin}, ${dims.hMargin})`;

    const x = this.state.transform.rescaleX(this.scales.x);
    const y = this.state.transform.rescaleY(this.scales.y);

    const today = x(new Date());

    const fullDomain = this.scales.x.domain();
    const visibleDomain = x.domain();

    const finalStats = _.last(this.props.data).commits.totalStats;
    const commitColors = getChartColors('spectral', _.keys(finalStats).sort());
    const fullSpan = fullDomain[1].getTime() - fullDomain[0].getTime();
    const visibleSpan = visibleDomain[1].getTime() - visibleDomain[0].getTime();

    const commitSeries = _.map(finalStats, (stats, signature) => {
      return {
        extract: c => {
          const stats = c.totalStats[signature];
          return stats ? stats.count : 0;
        },
        style: {
          fill: commitColors[signature]
        }
      };
    });

    return (
      <Measure bounds onResize={dims => this.updateDimensions(dims.bounds)}>
        {({ measureRef }) => (
          <div
            tabIndex="1"
            ref={measureRef}
            onKeyPress={e => this.onKeyPress(e)}
            className={styles.chartContainer}>
            <svg
              className={cx(styles.chart, { [styles.panning]: this.state.isPanning })}
              ref={svg => (this.elems.svg = svg)}>
              <defs>
                <clipPath id="chart">
                  <rect x="0" y="0" width={dims.width} height={dims.height} />
                </clipPath>
                <clipPath id="x-only">
                  <rect x="0" y={-dims.hMargin} width={dims.width} height={dims.fullHeight} />
                </clipPath>
              </defs>
              <g transform={translate}>
                <GridLines orient="left" scale={y} ticks="10" length={dims.width} />
                <GridLines orient="bottom" scale={x} y={dims.height} length={dims.height} />
                <g>
                  <Axis orient="left" ticks="10" scale={y} />
                  <text x={-dims.height / 2} y={-50} textAnchor="middle" transform="rotate(-90)">
                    Amount
                  </text>
                </g>
                <g>
                  <Axis orient="bottom" scale={x} y={dims.height} />
                  <text x={dims.width / 2} y={dims.height + 50} textAnchor="middle">
                    Time
                  </text>
                </g>
                <g clipPath="url(#chart)" className={cx(styles.commitCount)}>
                  <StackedArea
                    data={this.state.commits}
                    series={commitSeries}
                    x={c => x(c.date)}
                    y={values => y(_.sum(values))}
                    fillToRight={today}
                  />
                </g>
                <g className={styles.today} clipPath="url(#x-only)">
                  <text x={today} y={-10}>
                    Now
                  </text>
                  <line x1={today} y1={0} x2={today} y2={dims.height} />
                </g>
              </g>
            </svg>
          </div>
        )}
      </Measure>
    );
  }

  onKeyPress(e) {
    if (e.key === '=' || e.key === '0') {
      this.resetZoom();
    }
  }

  resetZoom() {
    this.setState({
      dirty: false,
      transform: d3.zoomIdentity
    });
  }

  componentWillUnmount() {
    if (this.zoom) {
      this.zoom.on('zoom', null);
      this.zoom.on('start', null);
      this.zoom.on('end', null);
    }
  }

  componentDidUpdate() {
    const svg = d3.select(this.elems.svg);

    this.zoom = d3
      .zoom()
      .scaleExtent([1, Infinity])
      .on('zoom', () => {
        this.constrainZoom(d3.event.transform, 50);
        this.updateZoom(d3.event);
      })
      .on('start', () => this.setState({ isPanning: d3.event.sourceEvent.type !== 'wheel' }))
      .on('end', () => this.setState({ isPanning: false }));

    svg.call(this.zoom);
  }

  constrainZoom(t, margin = 0) {
    const dims = this.state.dimensions;
    const [xMin, xMax] = this.scales.x.domain().map(d => this.scales.x(d));
    const [yMin, yMax] = this.scales.y.domain().map(d => this.scales.y(d));

    if (t.invertX(xMin) < -margin) {
      t.x = -(xMin - margin) * t.k;
    }
    if (t.invertX(xMax) > dims.width + margin) {
      t.x = xMax - (dims.width + margin) * t.k;
    }
    if (t.invertY(yMax) < -margin) {
      t.y = -(yMax - margin) * t.k;
    }
    if (t.invertY(yMin) > dims.height) {
      t.y = yMin - dims.height * t.k;
    }
  }

  activateLegend(legend) {
    this.setState({ hoverHint: legend });
  }
}

function extractCommitData(props) {
  const commitData = _.get(props, 'commits', []);
  const mentions = _.get(props, 'highlightedIssue.mentions', []);
  const highlightedCommits = [];

  const stats = {};
  const totalStats = {
    changes: 0,
    count: 0
  };

  const commits = _.map(commitData, function(c) {
    if (!(c.signature in stats)) {
      stats[c.signature] = { count: 0, changes: 0 };
    }

    const changes = _.get(c, 'stats.additions', 0) + _.get(c, 'stats.deletions', 0);
    stats[c.signature].changes += changes;
    stats[c.signature].count++;
    totalStats.changes += changes;
    totalStats.count++;

    const ret = _.merge({}, c, {
      sha: c.sha,
      date: parseTime(c.date),
      totalStats: _.mapValues(stats, s => ({
        count: s.count,
        changes: s.changes / totalStats.changes * totalStats.count
      }))
    });
    if (_.includes(mentions, c.sha)) {
      highlightedCommits.push(ret);
    }

    return ret;
  });

  return { commits: commits, highlightedCommits };
}

function extractIssueData(props) {
  const issueData = _.get(props, 'issues', []);

  // holds close dates of still open issues, kept sorted at all times
  const pendingCloses = [];

  // issues closed so far
  let closeCountTotal = 0;

  return _.map(issueData, function(t, i) {
    const issueData = _.merge({}, t, {
      id: t.iid,
      date: parseTime(t.createdAt),
      closedAt: parseTime(t.closedAt),
      count: i + 1
    });

    // the number of closed issues at the issue's creation time, since
    // the last time we increased closedCountTotal
    let closedCount = _.sortedIndex(pendingCloses, issueData.date);

    closeCountTotal += closedCount;
    issueData.closedCount = closeCountTotal;
    issueData.openCount = issueData.count - issueData.closedCount;

    // remove all issues that are closed by now from the "pending" list
    pendingCloses.splice(0, closedCount);

    if (issueData.closedAt) {
      // issue has a close date, be sure to track it in the "pending" list
      const insertPos = _.sortedIndex(pendingCloses, issueData.closedAt);
      pendingCloses.splice(insertPos, 0, issueData.closedAt);
    } else {
      // the issue has not yet been closed, indicate that by pushing
      // null to the end of the pendingCloses list, which will always
      // stay there
      pendingCloses.push(null);
    }

    return issueData;
  });
}
