/// <reference path="./mock.ts"/>
/// <reference path="./i_harness.ts"/>

class Variant implements IHarness{
    public defaultMocks : MockSetDescriptor;
    public additionalMocks : MockSetDescriptor;
    public name : string;
    public context : Function;
    public template : string;
    public templateUrl : string;

    constructor(name : string) {
        this.name = name;
        this.defaultMocks = null;
        this.additionalMocks = null;
        this.context = null;
        this.template = null;
        this.templateUrl = null;
    }

    public setDefaultMocks(defaultMocks : MockSetDescriptor) : void {
        this.defaultMocks = defaultMocks;
    }

    public addDefaultMocks(addedDefaultMocks : MockSetDescriptor) : void {
        this.additionalMocks = addedDefaultMocks;
    }

    public setContext(context : Function) : void {
        this.context = context;
    }

    public setTemplate(template : string) : void {
        this.template = template;
    }

    public setTemplateUrl(templateUrl : string) : void {
        this.templateUrl = templateUrl;
    }

    public static Empty : Variant = new Variant('-- None --');

}