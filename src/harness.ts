/// <reference path="./variant.ts"/>
/// <reference path="./mock.ts"/>
/// <reference path="./module.ts"/>
/// <reference path="./i_harness.ts"/>

type variantCallback = (variant : Variant) => void;
type HarnessFn = (harness : Harness) => void;

class Harness implements IHarness {
    public name : string;
    public groupNames : Array<string>;
    public templateUrl : string;
    public template : string;
    public context : Function;
    public defaultMocks : MockSetDescriptor;
    private variants : Array<Variant>;
    private activeVariant : Variant;
    private rootModuleName : string;

    protected static harnessList : Array<Harness> = [Harness.getDefaultHarness()];

    constructor(name : string, fn : HarnessFn) {
        if (!(this instanceof Harness)) {
            var harness = new Harness(name, fn);
            fn(harness);
            Harness.harnessList.push(harness);
            return harness;
        } else {
            this.name = name;
            this.variants = new Array<Variant>();
            this.variants.push(Variant.Empty);
            this.groupNames = new Array<string>();
            this.groupNames.push('All');
            this.template = null;
            this.templateUrl = null;
            this.context = function () {};
            this.defaultMocks = {};
        }
    }

    public getTemplate() : string {
        var variant = this.getActiveVariant();
        if (!variant || !variant.template) {
            return this.template;
        }
        return variant.template;
    }

    public getTemplateUrl() : string {
        var variant = this.getActiveVariant();
        if (!variant || !variant.templateUrl) {
            return this.templateUrl;
        }
        return variant.templateUrl;
    }

    public getContext() : Function {
        var variant = this.getActiveVariant();
        if (!variant || !variant.context) {
            return this.context;
        }
        return variant.context;
    }

    public setContext(ctx : Function) : void {
        this.context = ctx;
    }

    public setTemplateUrl(templateUrl : string) : void {
        this.templateUrl = templateUrl;
    }

    public setTemplate(template : string) : void {
        this.template = template;
    }

    public setDefaultMocks(defaultMocks : MockSetDescriptor) : void {
        this.defaultMocks = defaultMocks;
    }

    public getDefaultMocks() : MockSetDescriptor {
        var variant = this.activeVariant;
        if(!variant) {
            return this.defaultMocks;
        }
        if(variant.defaultMocks) {
            return Harness.mergeMocks(variant.defaultMocks, variant.additionalMocks);
        }
        if(variant.additionalMocks) {
            return Harness.mergeMocks(this.defaultMocks, variant.additionalMocks);
        }
        return this.defaultMocks;
    }

    public getRootModuleName() : string {
        return this.rootModuleName || 'Application';
    }

    public addVariant(name : string, fn : variantCallback) {
        var variant = new Variant(name);
        fn(variant);
        this.variants.push(variant);
    }

    public activateVariant(name : string) {
        this.activeVariant = this.getVariantByName(name);
    }

    public addToGroup(groupName : string) : void {
        this.groupNames.push(groupName);
    }

    public getVariantByName(variantName : string) : Variant {
        for (var i = 0; i < this.variants.length; i++) {
            if (this.variants[i].name === variantName) {
                return this.variants[i];
            }
        }
        return null;
    }

    public hasVariant(variantName : string) : boolean {
        return this.getVariantByName(variantName) !== null;
    }

    public static getEmptyVariantName() : string {
        return Variant.Empty.name;
    }

    public getVariantNames() : Array<string> {
        return this.variants.map(function (variant : Variant) {
            return variant.name;
        });
    }

    public getActiveVariant() : Variant {
        return this.activeVariant;
    }


    public static getHarnessByName(harnessName : string) : Harness {
        return Harness.harnessList.filter(function (harness) {
            return harness.name == harnessName;
        })[0];
    }

    public static load(activeMocks : MockSetDescriptor) : void {
        throw new Error("Override this in a subclass");
    }

    public static unload() : void {
        Harness.load({});
    }

    public static getDefaultHarness() : Harness {
        return new Harness('-- None --', function (harness : Harness) {});
    }

    public static getAllInGroup(groupName : string) : Array<Harness> {
        return Harness.harnessList.filter(function (harness : Harness) {
            return harness.groupNames.indexOf(groupName) !== -1;
        });
    }

    public static getGroupNames() : Array<string> {
        var names : string[] = [];
        for (var i = 0; i < Harness.harnessList.length; i++) {
            for (var j = 0; j < Harness.harnessList[i].groupNames.length; j++) {
                var name = Harness.harnessList[i].groupNames[j];
                if (names.indexOf(name) === -1) names.push(name);
            }
        }
        names.sort();
        names.splice(names.indexOf('All'), 1);
        names.unshift('All');
        return names;
    }

    public static mergeMocks(dest : MockSetDescriptor, src : MockSetDescriptor) : MockSetDescriptor {
        if(!src) src = {};
        var keys = Object.keys(dest).concat(Object.keys(src));
        var retn : MockSetDescriptor = {};
        for(var i = 0; i < keys.length; i++) {
            retn[keys[i]] = dest[keys[i]];
            if(src[keys[i]]) {
                retn[keys[i]] = src[keys[i]];
            }
        }
        return retn;
    }
}

(function () {
    window['Harness'] = Harness;
    if (window['jasmine'] || window['mocha']) {
        var fn = function (itFn : Function) {
            return function (testName : string, impl : Function) {
                //inspect the arguments of the impl function,
                //if it declares any parameters, treat it as async
                var str = impl.toString();
                var argStart = str.indexOf('(') + 1;
                var argEnd = str.indexOf(')');
                var argStr = str.substring(argStart, argEnd).trim();
                var isAsync = argStr !== '';
                if (isAsync) {
                    return itFn(testName, function (done : () => void) {
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
        window['it'] = fn(window['it']);
        window['xit'] = fn(window['xit']);
        window['fit'] = fn(window['fit']);
    }
})();