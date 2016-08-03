/// <reference path="./module.ts"/>
/// <reference path="./entity.ts"/>

declare var angular : any;
declare var jasmine : any;
declare var describe : Function;

class AsyncModules {
    private static realModuleFn : Function;

    public static autoBootstrap : boolean = true;

    public static bootstrap(autoBootstrapped? : boolean) {
        if(!AsyncModules.autoBootstrap && autoBootstrapped) return;
        AsyncModules.beforeBootstrap();
        angular.module = AsyncModules.realModuleFn;
        var moduleNames : Array<string> = Object.keys(AngularModule.modules);
        for (var i = 0; i < moduleNames.length; i++) {
            var moduleName = moduleNames[i];
            var asyncModule : AngularModule = AngularModule.modules[moduleName];
            angular.module(asyncModule.name, asyncModule.dependencies);
            for (var j = 0; j < asyncModule.entityList.length; j++) {
                var entity : AngularEntity = asyncModule.entityList[j];
                if (entity.providerType === 'run' || entity.providerType === 'config') {
                    angular.module(entity.moduleName)[entity.providerType](entity.implementation);
                } else {
                    var implementation = AsyncModules.getImplementation(entity.injectionTarget) || entity.implementation;
                    angular.module(entity.moduleName)[entity.providerType](entity.injectionTarget, implementation);
                }
            }
        }
        AsyncModules.afterBootstrap();
    }

    //these are intended to be overridden as lifecycle hooks
    public static beforeBootstrap(...args : any[]) : void {}
    public static afterBootstrap(...args : any[]) : void {}
    public static getImplementation(injectionTarget : string) : any {}

    public static initialize() {
        if (AsyncModules.realModuleFn) return;
        AsyncModules.realModuleFn = angular.module;
        angular.module = function (moduleName : string, configOrDeps : Array<string>|Function, config : () => void) : AngularModule {

            var module : AngularModule = AngularModule.modules[moduleName] || new AngularModule(moduleName);

            if (Array.isArray(configOrDeps)) {
                module.dependencies = module.dependencies.concat(<Array<string>>configOrDeps);
            }

            typeof configOrDeps === 'function' && module.addToEntities('config', null, configOrDeps);
            typeof config === 'function' && module.addToEntities('config', null, config);

            return module;
        };
    }
}

(function () {

    var _module : Function = null;
    var _angular : Object = null;

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

    if ((<any>window).angular) {
        //todo -- untested
        AsyncModules.initialize();
        var bootstrapFn = angular.bootstrap;
        angular.bootstrap = function() {
            AsyncModules.bootstrap(true);
            return bootstrapFn.apply(angular, arguments);
        };
    } else {
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
