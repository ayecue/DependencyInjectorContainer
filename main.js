/*
 * dependency-injector-container
 * https://github.com/ayecue/DependencyInjectorContainer
 *
 * Copyright (c) 2015 "AyeCue" Sören Wehmeier, contributors
 * Licensed under the MIT license.
 */
;(function(name, definition) {
  var theModule = definition();
  var hasDefine = typeof define === 'function' && define.amd;
  var hasExports = typeof module !== 'undefined' && module.exports;
 
  if (hasDefine){ // AMD Module
    define(theModule);
  } else if (hasExports) { // Node.js Module
    module.exports = theModule;
  } else { // Assign to common namespaces or simply the global object (window)
    window[name] = theModule;
  }
})('DependencyInjectorContainer', function() {
/**
 * Dependency injector container like in AngualarJS.
 *
 * @class DependencyInjectorContainer
 * @constructor
 * @param {Object} scope  Scope for namespaces.
 * @private
 */
  function DependencyInjectorContainer(scope) {
    this.scope = scope || {};
  }

  /**
   * Set namespace in scope. Module will be instantly available.
   *
   * @method set
   * @chainable
   * @param {String} namespace  Module namespace.
   * @param {Object} module  Module to set.
   * @param {Boolean} [override]  Should override namespace if set.
   */
  DependencyInjectorContainer.prototype.set = function(namespace, module, override) {
    if (typeof namespace !== 'string') {
      throw new TypeError('Namespace has to be a string.');
    }

    if (override !== true && this.scope.hasOwnProperty(namespace) === true) {
      throw new Error(namespace + ' is aready defined.');
    }

    this.scope[namespace] = module;

    return this;
  };

  /**
   * Extend namespace to scope. Will be injected as soon as load is called.
   *
   * @method extend
   * @chainable
   * @param {String} namespace  Module namespace.
   * @param {Array} [dependencies]  Module dependencies.
   * @param {Object} definition  Module definition block.
   */
  DependencyInjectorContainer.prototype.extend = function(namespace, dependencies, definition) {
    if (typeof dependencies === 'function') {
      definition = dependencies;
      dependencies = undefined;
    }

    definition.__dependencies__ = dependencies || [];
    definition.isDefinition = true;
    this.set(namespace, definition);

    return this;
  };

  /**
   * Receive module.
   *
   * @method get
   * @param {String} namespace  Module namespace.
   * @return {Object}
   */
  DependencyInjectorContainer.prototype.get = function(namespace) {
    if (typeof namespace !== 'string') {
      throw new TypeError('Namespace has to be a string.');
    }

    if (typeof this.scope[namespace] === 'undefined') {
      throw new Error(namespace + ' not found.');
    }

    return this.scope[namespace];
  };

  /**
   * Initialize all defenitions.
   *
   * @method load
   * @chainable
   */
  DependencyInjectorContainer.prototype.load = function() {
    var namespaces = Object.keys(this.scope).filter(function(namespace){
      return this.get(namespace).isDefinition === true;
    }, this);
    var sortedNamespaces = [];
    var queue = function(collection) {
      var result = [];

      collection.forEach(function(namespace){
        var isRequired = namespaces.some(function(m){
          if (m !== namespace && this.get(m).__dependencies__.indexOf(namespace) !== -1) {
            if (this.get(namespace).__dependencies__.indexOf(m) !== -1) {
              console.error('Cyclic dependency in ' + namespace + ' and ' + m + '.');
              return;
            }

            return true;
          }
        }, this);

        if (isRequired === true) {
          result.push(namespace);
        } else {
          sortedNamespaces.unshift(namespace);
        }
      }, this);

      return result;
    }.bind(this);

    while (namespaces.length > 0) {
      namespaces = queue(namespaces);
    }

    sortedNamespaces.forEach(function(namespace){
      var definition = this.get(namespace);
      var dependencies = definition.__dependencies__;
      var args = dependencies.map(function(depNamespace){
        var module = this.get(depNamespace);

        if (module.isDefinition === true) {
          console.warn('Module ' + depNamespace + ' is not initialized.');
        }

        return module;
      }, this);

      try {
        this.set(namespace, definition.apply(this, args) || {}, true);
      } catch (e) {
        console.error(namespace, e);
      }
    }, this);

    return this;
  };

  return DependencyInjectorContainer;
});