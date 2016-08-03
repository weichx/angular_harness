var Mock = (function () {
    function Mock(injectionTarget, implementation, name) {
        if (!(this instanceof Mock)) {
            Mock.mockInterface.injectionTarget = injectionTarget;
            implementation(Mock.mockInterface);
        }
        else {
            this.name = name;
            this.injectionTarget = injectionTarget;
            this.implementation = implementation;
            Mock.register(this);
        }
    }
    Mock.register = function (mock) {
        if (!Mock.mockRegistry[mock.injectionTarget]) {
            Mock.mockRegistry[mock.injectionTarget] = [];
        }
        Mock.mockRegistry[mock.injectionTarget].push(mock);
    };
    Mock.getMockForInjectionTarget = function (injectionTarget) {
        var mocks = Mock.mockRegistry[injectionTarget];
        if (mocks) {
            var key = Mock.activeMocks[injectionTarget];
            if (key) {
                for (var i = 0; i < mocks.length; i++) {
                    if (mocks[i].name === key)
                        return mocks[i].implementation;
                }
            }
        }
        return null;
    };
    Mock.activateMocks = function (activeMocks) {
        Mock.activeMocks = activeMocks;
    };
    Mock.getInjectionTargetList = function () {
        return Object.keys(Mock.mockRegistry);
    };
    Mock.getMocksForInjectionTarget = function (injectionTarget) {
        return Mock.mockRegistry[injectionTarget] || [];
    };
    Mock.assertValidMocks = function (mocks) {
        var keys = Object.keys(mocks);
        for (var i = 0; i < keys.length; i++) {
            var mockName = keys[i];
            var registeredMock = Mock.mockRegistry[mockName];
            if (registeredMock) {
                var mockTarget = mocks[mockName];
                var hasMock = registeredMock.some(function (mock) {
                    return mock.name === mockTarget;
                });
                if (!hasMock) {
                    console.warn("cannot find a mock variant called " + mockTarget + " from mock " + mockName);
                }
            }
            else {
                console.warn("cannot find anything called " + mockName + " to mock");
            }
        }
    };
    Mock.getActivatedMock = function (injectionTarget, mockName) {
        var mocks = Mock.mockRegistry[injectionTarget];
        if (mocks) {
            var key = Mock.activeMocks[injectionTarget];
            if (key) {
                for (var i = 0; i < mocks.length; i++) {
                    if (mocks[i].name === mockName)
                        return mocks[i];
                }
            }
        }
        return null;
    };
    Mock.getMock = function (injectionTarget, mockName) {
        var mocks = Mock.mockRegistry[injectionTarget];
        if (mocks) {
            for (var i = 0; i < mocks.length; i++) {
                if (mocks[i].name === mockName) {
                    return mocks[i].implementation;
                }
            }
        }
        return null;
    };
    Mock.activeMocks = {};
    Mock.mockRegistry = {};
    Mock.mockInterface = {
        injectionTarget: null,
        add: function (mockName, implementation) {
            new Mock(this.injectionTarget, implementation, mockName);
        }
    };
    return Mock;
})();
window['Mock'] = Mock;
var Variant = (function () {
    function Variant(name) {
        this.name = name;
        this.defaultMocks = null;
        this.additionalMocks = null;
        this.context = null;
        this.template = null;
        this.templateUrl = null;
    }
    Variant.prototype.setDefaultMocks = function (defaultMocks) {
        this.defaultMocks = defaultMocks;
    };
    Variant.prototype.addDefaultMocks = function (addedDefaultMocks) {
        this.additionalMocks = addedDefaultMocks;
    };
    Variant.prototype.setContext = function (context) {
        this.context = context;
    };
    Variant.prototype.setTemplate = function (template) {
        this.template = template;
    };
    Variant.prototype.setTemplateUrl = function (templateUrl) {
        this.templateUrl = templateUrl;
    };
    Variant.Empty = new Variant('-- None --');
    return Variant;
})();
var AngularEntity = (function () {
    function AngularEntity(moduleName, providerType, injectionTarget, implementation) {
        this.moduleName = moduleName;
        this.providerType = providerType;
        this.injectionTarget = injectionTarget;
        this.implementation = implementation;
        AngularEntity.register(this);
    }
    AngularEntity.register = function (entity) {
        if (!entity.injectionTarget)
            return;
        AngularEntity.entityRegistry[entity.injectionTarget] = entity;
    };
    AngularEntity.getEntityForInjectionTarget = function (injectionTarget) {
        return AngularEntity.entityRegistry[injectionTarget];
    };
    AngularEntity.entityRegistry = {};
    return AngularEntity;
})();
var AngularModule = (function () {
    function AngularModule(name) {
        this.name = name;
        this.dependencies = [];
        this.entityList = [];
        AngularModule.modules[this.name] = this;
    }
    AngularModule.prototype.addToEntities = function (providerType, providerName, implementation) {
        this.entityList.push(new AngularEntity(this.name, providerType, providerName, implementation));
        return this;
    };
    AngularModule.prototype.run = function (implementation) {
        return this.addToEntities('run', null, implementation);
    };
    AngularModule.prototype.config = function (implementation) {
        return this.addToEntities('config', null, implementation);
    };
    AngularModule.prototype.service = function (providerName, implementation) {
        return this.addToEntities('service', providerName, implementation);
    };
    AngularModule.prototype.factory = function (providerName, implementation) {
        return this.addToEntities('factory', providerName, implementation);
    };
    AngularModule.prototype.provider = function (providerName, implementation) {
        return this.addToEntities('provider', providerName, implementation);
    };
    AngularModule.prototype.value = function (providerName, implementation) {
        return this.addToEntities('value', providerName, implementation);
    };
    AngularModule.prototype.constant = function (providerName, implementation) {
        return this.addToEntities('constant', providerName, implementation);
    };
    AngularModule.prototype.filter = function (providerName, implementation) {
        return this.addToEntities('filter', providerName, implementation);
    };
    AngularModule.prototype.animation = function (providerName, implementation) {
        return this.addToEntities('animation', providerName, implementation);
    };
    AngularModule.prototype.controller = function (providerName, implementation) {
        return this.addToEntities('controller', providerName, implementation);
    };
    AngularModule.prototype.directive = function (providerName, implementation) {
        return this.addToEntities('directive', providerName, implementation);
    };
    AngularModule.modules = {};
    return AngularModule;
})();
var Harness = (function () {
    function Harness(name, fn) {
        if (!(this instanceof Harness)) {
            var harness = new Harness(name, fn);
            fn(harness);
            Harness.harnessList.push(harness);
            return harness;
        }
        else {
            this.name = name;
            this.variants = new Array();
            this.variants.push(Variant.Empty);
            this.groupNames = new Array();
            this.groupNames.push('All');
            this.template = null;
            this.templateUrl = null;
            this.context = function () { };
            this.defaultMocks = {};
        }
    }
    Harness.prototype.getTemplate = function () {
        var variant = this.getActiveVariant();
        if (!variant || !variant.template) {
            return this.template;
        }
        return variant.template;
    };
    Harness.prototype.getTemplateUrl = function () {
        var variant = this.getActiveVariant();
        if (!variant || !variant.templateUrl) {
            return this.templateUrl;
        }
        return variant.templateUrl;
    };
    Harness.prototype.getContext = function () {
        var variant = this.getActiveVariant();
        if (!variant || !variant.context) {
            return this.context;
        }
        return variant.context;
    };
    Harness.prototype.setContext = function (ctx) {
        this.context = ctx;
    };
    Harness.prototype.setTemplateUrl = function (templateUrl) {
        this.templateUrl = templateUrl;
    };
    Harness.prototype.setTemplate = function (template) {
        this.template = template;
    };
    Harness.prototype.setDefaultMocks = function (defaultMocks) {
        this.defaultMocks = defaultMocks;
    };
    Harness.prototype.getDefaultMocks = function () {
        var variant = this.activeVariant;
        if (!variant) {
            return this.defaultMocks;
        }
        if (variant.defaultMocks) {
            return Harness.mergeMocks(variant.defaultMocks, variant.additionalMocks);
        }
        if (variant.additionalMocks) {
            return Harness.mergeMocks(this.defaultMocks, variant.additionalMocks);
        }
        return this.defaultMocks;
    };
    Harness.prototype.getRootModuleName = function () {
        return this.rootModuleName || 'Application';
    };
    Harness.prototype.addVariant = function (name, fn) {
        var variant = new Variant(name);
        fn(variant);
        this.variants.push(variant);
    };
    Harness.prototype.activateVariant = function (name) {
        this.activeVariant = this.getVariantByName(name);
    };
    Harness.prototype.addToGroup = function (groupName) {
        this.groupNames.push(groupName);
    };
    Harness.prototype.getVariantByName = function (variantName) {
        for (var i = 0; i < this.variants.length; i++) {
            if (this.variants[i].name === variantName) {
                return this.variants[i];
            }
        }
        return null;
    };
    Harness.prototype.hasVariant = function (variantName) {
        return this.getVariantByName(variantName) !== null;
    };
    Harness.getEmptyVariantName = function () {
        return Variant.Empty.name;
    };
    Harness.prototype.getVariantNames = function () {
        return this.variants.map(function (variant) {
            return variant.name;
        });
    };
    Harness.prototype.getActiveVariant = function () {
        return this.activeVariant;
    };
    Harness.getHarnessByName = function (harnessName) {
        return Harness.harnessList.filter(function (harness) {
            return harness.name == harnessName;
        })[0];
    };
    Harness.load = function (activeMocks) {
        throw new Error("Override this in a subclass");
    };
    Harness.unload = function () {
        Harness.load({});
    };
    Harness.getDefaultHarness = function () {
        return new Harness('-- None --', function (harness) { });
    };
    Harness.getAllInGroup = function (groupName) {
        return Harness.harnessList.filter(function (harness) {
            return harness.groupNames.indexOf(groupName) !== -1;
        });
    };
    Harness.getGroupNames = function () {
        var names = [];
        for (var i = 0; i < Harness.harnessList.length; i++) {
            for (var j = 0; j < Harness.harnessList[i].groupNames.length; j++) {
                var name = Harness.harnessList[i].groupNames[j];
                if (names.indexOf(name) === -1)
                    names.push(name);
            }
        }
        names.sort();
        names.splice(names.indexOf('All'), 1);
        names.unshift('All');
        return names;
    };
    Harness.mergeMocks = function (dest, src) {
        if (!src)
            src = {};
        var keys = Object.keys(dest).concat(Object.keys(src));
        var retn = {};
        for (var i = 0; i < keys.length; i++) {
            retn[keys[i]] = dest[keys[i]];
            if (src[keys[i]]) {
                retn[keys[i]] = src[keys[i]];
            }
        }
        return retn;
    };
    Harness.harnessList = [Harness.getDefaultHarness()];
    return Harness;
})();
(function () {
    window['Harness'] = Harness;
    if (window['jasmine'] || window['mocha']) {
        var fn = function (itFn) {
            return function (testName, impl) {
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
                }
                else {
                    return itFn(testName, function () {
                        impl.apply(this, arguments);
                        Harness.unload();
                    });
                }
            };
        };
        window['it'] = fn(window['it']);
        window['xit'] = fn(window['xit']);
        window['fit'] = fn(window['fit']);
    }
})();
var AsyncModules = (function () {
    function AsyncModules() {
    }
    AsyncModules.bootstrap = function (autoBootstrapped) {
        if (!AsyncModules.autoBootstrap && autoBootstrapped)
            return;
        AsyncModules.beforeBootstrap();
        angular.module = AsyncModules.realModuleFn;
        var moduleNames = Object.keys(AngularModule.modules);
        for (var i = 0; i < moduleNames.length; i++) {
            var moduleName = moduleNames[i];
            var asyncModule = AngularModule.modules[moduleName];
            angular.module(asyncModule.name, asyncModule.dependencies);
            for (var j = 0; j < asyncModule.entityList.length; j++) {
                var entity = asyncModule.entityList[j];
                if (entity.providerType === 'run' || entity.providerType === 'config') {
                    angular.module(entity.moduleName)[entity.providerType](entity.implementation);
                }
                else {
                    var implementation = AsyncModules.getImplementation(entity.injectionTarget) || entity.implementation;
                    angular.module(entity.moduleName)[entity.providerType](entity.injectionTarget, implementation);
                }
            }
        }
        AsyncModules.afterBootstrap();
    };
    AsyncModules.beforeBootstrap = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
    };
    AsyncModules.afterBootstrap = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
    };
    AsyncModules.getImplementation = function (injectionTarget) { };
    AsyncModules.initialize = function () {
        if (AsyncModules.realModuleFn)
            return;
        AsyncModules.realModuleFn = angular.module;
        angular.module = function (moduleName, configOrDeps, config) {
            var module = AngularModule.modules[moduleName] || new AngularModule(moduleName);
            if (Array.isArray(configOrDeps)) {
                module.dependencies = module.dependencies.concat(configOrDeps);
            }
            typeof configOrDeps === 'function' && module.addToEntities('config', null, configOrDeps);
            typeof config === 'function' && module.addToEntities('config', null, config);
            return module;
        };
    };
    AsyncModules.autoBootstrap = true;
    return AsyncModules;
})();
(function () {
    var _module = null;
    var _angular = null;
    var assignModule = function () {
        Object.defineProperty(_angular, 'module', {
            get: function () {
                return _module;
            },
            set: function (value) {
                _module = value;
                AsyncModules.initialize();
            }
        });
    };
    if (window.angular) {
        AsyncModules.initialize();
        var bootstrapFn = angular.bootstrap;
        angular.bootstrap = function () {
            AsyncModules.bootstrap(true);
            return bootstrapFn.apply(angular, arguments);
        };
    }
    else {
        Object.defineProperty(window, 'angular', {
            get: function () {
                return _angular;
            },
            set: function (value) {
                _angular = value;
                assignModule();
            }
        });
        document.addEventListener('DOMContentLoaded', function () {
            AsyncModules.bootstrap(true);
        }, false);
    }
})();
AsyncModules.autoBootstrap = false;
AsyncModules.getImplementation = function (injectionTarget) {
    return Mock.getMockForInjectionTarget(injectionTarget);
};
Harness.load = function (appliedMocks) {
    AsyncModules.beforeBootstrap = function () {
        Mock.activateMocks(appliedMocks);
    };
    AsyncModules.bootstrap();
};
document.addEventListener('DOMContentLoaded', function (event) {
    window['HarnessClient'] = new HarnessHTTPClient();
}, false);
var parser = document.createElement('a');
var getQuery = function (search) {
    var params = {};
    var queries = search.slice(1).split("&");
    for (var i = 0; i < queries.length; i++) {
        var temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
    return params;
};
function ParsedUrl(url) {
    parser.href = url;
    this.url = url;
    this.protocol = parser.protocol;
    this.hostname = parser.hostname;
    this.host = parser.host;
    this.port = parser.port;
    this.pathname = parser.pathname;
    this.search = parser.search;
    this.hash = parser.hash;
    this.query = getQuery(this.search);
}
var HarnessHTTPClient = (function () {
    function HarnessHTTPClient() {
        var params = new ParsedUrl(location.href).query;
        var harnessName = params['harness'];
        var variantName = params['variant'];
        var mockSets = params['mocks'];
        if (harnessName) {
            harnessName = decodeURIComponent(harnessName);
            var mocks = {};
            if (mockSets) {
                mocks = JSON.parse(decodeURIComponent(mockSets));
            }
            var harness = Harness.getHarnessByName(harnessName);
            if (!harness) {
                harness = Harness.getDefaultHarness();
                console.warn("unable to load harness " + harnessName + ", loading default instead");
            }
            if (variantName) {
                variantName = decodeURIComponent(variantName);
            }
            if (variantName && !harness.hasVariant(variantName)) {
                console.warn("unable to load variant " + variantName + ", loading default harness");
            }
            Mock.assertValidMocks(mocks || {});
            harness.activateVariant(variantName);
            Harness.load(Harness.mergeMocks(harness.getDefaultMocks(), mocks));
            HarnessHTTPClient.bootstrap(harness);
        }
    }
    HarnessHTTPClient.bootstrap = function (harness) {
        var deps = [harness.getRootModuleName()];
        window['angular'].module('AngularHarnessApplication', deps).directive('entryPoint', function () {
            return {
                template: harness.getTemplate(),
                templateUrl: harness.getTemplateUrl(),
                controller: harness.getContext()
            };
        });
        var element = document.querySelector("[ng-app]");
        if (element)
            element.removeAttribute("ng-app");
        var parent = document.body;
        parent.innerHTML = '<button class="HARNESS-RESET" ng-init="i = 1" ng-click="i = i + 1">\n    Reset Harness\n</button>\n<entry-point ng-if="i % 2 !== 0"></entry-point>\n\n';
        parent.setAttribute('ng-app', 'AngularHarnessApplication');
    };
    return HarnessHTTPClient;
})();
