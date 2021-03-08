'use strict';

import { handleActions } from 'redux-actions';
import _ from 'lodash';

export default handleActions(
  {
    SET_IS_LOADING: (state, action) => {
      return _.merge({}, state, { data: { isLoading: action.payload } });
    },
    // sets a state property to undefined
    RESET_STATE_PROPERTY: (state, action) => {
      const data = {};
      data[action.payload] = undefined;
      return _.assign({}, state, { data });
    },

    // switches the checked flag of a branch of the base project
    SWITCH_BRANCH_CHECKED_BASE_PROJECT: (state, action) => {
      const branchesBaseProject = _.assign([], state.data.branchesBaseProject);
      branchesBaseProject.filter(
        (branch) => branch.branchName === action.payload.branchName
      )[0].checked = action.payload.checked;
      return _.merge({}, state, { data: { branchesBaseProject } });
    },

    // switches the checked flag of a branch of the other project
    SWITCH_BRANCH_CHECKED_OTHER_PROJECT: (state, action) => {
      const branchesOtherProject = state.data.branchesOtherProject;
      branchesOtherProject.filter(
        (branch) => branch.branchName === action.payload.branchName
      )[0].checked = action.payload.checked;
      return _.merge({}, state, { data: { branchesOtherProject } });
    },

    // switches the checked flag of all branches of the base project
    SWITCH_ALL_BRANCH_CHECKED_BASE_PROJECT: (state, action) => {
      const branchesBaseProject = state.data.branchesBaseProject;
      branchesBaseProject.forEach((branch) => (branch.checked = action.payload));
      return _.merge({}, state, { data: { branchesBaseProject } });
    },

    // switches the checked flag of all branches of the other project
    SWITCH_ALL_BRANCH_CHECKED_OTHER_PROJECT: (state, action) => {
      const branchesOtherProject = state.data.branchesOtherProject;
      branchesOtherProject.forEach((branch) => (branch.checked = action.payload));
      return _.merge({}, state, { data: { branchesOtherProject } });
    },

    // request the conflict awareness data and reset the previous received ones
    REQUEST_CONFLICT_AWARENESS_DATA: (state) => {
      // reset the previously retrieved data
      let data = {};
      data.commits = undefined;
      data.branches = undefined;
      data.commitNodes = undefined;
      data.commitChildLinks = undefined;
      data.parent = state.data.parent;
      data.forks = state.data.forks;
      data.isLoading = true;

      return _.assign({}, state, { isFetching: true, data: data });
    },

    // receive the requested conflict aware data
    RECEIVE_CONFLICT_AWARENESS_DATA: (state, action) => {
      return _.merge({}, state, {
        data: action.payload,
        isFetching: false,
        receivedAt: action.meta.receivedAt,
      });
    },

    // request a diff of a commit
    REQUEST_DIFF: (state) => _.assign({}, state, { isFetching: true }),

    // receive the diff of a commit
    RECEIVE_DIFF: (state, action) => {
      return _.merge({}, state, {
        data: action.payload,
        isFetching: false,
        receivedAt: action.meta.receivedAt,
      });
    },

    // request a rebase check
    REQUEST_REBASE_CHECK: (state) =>
      _.merge({}, state, { isFetching: true, data: { rebaseCheck: undefined } }),

    // receive the result of a rebase check
    RECEIVE_REBASE_CHECK: (state, action) => {
      return _.merge({}, state, {
        data: action.payload,
        isFetching: false,
        receivedAt: action.meta.receivedAt,
      });
    },

    // request a merge check
    REQUEST_MERGE_CHECK: (state) =>
      _.merge({}, state, { isFetching: true, data: { mergeCheck: undefined } }),

    // receive the result of a merge check
    RECEIVE_MERGE_CHECK: (state, action) => {
      return _.merge({}, state, {
        data: action.payload,
        isFetching: false,
        receivedAt: action.meta.receivedAt,
      });
    },

    // request a cherry pick check
    REQUEST_CHERRY_PICK_CHECK: (state) =>
      _.merge({}, state, { isFetching: true, data: { cherryPickCheck: undefined } }),

    // receive the result of a cherry pick check
    RECEIVE_CHERRY_PICK_CHECK: (state, action) => {
      return _.merge({}, state, {
        data: action.payload,
        isFetching: false,
        receivedAt: action.meta.receivedAt,
      });
    },
  },
  {
    data: {},
    lastFetched: null,
    isFetching: null,
  }
);
