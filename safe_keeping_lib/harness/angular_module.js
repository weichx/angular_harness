(function () {
    if (window.angular) throw new Error("HarnessInstance must be included on the page before angular!");
    var realImplementations = {};
    var entityInterceptor = function (angularModule, entity) {
        realImplementations[entity.name] = entity;
        var impl = HarnessInstance.getImplementation(entity.name, entity.impl);
        angularModule[entity.type](entity.name, impl);
    };

    if (window.AngularAsyncModules) {
        window.AngularAsyncModules.createEntity = entityInterceptor;
    } else {
        var __asyncModules = null;
        Object.defineProperty(window, 'AngularAsyncModules', {
            get: function () {
                return __asyncModules;
            },
            set: function (value) {
                __asyncModules = value;
                __asyncModules.createEntity = entityInterceptor;
            }
        });
    }

    //expose all the things
    HarnessInstance.__entities.realImplementations = realImplementations;
})();