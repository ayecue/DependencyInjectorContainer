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
  function DependencyInjectorContainer(namespaceRange) {
    this.scope = namespaceRange || {};
  }

  DependencyInjectorContainer.prototype.set = function(module, namespace, override) {
    if (typeof namespace !== 'string') {
      throw new TypeError('Second argument must be string');
    }

    if (override !== true && this.scope.hasOwnProperty(namespace) === true) {
      throw new Error(namespace + ' is aready defined');
    }

    this.scope[namespace] = module;
  };

  DependencyInjectorContainer.prototype.extend = function(namespace, dependencies, constructor) {
    if (typeof dependencies === 'function') {
      constructor = dependencies;
      dependencies = undefined;
    }

    constructor.__dependencies__ = dependencies || [];
    constructor.isConstructor = true;
    this.set(constructor, namespace);
  };

  DependencyInjectorContainer.prototype.get = function(namespace) {
    if (typeof namespace !== 'string') {
      throw new TypeError('Namespace has to be a string');
    }

    if (typeof this.scope[namespace] === 'undefined') {
      throw new Error(namespace + ' not found');
    }

    return this.scope[namespace];
  };

  DependencyInjectorContainer.prototype.load = function() {
    var namespaces = Object.keys(this.scope).filter(function(namespace){
      return this.get(namespace).isConstructor === true;
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
      var constructor = this.get(namespace);
      var dependencies = constructor.__dependencies__;
      var args = dependencies.map(function(depNamespace){
        var module = this.get(depNamespace);

        if (module.isConstructor === true) {
          console.warn('Module ' + depNamespace + ' is not initialized.');
        }

        return module;
      }, this);

      try {
        this.set(constructor.apply(this, args) || {}, namespace, true);
      } catch (e) {
        console.error(namespace, e);
      }
    }, this);
  };

  return DependencyInjectorContainer;
});