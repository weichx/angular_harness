interface MockSetDescriptor {
    [injectionTarget : string] : string;
}

interface MockRegistry {
    [index : string] : Array<Mock>;
}

interface IMockInterface {
    injectionTarget : string,
    add : (mockName : string, implementation : (...args : any[]) => void) => void;
}

class Mock {

    public name : string;
    public injectionTarget : string;
    public implementation : any;

    private static activeMocks : MockSetDescriptor = {};
    private static mockRegistry : MockRegistry = {};

    private static mockInterface : IMockInterface = {
        injectionTarget: null,
        add: function (mockName : string, implementation : (...args : any[]) => void) : void {
            new Mock(this.injectionTarget, implementation, mockName);
        }
    };

    constructor(injectionTarget : string, implementation : any, name? : string) {
        if (!(this instanceof Mock)) {
            Mock.mockInterface.injectionTarget = injectionTarget;
            implementation(Mock.mockInterface);
        } else {
            this.name = name;
            this.injectionTarget = injectionTarget;
            this.implementation = implementation;
            Mock.register(this);
        }
    }

    private static register(mock : Mock) {
        if (!Mock.mockRegistry[mock.injectionTarget]) {
            Mock.mockRegistry[mock.injectionTarget] = [];
        }
        Mock.mockRegistry[mock.injectionTarget].push(mock);
    }

    public static getMockForInjectionTarget(injectionTarget : string) : Mock {
        var mocks = Mock.mockRegistry[injectionTarget];
        if (mocks) {
            var key = Mock.activeMocks[injectionTarget];
            if (key) {
                for (var i = 0; i < mocks.length; i++) {
                    if (mocks[i].name === key) return mocks[i].implementation;
                }
            }
        }
        return null;
    }

    public static activateMocks(activeMocks : MockSetDescriptor) : void {
        Mock.activeMocks = activeMocks;
    }

    public static getInjectionTargetList() : Array<string> {
        return Object.keys(Mock.mockRegistry);
    }

    public static getMocksForInjectionTarget(injectionTarget : string) : Array<Mock> {
        return Mock.mockRegistry[injectionTarget] || [];
    }

    public static assertValidMocks(mocks : any) : void {
        var keys = Object.keys(mocks);
        for (var i = 0; i < keys.length; i++) {
            var mockName = keys[i];
            var registeredMock = Mock.mockRegistry[mockName];

            if (registeredMock) {
                var mockTarget = mocks[mockName];
                var hasMock = registeredMock.some(function (mock : Mock) {
                    return mock.name === mockTarget;
                });
                if(!hasMock) {
                    console.warn(`cannot find a mock variant called ${mockTarget} from mock ${mockName}`)
                }

            } else {
                console.warn(`cannot find anything called ${mockName} to mock`);
            }
        }
    }

    public static getActivatedMock(injectionTarget : string, mockName : string) : Mock {
        var mocks = Mock.mockRegistry[injectionTarget];
        if (mocks) {
            var key = Mock.activeMocks[injectionTarget];
            if (key) {
                for (var i = 0; i < mocks.length; i++) {
                    if (mocks[i].name === mockName) return mocks[i];
                }
            }
        }
        return null;
    }

    public static getMock(injectionTarget : string, mockName : string) : any {
        var mocks = Mock.mockRegistry[injectionTarget];
        if(mocks) {
            for(var i = 0; i < mocks.length; i++) {
                if(mocks[i].name === mockName) {
                    return mocks[i].implementation;
                }
            }
        }
        return null;
    }
}

window['Mock'] = Mock;

