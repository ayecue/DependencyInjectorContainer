/*
 * dependency-injector-container
 * https://github.com/ayecue/DependencyInjectorContainer
 *
 * Copyright (c) 2015 "AyeCue" Sören Wehmeier, contributors
 * Licensed under the MIT license.
 */
;
(function(name, definition) {
  var theModule = definition();
  var hasDefine = typeof define === 'function' && define.amd;
  var hasExports = typeof module !== 'undefined' && module.exports;

  if (hasDefine) { // AMD Module
    define(theModule);
  } else if (hasExports) { // Node.js Module
    module.exports = theModule;
  } else { // Assign to common namespaces or simply the global object (window)
    window[name] = theModule;
  }
})('DependencyInjectorContainer', function() {
  //Error Messages
  var NAMESPACE_TYPE_ERROR = 'Unexpected type for namespace. Namespace needs to be a string.'; //Thrown when unexpected namespace type is given
  var NAMESPACE_ALREADY_DEFINED = '%n is aready defined.'; //Thrown as soon as someone tries to override a namespace without the overriden flag set to true
  var NAMESPACE_NOT_FOUND = '%n not found.'; //Thrown if namespace is not set
  var DEFINITION_NOT_INITIALIZED = 'Definition %d is not initialized.'; //Thrown if definition is not initialized
  var DEFINITION_CYCLIC_DEPENDENCY = 'Cyclic dependency in %1 and %2.'; //Thrown if there are cyclic dependencies.

  /**
   * Dependency injector container like in AngualarJS.
   *
   * @class DependencyInjectorContainer
   * @constructor
   * @param {Object} scope  Scope for namespaces.
   * @private
   */
  function DependencyInjectorContainer(scope) {
    var hasProperty;

    scope = scope || {};

    this.set = set;
    this.get = get;
    this.extend = extend;
    this.load = load;

    /**
     * Assert helper.
     *
     * @method assert
     * @private
     * @param {Boolean} condition
     * @param {String} message  
     * @param {Mixed} [type]  
     */
    function assert(condition, message, type) {
      if (condition === false) {
        throw new (type || Error)(message);
      }
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
    function set(namespace, module, override) {
      assert(typeof namespace === 'string', NAMESPACE_TYPE_ERROR, TypeError);
      assert(
        override === true || scope.hasOwnProperty(namespace) === false, 
        NAMESPACE_ALREADY_DEFINED
          .replace('%n', namespace)
      );

      scope[namespace] = module;

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
    function extend(namespace, dependencies, definition) {
      if (typeof dependencies === 'function') {
        definition = dependencies;
        dependencies = undefined;
      }

      definition.__dependencies__ = dependencies || [];
      definition.isDefinition = true;
      definition.namespace = namespace;

      set(namespace, definition);

      return this;
    };

    /**
     * Receive module. Will automatically initialize module with all it dependencies if it's not already loaded.
     *
     * @method get
     * @param {String} namespace  Module namespace.
     * @return {Object}
     */
    function get(namespace) {
      assert(typeof namespace === 'string', NAMESPACE_TYPE_ERROR, TypeError);
      assert(
        scope.hasOwnProperty(namespace) === true, 
        NAMESPACE_NOT_FOUND
          .replace('%n', namespace)
      );

      return loadDefinition(scope[namespace]);
    };

    /**
     * Evaluate defenition.
     *
     * @method evalDefinition
     * @private
     * @param {String} namespace  Module namespace.
     * @return {Object}
     */
    function evalDefinition(definition) {
      var args;
      var compiled;
      var depDefinition;

      if (definition.isDefinition !== true) {
        return definition;
      }

      args = definition.__dependencies__.map(function(depNamespace) {
        depDefinition = get(depNamespace);

        if (depDefinition.isDefinition === true) {
          console.warn(
            DEFINITION_NOT_INITIALIZED
            .replace('%d', depNamespace)
          );
        }

        return depDefinition;
      });

      try {
        compiled = definition.apply(null, args) ||  {};
        set(definition.namespace, compiled, true);
      } catch (e) {
        console.error(definition.namespace, e);
      }

      return compiled;
    };

    /**
     * Load one defenition with all it dependencies. (Use this if you just want to load certain modules and not all)
     * If you want to load via namespace use .get instead.
     *
     * @method loadDefinition
     * @private
     * @param {Function} definition  Definition block.
     * @param {Array} [excludes]  Modules to exclude from load.
     * @return {Object}
     */
    function loadDefinition(definition, excludes) {
      var sortedDefinitions = [];

      if (definition.isDefinition !== true) {
        return definition;
      }

      excludes = excludes ||  [];
      excludes.push(definition);

      definition.__dependencies__.forEach(function(depNamespace) {
        var depDefinition = get(depNamespace);
        var excluded;
        var result;

        if (depDefinition.isDefinition !== true) {
          return;
        }

        if (depDefinition.__dependencies__.indexOf(definition.namespace) !== -1) {
          console.error(
            DEFINITION_CYCLIC_DEPENDENCY
            .replace('%1', definition.namespace)
            .replace('%2', depDefinition.namespace)
          );
          return;
        }

        excluded = excludes.some(function(d) {
          return depDefinition.namespace !== d.namespace;
        });

        if (excluded === false) {
          return;
        }

        result = loadDefinition(depDefinition, excludes);
        sortedDefinitions = sortedDefinitions.concat(result);
      });

      return evalDefinition(definition);
    };

    /**
     * Initialize all defenitions.
     *
     * @method load
     * @chainable
     */
    function load() {
      var namespaces = Object.keys(scope).filter(function(namespace) {
        return get(namespace).isDefinition === true;
      });
      var sortedNamespaces = [];
      var queue = function(collection) {
        var result = [];

        collection.forEach(function(namespace) {
          var isRequired = namespaces.some(function(m) {
            if (m !== namespace && get(m).__dependencies__.indexOf(namespace) !== -1) {
              if (get(namespace).__dependencies__.indexOf(m) !== -1) {
                console.error(
                  DEFINITION_CYCLIC_DEPENDENCY
                  .replace('%1', namespace)
                  .replace('%2', m)
                );
                return;
              }

              return true;
            }
          });

          if (isRequired === true) {
            result.push(namespace);
          } else {
            sortedNamespaces.unshift(namespace);
          }
        });

        return result;
      };

      while (namespaces.length > 0) {
        namespaces = queue(namespaces);
      }

      sortedNamespaces.forEach(function(namespace) {
        var definition = get(namespace);

        evalDefinition(definition);
      });

      return this;
    };
  }

  return DependencyInjectorContainer;
});