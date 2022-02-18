'use strict'

const {
  assign,
  forEach,
  isArray,
  isPlainObject,
  unset,
  unionBy,
} = require('lodash')

class ServerlessMergeConfig {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'before:package:initialize': this.mergeConfig.bind(this),
      'before:offline:start:init': this.mergeConfig.bind(this),
      'before:invoke:local:invoke': this.mergeConfig.bind(this)
    }
  }

  mergeConfig () {
    this.deepMerge(this.serverless.service)
  }

  deepMerge (obj, parent) {
    forEach(obj, (value, key, collection) => {
      if (key === '$<<[Name]' && isArray(parent)) {
        unset(obj, key);
        if (isArray(value)) {
          const mergedArray = unionBy(parent, value, 'Name').filter(v => Object.keys(v).length !== 0);

          // Clean parent from old variables
          while (parent.length > 0) {
            parent.pop();
          }

          // Insert new values into parent
          for (const value of mergedArray) {
            parent.push(value);
          }
        }
      }

      if (isPlainObject(value) || isArray(value)) {
        this.deepMerge(value, obj);
      }

      if (key === '$<<') {
        if (isArray(value)) {
          value.forEach((subValue) => {
            this.assignValue(collection, subValue)
          })
        } else {
          this.assignValue(collection, value)
        }
        unset(obj, key)
      }
    })
  }

  assignValue (collection, value) {
    if (isPlainObject(value)) {
      // Only merge objects
      assign(collection, value)
    }
  }
}

module.exports = ServerlessMergeConfig
