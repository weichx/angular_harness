(function () {
    //goals for rewrite
        //Runtime-toggleable mocks
        //make it easy to import json from somewhere and use it as harness data
        //store some developer config like current user id

    //todo allow mocking of require and define statements
    //todo put this elsewhere
    var AngularHarness = function AngularHarness(name, options) {
        if (typeof name !== 'string') {
            throw new Error('Harnesses need a name in their first parameter!');
        }
        if (!options || typeof options !== 'object') {
            throw new Error('Harnesses need a config object in their second parameter!');
        }
        if (entities.harnesses[name]) {
            throw new Error('HarnessInstance named `' + name + '` already exists!');
        }
        this.name = name;
        this.mocks = options.mocks || {};
        this.toggledMocks = {};
        this.http = options.http || {};
        this.template = options.template;
        this.templateUrl = options.templateUrl;
        this.context = options.controller || options.context;
        this.moduleName = options.moduleName || defaultModuleName || 'Application';
        this.allowRealHttp = (options.allowRealHttp === false) || true;
    };

    var currentHarnessReference = null;
    //todo put this somewhere angular specific, goal is to keep 'harness' generic and allow overwrites
    var defaultModuleName = 'Application';

    var entities = {
        harnesses: {},
        mocks: {}
    };

    var Harness = window.Harness = function (name, options) {
        entities.harnesses[name] = new AngularHarness(name, options);
    };

    Harness.setDefaultModule = function (name) {
        defaultModuleName = name;
    };

    Harness.getHarnessByName = function (harnessName) {
        return entities.harnesses[harnessName];
    };

    Harness.getHarnessNames = function () {
        return Object.keys(entities.harnesses);
    };

    Harness.getCurrentHarness = function () {
        return currentHarnessReference;
    };

    Harness.Mock = function (name, impl) {
        entities.mocks[name] = impl;
    };

    Harness.getImplementation = function (providerName, impl) {
        var mockName = currentHarnessReference.mocks[providerName];
        if (!mockName) return impl;
        var mock = entities.mocks[mockName];
        return mock === undefined && impl || mock;
    };

    Harness.setToProduction = function () {
        currentHarnessReference = Harness.getHarnessByName('Production');
    };

    Harness.conforms = function (object) {
        //if(!object) return false;
        //if(typeof object !== 'object') return false;
        //if(!object.mocks || typeof obj.mocks !== 'object') return false;
        //return true;
        //todo this is for ensuring an unnamed harness wont break harness calls
        return false;
    };

    Harness.load = function (harness) {
        Harness.unload(); //drop anything already mocked
        if (typeof harness === 'string' && Harness.getHarnessByName(harness)) {
            currentHarnessReference = Harness.getHarnessByName(harness);
        } else if (harness && typeof harness === 'object') {
            currentHarnessReference = harness;
        } else {
            currentHarnessReference = Harness.getHarnessByName(harness);
        }
        if (!currentHarnessReference) {
            console.log('HarnessInstance ', harness, ' is an invalid harness! Reverting to production harness');
            Harness.setToProduction();
        }
        var mocks = currentHarnessReference.mocks;
        for (var key in mocks) {
            var realThing = entities.realImplementations[key];
            var impl = entities.mocks[mocks[key]];
            angular.module(realThing.moduleName)[realThing.type](realThing.name, impl);
        }

        for(key in currentHarnessReference.toggledMocks) {
            realThing = entities.realImplementations[key];
            impl = entities.mocks[mocks[key]];
            angular.module(realThing.moduleName)[realThing.type](realThing.name, impl);
        }
    };

    Harness.unload = function () {
        if (!currentHarnessReference) return;
        //get original angular implementation, re-apply it.
        var mockedThings = Object.keys(currentHarnessReference.mocks || {});
        for (var i = 0; i < mockedThings.length; i++) {
            //todo move this to an adapter so this file is not dependant on angular
            var realThing = entities.realImplementations[mockedThings[i]];
            angular.module(realThing.moduleName)[realThing.type](realThing.name, realThing.impl);
        }
        //production is the default
        currentHarnessReference = Harness.getHarnessByName('Production');
    };

    if (window.jasmine || window.mocha) {
        var fn = function (itFn) {
            return function (testName, impl) {
                //inspect the arguments of the impl function,
                //if it declares any parameters, treat it as async
                var str = impl.toString();
                var argStart = str.indexOf('(') + 1;
                var argEnd = str.indexOf(')');
                var argStr = str.substring(argStart, argEnd).trim();
                var isAsync = argStr !== '';
                if (isAsync) {
                    return itFn(testName, function (done) {
                        impl.apply(this, arguments);
                        Harness.unload();
                    });
                } else {
                    return itFn(testName, function () {
                        impl.apply(this, arguments);
                        Harness.unload();
                    });
                }
            }
        };
        var _it = window.it;
        var _xit = window.xit;
        var _fit = window.fit;
        window.it = fn(_it);
        window.xit = fn(_xit);
        window.fit = fn(_fit);
    }

    Harness('Production', {});
    Harness.__entities = entities;
    currentHarnessReference = Harness.getHarnessByName('Production');
})();