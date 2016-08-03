interface AngularEntityRegistry {
    [index : string] : AngularEntity;
}

class AngularEntity {
    public moduleName : string;
    public providerType : string;
    public injectionTarget : string;
    public implementation : any;
    private static entityRegistry : AngularEntityRegistry = {};

    constructor(moduleName : string, providerType : string, injectionTarget : string, implementation : any) {
        this.moduleName = moduleName;
        this.providerType = providerType;
        this.injectionTarget = injectionTarget;
        this.implementation = implementation;
        AngularEntity.register(this);
    }

    private static register(entity : AngularEntity) {
        if(!entity.injectionTarget) return;
        AngularEntity.entityRegistry[entity.injectionTarget] = entity;
    }

    //todo use this for unsetting async modules (for testing)
    public static getEntityForInjectionTarget(injectionTarget : string) : AngularEntity {
        return AngularEntity.entityRegistry[injectionTarget];
    }
}