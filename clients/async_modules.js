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
/// <reference path="./entity"/>
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
/// <reference path="./module.ts"/>
/// <reference path="./entity.ts"/>
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
