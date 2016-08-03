interface IHarness {
    name : string;
    template: string;
    templateUrl:string;
    context: Function;
    setDefaultMocks(obj : Object) : void;
    setContext(ctx : any) : void;
    setTemplate(template : string) : void;
    setTemplateUrl(templateUrl : string) : void;
}