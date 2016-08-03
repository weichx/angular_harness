/// <reference path="./harness.ts"/>
///<reference path="./async_modules"/>

AsyncModules.autoBootstrap = false;

AsyncModules.getImplementation = function(injectionTarget : string) {
    return Mock.getMockForInjectionTarget(injectionTarget);
};


Harness.load = function(appliedMocks : MockSetDescriptor) : void {
    AsyncModules.beforeBootstrap = function() {
        Mock.activateMocks(appliedMocks);
    };

    AsyncModules.bootstrap();
};
