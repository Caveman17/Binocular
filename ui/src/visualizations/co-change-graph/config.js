'use strict';

import Promise from 'bluebird';
import _ from 'lodash';
import { connect } from 'react-redux';
import { inflect } from 'inflection';

import SearchBox from '../../components/SearchBox';
import FilterBox from '../../components/FilterBox';
import styles from './styles.scss';
import { onNavigationModeChange } from './sagas';

import { graphQl, emojify } from '../../utils';
import { createAction } from 'redux-actions';

//export const onNavigationModeChange = createAction('ON_NAVIGATION_MODE_CHANGE');

const mapStateToProps = (state /*, ownProps*/) => {
  const coChangeState = state.visualizations.CoChangeGraph.state;

  return {
    navigationMode: coChangeState.config.navigationMode,
  };
};

const mapDispatchToProps = (dispatch /*, ownProps*/) => {
  return {
    onNavigationModeChange: navigationMode => dispatch(onNavigationModeChange(navigationMode))
  };
};

const CoChangeConfigComponent = props => {
  return (
    <div className={styles.configContainer}>
      <form>
      <div className="field">
          <div className="control">
            <label className="label">Navigation Mode:</label>
            <label className="radio">
              <input
                name="navigationMode"
                type="radio"
                checked={props.navigationMode === 'pan'}
                onChange={() => props.onNavigationModeChange('pan')}
              />
              Pan
            </label>
            <label className="radio">
              <input
                name="navigationMode"
                type="radio"
                checked={props.navigationMode === 'highlight'}
                onChange={() => props.onNavigationModeChange('highlight')}
              />
              Highlight
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

const CoChangeConfig = connect(mapStateToProps, mapDispatchToProps)(CoChangeConfigComponent);

export default CoChangeConfig;
