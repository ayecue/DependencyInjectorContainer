# dependency-injector-container

> Tiny library which does dependency injection. Basically same pattern like in AngularJS.


## Getting Started
Install this plugin with this command:

```shell
npm install dependency-injector-container
```


## API

[API Documentation](http://rawgit.com/ayecue/DependencyInjectorContainer/master/doc/index.html)


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