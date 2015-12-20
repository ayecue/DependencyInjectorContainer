# dependency-injector-container

> Tiny library which does dependency injection. Basically same pattern like in AngularJS.


## Getting Started
Install this plugin with this command:

```shell
npm install dependency-injector-container
```


## API

[API Documentation](http://rawgit.com/ayecue/DependencyInjectorContainer/master/docs/index.html)


## Usage

Register all module defenitions to the dependency-injector-container and at the end call the load method to get everything loaded properly and in the right order.

Imagine you got several modules in different files which depend on each other. You'll somehow need to compile them in the right order otherwise those modules will throw exception. With this tiny library you don't need to care about that anymore. You just need to extend all your modules to the container and then at the end call ```.load()```.

The pattern of this library is pretty similar to what's AngularJS is using.

This library will of course only be useful if you don't already use a compiler which already cares about internal script dependencies.

This library got the size of 1.4 KB.


## Example
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