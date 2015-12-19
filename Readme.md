# dependency-injector-container

## Description:

Tiny library which does dependency injection. Basically same pattern like in AngularJS.

## Example:
```
var DependencyInjectorContainer = require('dependency-injector-container');
var Application = new DependencyInjectorContainer();

//Testing
Application.extend('test',function(){
	return {
	  foo: 'bar'
	};
});

Application.extend('cow',['test','sheep'],function(test,sheep){
	console.log(test.foo, sheep);

	return {
	  lol: 'moo'
	};
});

Application.extend('sheep',['test'],function(test){
	console.log(test.foo);

	return {
	  legs: 'walk'
	};
});

Application.load();
```