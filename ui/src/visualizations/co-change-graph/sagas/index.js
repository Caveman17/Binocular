'use strict';

import { createAction } from 'redux-actions';
import { select, takeEvery, fork, throttle } from 'redux-saga/effects';
import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';

import { fetchFactory, timestampedActionFactory, mapSaga } from '../../../sagas/utils.js';
import { graphQl } from '../../../utils';

export const onNavigationModeChange = createAction('ON_NAVIGATION_MODE_CHANGE');

export default function*() {
  yield testFunction();
  yield fork(watchNavigationChange);
}

export function* watchNavigationChange() {
  yield takeEvery('ON_NAVIGATION_MODE_CHANGE', testFunction);
}

export const testFunction = fetchFactory(
  function*() {
    console.log("Saga worked!");
  }
);
