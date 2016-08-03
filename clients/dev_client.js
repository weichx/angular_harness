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
    var html = "<div id='harness-page-contents'></div><div id='harness-control-panel'><div class='harness-select-container'><h4>Select a group</h4><select id='harness-group-select'></select><br><h4>Select a harness</h4><select id='harness-instance-select'></select><br><h4>Select a variant</h4><select id='harness-variant-select'></select><br><br><button disabled id='harness-apply-changes'>Apply Changes</button><button id='harness-reset-button'>Reset to defaults</button><button id='harness-clear-button'>Clear</button></div><div class='harness-card-group accordion' id='harness-mock-accordion'></div></div>";
    var css = "body #harness-control-panel,body #harness-control-panel *,body #harness-page-contents{box-sizing:border-box}body #harness-page-contents{width:100%}body.harness-control-panel-in-view #harness-control-panel{display:block;position:absolute;top:0;right:0;width:400px;max-width:100%}@media (min-width:1200px){body.harness-control-panel-in-view #harness-page-contents{float:left;width:70%}body.harness-control-panel-in-view #harness-control-panel{width:30%;display:block;float:left}}#harness-control-panel{display:none;overflow-x:hidden;overflow-y:scroll;border-left:2px solid #373737;width:0;height:100%;padding:20px;background:#fff;z-index:10000}#harness-control-panel button{font-size:15px}#harness-control-panel button:disabled{color:#dcdcdc}#harness-control-panel *{color:#3e3e3e;font-family:sans-serif}#harness-control-panel .harness-select-container select{min-width:50%;font-size:25px;margin-bottom:5px}#harness-control-panel .harness-select-container h4{margin-bottom:2px;margin-top:0}#harness-control-panel .harness-card-group{margin-top:10px;margin-bottom:10px}#harness-control-panel .harness-card-group.accordion .harness-card-header:hover{cursor:pointer}#harness-control-panel .harness-card-group.accordion .harness-card-header:hover *{text-decoration:underline}#harness-control-panel .harness-card{border:1px solid #e1e1e8;margin-bottom:-1px}#harness-control-panel .harness-card button,#harness-control-panel .harness-card h1,#harness-control-panel .harness-card h2,#harness-control-panel .harness-card h3,#harness-control-panel .harness-card h4,#harness-control-panel .harness-card h5,#harness-control-panel .harness-card h6,#harness-control-panel .harness-card label,#harness-control-panel .harness-card p{margin:0}#harness-control-panel .harness-card label{font-size:14px;font-weight:400}#harness-control-panel .harness-card:first-child{border-top-left-radius:3px;border-top-right-radius:3px}#harness-control-panel .harness-card:last-child{border-bottom-left-radius:3px;border-bottom-right-radius:3px;margin-bottom:0}#harness-control-panel .harness-card .harness-card-header{position:relative;background:#e1e1e8;padding:10px}#harness-control-panel .harness-card .harness-card-header h5{font-weight:400}#harness-control-panel .harness-card .harness-card-contents{padding:10px}#harness-control-panel .harness-card .harness-card-contents.harness-input-container{margin-bottom:.25em}#harness-control-panel .harness-card.closed .harness-card-contents{-webkit-transition:height .3s linear;-moz-transition:height .3s linear;-o-transition:height .3s linear;transition:height .3s linear;height:0;display:none}#harness-control-panel h6{margin-top:10px;margin-bottom:10px}";
    var div = document.createElement('div');
    div.innerHTML = html;
    var styleTag = document.createElement('style');
    styleTag.appendChild(document.createTextNode(""));
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
    document.body.appendChild(div);
    var groupSelect = document.getElementById('harness-group-select');
    var variantSelect = document.getElementById('harness-variant-select');
    var harnessSelect = document.getElementById('harness-instance-select');
    window['HarnessClient'] = new HarnessClient(groupSelect, harnessSelect, variantSelect);
}, false);
var HarnessClient = (function () {
    function HarnessClient(groupSelect, harnessSelect, variantSelect) {
        var urlPath = location.host + location.pathname;
        this.groupSelect = groupSelect;
        this.variantSelect = variantSelect;
        this.harnessSelect = harnessSelect;
        this.storageId = urlPath + '_';
        this.appliedMocks = {};
        this.initialize();
    }
    HarnessClient.prototype.initialize = function () {
        var self = this;
        window.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.keyCode === 32) {
                document.body.classList.toggle(HarnessClient.ViewToggleClass);
                self.showControlPanel = !self.showControlPanel;
                self.writeToLocalStorage();
            }
        }, false);
        document.getElementById('harness-apply-changes').addEventListener('click', function (e) {
            location.reload(true);
        }, false);
        document.getElementById('harness-reset-button').addEventListener('click', function (e) {
            var harness = Harness.getHarnessByName(self.harnessName);
            harness.activateVariant(self.variantName);
            self.appliedMocks = harness.getDefaultMocks();
            self.writeToLocalStorage();
            self.generateMockElements();
        }, false);
        document.getElementById('harness-clear-button').addEventListener('click', function (e) {
            self.appliedMocks = {};
            self.writeToLocalStorage();
            self.generateMockElements();
        });
        this.readFromLocalStorage();
        if (!this.showControlPanel) {
            document.body.classList.toggle(HarnessClient.ViewToggleClass);
        }
        var harness = Harness.getHarnessByName(this.harnessName);
        if (!harness)
            harness = Harness.getDefaultHarness();
        var harnesses = Harness.getAllInGroup(this.groupName);
        var harnessNamesInGroup = [];
        for (var i = 0; i < harnesses.length; i++) {
            harnessNamesInGroup.push(harnesses[i].name);
        }
        HarnessClient.createOptions(this.groupSelect, Harness.getGroupNames());
        HarnessClient.selectOption(this.groupSelect, this.groupName);
        HarnessClient.createOptions(this.harnessSelect, harnessNamesInGroup);
        HarnessClient.selectOption(this.harnessSelect, this.harnessName);
        HarnessClient.createOptions(this.variantSelect, harness.getVariantNames());
        HarnessClient.selectOption(this.variantSelect, this.variantName);
        this.groupSelect.addEventListener('change', this.groupSelectHandler(this), false);
        this.variantSelect.addEventListener('change', this.variantSelectHandler(this), false);
        this.harnessSelect.addEventListener('change', this.harnessSelectHandler(this), false);
        this.writeToLocalStorage(true);
        harness.activateVariant(this.variantName);
        Harness.load(this.appliedMocks);
        HarnessClient.bootstrap(harness);
        this.generateMockElements();
    };
    HarnessClient.prototype.writeToLocalStorage = function (keepDisabledState) {
        if (keepDisabledState === void 0) { keepDisabledState = false; }
        var harnessString = this.groupName + ":" + this.harnessName + ":" + this.variantName;
        var mockList = [];
        var keys = Object.keys(this.appliedMocks);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] === '')
                continue;
            mockList.push(keys[i] + ":" + this.appliedMocks[keys[i]]);
        }
        localStorage.setItem(this.storageId + "mocks", mockList.join(','));
        localStorage.setItem(this.storageId + "harness", harnessString);
        localStorage.setItem(this.storageId + "showControlPanel", String(this.showControlPanel));
        localStorage.setItem(this.storageId + "openCards", JSON.stringify(this.openInjectionTargetHeaders));
        if (keepDisabledState)
            return;
        document.getElementById('harness-apply-changes').removeAttribute('disabled');
    };
    HarnessClient.prototype.readFromLocalStorage = function () {
        var NONE = '-- None --';
        this.getAppliedMockPairs();
        try {
            this.showControlPanel = JSON.parse(localStorage.getItem(this.storageId + "showControlPanel"));
        }
        catch (e) {
            this.showControlPanel = true;
        }
        try {
            var rawValue = localStorage.getItem(this.storageId + "openCards");
            var parsed = JSON.parse(rawValue);
            if (parsed && typeof parsed === "object") {
                this.openInjectionTargetHeaders = parsed;
            }
            else {
                this.openInjectionTargetHeaders = {};
            }
        }
        catch (e) {
            this.openInjectionTargetHeaders = {};
        }
        var str = localStorage.getItem(this.storageId + "harness");
        if (!str) {
            this.groupName = 'All';
            this.harnessName = NONE;
            this.variantName = NONE;
            return;
        }
        var split = str.split(':');
        this.groupName = split[0];
        this.harnessName = split[1];
        this.variantName = split[2];
        if (Harness.getGroupNames().indexOf(this.groupName) !== -1) {
            var harness = Harness.getHarnessByName(this.harnessName);
            if (!harness) {
                this.harnessName = NONE;
                this.variantName = NONE;
                return;
            }
            this.harnessName = harness.name;
            if (!harness.hasVariant(this.variantName)) {
                this.variantName = Harness.getEmptyVariantName();
            }
        }
        else {
            this.groupName = 'All';
            this.harnessName = NONE;
            this.variantName = NONE;
        }
    };
    HarnessClient.prototype.getAppliedMockPairs = function () {
        var mocks = localStorage.getItem(this.storageId + "mocks") || '';
        var mockList = mocks.split(',');
        this.appliedMocks = {};
        for (var i = 0; i < mockList.length; i++) {
            var split = mockList[i].split(':');
            if (split[0] === '')
                continue;
            this.appliedMocks[split[0]] = split[1];
        }
    };
    HarnessClient.prototype.updateHarnessList = function () {
        var harnesses = Harness.getAllInGroup(this.groupName);
        var harnessNamesInGroup = [];
        for (var i = 0; i < harnesses.length; i++) {
            harnessNamesInGroup.push(harnesses[i].name);
        }
        HarnessClient.createOptions(this.harnessSelect, harnessNamesInGroup);
        this.harnessName = harnesses[0].name;
        this.writeToLocalStorage();
        this.updateVariantList();
    };
    HarnessClient.prototype.updateVariantList = function () {
        var harness = Harness.getHarnessByName(this.harnessName);
        HarnessClient.createOptions(this.variantSelect, harness.getVariantNames());
        this.writeToLocalStorage();
    };
    HarnessClient.prototype.applyDefaultMocks = function () {
        var harness = Harness.getHarnessByName(this.harnessName);
        this.appliedMocks = harness.getDefaultMocks();
        this.generateMockElements();
    };
    HarnessClient.prototype.groupSelectHandler = function (ctx) {
        return function (event) {
            var element = event.currentTarget;
            ctx.groupName = element.options[element.selectedIndex].value;
            ctx.updateHarnessList();
            ctx.applyDefaultMocks();
            ctx.writeToLocalStorage();
        };
    };
    HarnessClient.prototype.harnessSelectHandler = function (ctx) {
        return function (event) {
            var element = event.currentTarget;
            ctx.harnessName = element.options[element.selectedIndex].value;
            ctx.updateVariantList();
            ctx.applyDefaultMocks();
            ctx.writeToLocalStorage();
        };
    };
    HarnessClient.prototype.variantSelectHandler = function (ctx) {
        return function (event) {
            var element = event.currentTarget;
            ctx.variantName = element.options[element.selectedIndex].value;
            var harness = Harness.getHarnessByName(ctx.harnessName);
            harness.activateVariant(ctx.variantName);
            ctx.applyDefaultMocks();
            ctx.writeToLocalStorage();
        };
    };
    HarnessClient.prototype.mockCheckboxHandler = function (ctx, injectionTarget, mock) {
        return function (event) {
            if (mock === null) {
                delete ctx.appliedMocks[this.getAttribute('name')];
            }
            else {
                ctx.appliedMocks[this.getAttribute('name')] = mock.name;
            }
            var header = this.parentNode.parentNode.parentNode.parentNode.childNodes[0];
            ctx.setHeaderText(header, injectionTarget);
            ctx.writeToLocalStorage();
        };
    };
    HarnessClient.selectOption = function (parent, value) {
        for (var i = 0; i < parent.options.length; i++) {
            var option = parent.options[i];
            if (option.value === value) {
                option.setAttribute('selected', 'true');
            }
            else {
                option.removeAttribute('selected');
            }
        }
    };
    HarnessClient.createOptions = function (parent, contents) {
        contents.sort();
        HarnessClient.removeChildren(parent);
        for (var i = 0; i < contents.length; i++) {
            var option = document.createElement('option');
            option.value = contents[i];
            option.text = contents[i];
            parent.appendChild(option);
        }
    };
    HarnessClient.removeChildren = function (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };
    HarnessClient.prototype.addAccordionListener = function (ctx, injectionTarget, card, header) {
        header.addEventListener('click', function (e) {
            card.classList.toggle(HarnessClient.ToggleAccordionClass);
            ctx.openInjectionTargetHeaders[injectionTarget] = !card.classList.contains(HarnessClient.ToggleAccordionClass);
            ctx.writeToLocalStorage(true);
        }, false);
    };
    HarnessClient.prototype.generateMockElements = function () {
        var parentElement = document.getElementById('harness-mock-accordion');
        HarnessClient.removeChildren(parentElement);
        var fragment = document.createDocumentFragment();
        var injectionTargets = Mock.getInjectionTargetList();
        for (var i = 0; i < injectionTargets.length; i++) {
            var card = document.createElement('div');
            var header = document.createElement('div');
            var contents = document.createElement('div');
            if (this.openInjectionTargetHeaders[injectionTargets[i]]) {
                card.className = "harness-card";
            }
            else {
                card.className = "harness-card closed";
            }
            header.className = "harness-card-header";
            contents.className = "harness-card-contents";
            this.setHeaderText(header, injectionTargets[i]);
            this.addAccordionListener(this, injectionTargets[i], card, header);
            card.appendChild(header);
            card.appendChild(contents);
            contents.appendChild(this.createRadioOption(null, injectionTargets[i]));
            var mocks = Mock.getMocksForInjectionTarget(injectionTargets[i]);
            for (var j = 0; j < mocks.length; j++) {
                contents.appendChild(this.createRadioOption(mocks[j], injectionTargets[i]));
            }
            fragment.appendChild(card);
        }
        parentElement.appendChild(fragment);
    };
    HarnessClient.prototype.setHeaderText = function (header, injectionTarget) {
        var appliedMock = this.appliedMocks[injectionTarget];
        if (appliedMock)
            appliedMock = " [" + appliedMock + "]";
        header.innerHTML = "<h5>" + injectionTarget + (appliedMock || '') + "</h5>";
    };
    HarnessClient.prototype.createRadioOption = function (mock, injectionTarget) {
        var labelText = (mock) ? mock.name : 'None';
        var container = document.createElement('div');
        container.className = "harness-input-container";
        var label = document.createElement('label');
        var radio = document.createElement('input');
        var textNode = document.createTextNode(' ' + labelText);
        radio.setAttribute('type', 'radio');
        radio.setAttribute('name', injectionTarget);
        var appliedMock = this.appliedMocks[injectionTarget];
        if (!appliedMock && !mock) {
            radio.setAttribute('checked', 'true');
        }
        else if (appliedMock && mock && appliedMock === mock.name) {
            radio.setAttribute('checked', 'true');
        }
        radio.addEventListener('change', this.mockCheckboxHandler(this, injectionTarget, mock), false);
        label.appendChild(radio);
        label.appendChild(textNode);
        container.appendChild(label);
        return container;
    };
    HarnessClient.bootstrap = function (harness) {
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
        var parent = document.getElementById('harness-page-contents');
        parent.innerHTML = '<entry-point></entry-point>';
        parent.setAttribute('ng-app', 'AngularHarnessApplication');
    };
    HarnessClient.ViewToggleClass = 'harness-control-panel-in-view';
    HarnessClient.ToggleAccordionClass = 'closed';
    return HarnessClient;
})();
