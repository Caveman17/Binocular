'use strict';

const log = require('debug')('srv');
const ctx = require('../context.js');
const { io } = require('../context.js');
const config = require('../config.js');
const Git = require('nodegit');
const Promise = require('bluebird');
const Repository = require('../git');
const ProgressReporter = require('../progress-reporter');
const idx = require('../indexers');
const gitUtils = require('../git-utils.js');

// TODO: add logs, error handling, put indexer in context and stop indexing when stopping the program
module.exports = function (req, res) {
  // get the metadata of the parent/fork from the base project which should be indexed
  const repo = req.body.project;
  const owner = req.body.owner;

  // construct the path where the project should be cloned at/where the project is stored
  const projectsPath = config.get('projectsPath');
  if (!projectsPath) {
    // TODO: error handling
  }

  // fetch or clone the parent/fork of the base project
  const projectsOwnerPath = `${projectsPath}/${owner}`;
  const projectsProjectPath = `${projectsOwnerPath}/${repo}`;
  const projectsUrl = `https://github.com/${owner}/${repo}.git`;
  const projectPromise = gitUtils.fetchOrCloneRepo(projectsProjectPath, projectsUrl);

  // clone/fetch the base project locally from the path
  // is needed to also get the local commits of the repo and
  // to prevent unwanted changes of the original while trying to rebase, merge or cherry pick
  const projectsBaseProjectPath = `${projectsPath}/${ctx.repo.getOwner()}/${ctx.repo.getName()}`;
  const cloneOptionsBaseProject = new Git.CloneOptions();
  cloneOptionsBaseProject.local = Git.Clone.LOCAL.LOCAL;
  const baseProjectPromise = gitUtils.fetchOrCloneRepo(
    projectsBaseProjectPath,
    ctx.targetPath,
    cloneOptionsBaseProject,
    true
  );

  return Promise.join(projectPromise, baseProjectPromise)
    .then(([messageProject, messageBaseProject]) => {
      // log messages if the projects were cloned or fetched
      log(messageProject);
      log(messageBaseProject);

      // get the repository from the path
      return Repository.fromPath(projectsProjectPath);
    })
    .then((repository) => {
      // index the repository
      let reporter = new ProgressReporter(io, ['commits', 'issues', 'builds']);
      let indexer = idx.makeVCSIndexer(repository, reporter);
      return indexer.index();
    })
    .then(() => {
      log('finished indexing repository', `${owner}/${repo}`);
      res.json({});
    });
};