'use strict';

import Promise from 'bluebird';
import _ from 'lodash';
import { connect } from 'react-redux';
import { inflect } from 'inflection';

import SearchBox from '../../components/SearchBox';
import FilterBox from '../../components/FilterBox';
import styles from './styles.scss';

import { graphQl, emojify } from '../../utils';

const mapStateToProps = (state /*, ownProps*/) => {

  return {
  };
};

const mapDispatchToProps = (dispatch /*, ownProps*/) => {
  return {
  };
};

const CoChangeConfigComponent = props => {
  return (
    <div>Config Test!</div>
  );
};

const CoChangeConfig = connect(mapStateToProps, mapDispatchToProps)(CoChangeConfigComponent);

export default CoChangeConfig;
