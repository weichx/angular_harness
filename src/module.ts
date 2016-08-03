/// <reference path="./entity"/>
interface IModuleStore {
    [idx : string] : AngularModule
}

class AngularModule {
    public entityList : Array<AngularEntity>;
    public name : string;
    public dependencies : Array<string>;
    public static modules : IModuleStore = {};

    constructor(name : string) {
        this.name = name;
        this.dependencies = [];
        this.entityList = [];
        AngularModule.modules[this.name] = this;
    }

    public addToEntities(providerType : string,  providerName : string, implementation : any ) : AngularModule {
      this.entityList.push( new AngularEntity( this.name, providerType, providerName, implementation ));
      return this;
    }

    public run (implementation : any ) : AngularModule {
        return this.addToEntities('run', null, implementation);
    }

    public config(implementation : any ) : AngularModule {
        return this.addToEntities('config', null, implementation);
    }

    public service( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('service', providerName, implementation);
    }

    public factory( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('factory', providerName, implementation);
    }

    public provider( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('provider', providerName, implementation);
    }

    public value( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('value', providerName, implementation);
    }

    public constant( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('constant', providerName, implementation);
    }

    public filter( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('filter', providerName, implementation);
    }

    public animation( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('animation', providerName, implementation);
    }

    public controller( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('controller', providerName, implementation);
    }

    public directive( providerName : string, implementation : any ) : AngularModule {
      return this.addToEntities('directive', providerName, implementation);
    }
}