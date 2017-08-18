'use strict';

const gql = require('graphql-sync');
const blameHunkType = require('./blameHunk.js');
const arangodb = require('@arangodb');
const db = arangodb.db;
const aql = arangodb.aql;
const commitsToBlameHunks = db._collection('commits-blameHunks');
const blameHunksToFiles = db._collection('blameHunks-files');
const commitsToStakeholders = db._collection('commits-stakeholders');

const JSONObject = new gql.GraphQLScalarType({
  name: 'JSONObject',
  serialize: id => id,
  parseValue: id => id,
  parseLiteral: ast => {
    if (ast.kind !== gql.Kind.OBJECT) {
      throw new gql.GraphQLError('Query error: Can only parse object but got a: ' + ast.kind, [
        ast
      ]);
    }

    return ast.value;
  }
});

module.exports = new gql.GraphQLObjectType({
  name: 'Commit',
  description: 'A single git commit',
  fields() {
    return {
      sha: {
        type: new gql.GraphQLNonNull(gql.GraphQLString),
        resolve: e => e._key
      },
      shortSha: {
        type: new gql.GraphQLNonNull(gql.GraphQLString),
        resolve: e => e._key.substring(0, 7)
      },
      message: {
        type: gql.GraphQLString,
        description: 'The commit message'
      },
      messageHeader: {
        type: gql.GraphQLString,
        description: 'Header of the commit message',
        resolve: c => c.message.split('\n')[0]
      },
      signature: {
        type: gql.GraphQLString,
        description: "The commit author's signature"
      },
      date: {
        type: gql.GraphQLString,
        description: 'The date of the commit'
      },
      linesPerAuthor: {
        type: JSONObject,
        description:
          'An object mapping git signatures to total number of lines last edited by that author'
      },
      hunks: {
        type: new gql.GraphQLList(blameHunkType),
        description: 'The hunks in this commit',
        args: {},
        resolve(commit /*, args*/) {
          return db
            ._query(
              aql`FOR hunk
                  IN
                  INBOUND ${commit} ${commitsToBlameHunks}
                  SORT hunk._key ASC
                    RETURN hunk`
            )
            .toArray();
        }
      },
      files: {
        type: new gql.GraphQLList(require('./file.js')),
        description: 'The files touched by this commit',
        args: {},
        resolve(commit /*, args*/) {
          return db
            ._query(
              aql`FOR hunk
                IN
                INBOUND ${commit} ${commitsToBlameHunks}
                  FOR file
                  IN
                  INBOUND
                  hunk ${blameHunksToFiles}
                    RETURN file`
            )
            .toArray();
        }
      },
      stakeholder: {
        type: require('./stakeholder.js'),
        description: 'The author of this commit',
        resolve(commit /*, args*/) {
          return db
            ._query(
              aql`
            FOR
            stakeholder
            IN
            INBOUND ${commit} ${commitsToStakeholders}
              RETURN stakeholder
          `
            )
            .toArray()[0];
        }
      }
    };
  }
});