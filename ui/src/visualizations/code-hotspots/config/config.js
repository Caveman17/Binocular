'use strict';

import {
  connect
} from 'react-redux';

import {
  setActiveFile,
  setActivePath,
  setActiveBranch
} from '../sagas';
import styles from '../styles.scss';
import FileBrowser from './fileBrowser';
import Promise from 'bluebird';
import {graphQl} from '../../../utils';
import React from 'react';

const mapStateToProps = (state /*, ownProps*/) => {
  const State = state.visualizations.codeHotspots.state;

  return {
    fileURL: State.data.data.fileURL,
    path: State.data.data.path,
    branch: State.data.data.branch,
    files: State.data.data.files,
    branches: State.data.data.branches};
};

const mapDispatchToProps = (dispatch /*, ownProps*/) =>{
  return {
    onSetFile: url => dispatch(setActiveFile(url)),
    onSetPath: path => dispatch(setActivePath(path)),
    onSetBranch: branch => dispatch(setActiveBranch(branch))
  };
};

const CodeHotspotsConfigComponent = props => {
  let options = [];
  for (let i in props.branches) {
    options.push(<option key={i}>{props.branches[i].branch}</option>);
  }
  return (
    <div className={styles.config}>
      <div className={"label"}> Branch:</div>
      <div className={"select"}>
        <select value={props.branch} onChange={e => {
          props.onSetBranch(e.target.value)}}>
          {options}
        </select>
      </div>
      <div>
        <FileBrowser
          files={props.files}
          props={props}
        />
      </div>
    </div>
  );
};

const CodeHotspotsConfig = connect(mapStateToProps, mapDispatchToProps)(CodeHotspotsConfigComponent);

export default CodeHotspotsConfig;




