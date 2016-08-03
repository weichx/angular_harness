/// <reference path="./harness"/>

interface IInjectionTargetHeaderStore {
    [idx : string] : any
}

type Select = HTMLSelectElement;
document.addEventListener('DOMContentLoaded', function (event : any) {
    var html = "REPLACE_WITH_HTML";
    var css = "REPLACE_WITH_CSS";
    var div = document.createElement('div');
    div.innerHTML = html;
    var styleTag = document.createElement('style');
    //for webkit
    styleTag.appendChild(document.createTextNode(""));
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
    document.body.appendChild(div);

    var groupSelect = <Select>document.getElementById('harness-group-select');
    var variantSelect = <Select>document.getElementById('harness-variant-select');
    var harnessSelect = <Select>document.getElementById('harness-instance-select');
    window['HarnessClient'] = new HarnessClient(groupSelect, harnessSelect, variantSelect);
}, false);

class HarnessClient {
    private storageId : string;
    private showControlPanel : boolean;

    private groupSelect : Select;
    private harnessSelect : Select;
    private variantSelect : Select;

    private groupName : string;
    private harnessName : string;
    private variantName : string;
    private appliedMocks : MockSetDescriptor;
    private openInjectionTargetHeaders : IInjectionTargetHeaderStore;
    private static ViewToggleClass : string = 'harness-control-panel-in-view';
    private static ToggleAccordionClass : string = 'closed';

    constructor(groupSelect : Select, harnessSelect : Select, variantSelect : Select) {
        var urlPath = location.host + location.pathname;
        this.groupSelect = groupSelect;
        this.variantSelect = variantSelect;
        this.harnessSelect = harnessSelect;
        this.storageId = urlPath + '_';
        this.appliedMocks = {};
        this.initialize();
    }

    private initialize() : void {
        var self = this;
        window.addEventListener('keydown', function (e : KeyboardEvent) {
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
            var harness : Harness = Harness.getHarnessByName(self.harnessName);
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

        var harness : Harness = Harness.getHarnessByName(this.harnessName);
        if (!harness) harness = Harness.getDefaultHarness();

        var harnesses : Array<Harness> = Harness.getAllInGroup(this.groupName);
        var harnessNamesInGroup : Array<string> = [];
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
    }

    private writeToLocalStorage(keepDisabledState : boolean = false) : void {
        var harnessString = this.groupName + ":" + this.harnessName + ":" + this.variantName;
        var mockList : string[] = [];
        var keys = Object.keys(this.appliedMocks);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] === '') continue;
            mockList.push(keys[i] + ":" + this.appliedMocks[keys[i]]);
        }
        localStorage.setItem(this.storageId + "mocks", mockList.join(','));
        localStorage.setItem(this.storageId + "harness", harnessString);
        localStorage.setItem(this.storageId + "showControlPanel", String(this.showControlPanel));
        localStorage.setItem(this.storageId + "openCards", JSON.stringify(this.openInjectionTargetHeaders));
        if (keepDisabledState) return;
        document.getElementById('harness-apply-changes').removeAttribute('disabled')
    }

    private readFromLocalStorage() : void {
        var NONE = '-- None --';
        this.getAppliedMockPairs();
        try {
            this.showControlPanel = JSON.parse(localStorage.getItem(this.storageId + "showControlPanel"));
        } catch (e) {
            this.showControlPanel = true;
        }
        try {
            var rawValue = localStorage.getItem(this.storageId + "openCards");
            var parsed = JSON.parse(rawValue);
            if(parsed && typeof parsed === "object") {
                this.openInjectionTargetHeaders = parsed;
            } else {
                this.openInjectionTargetHeaders = {};
            }
        } catch(e) {
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
        //validate group name
        if (Harness.getGroupNames().indexOf(this.groupName) !== -1) {
            var harness = Harness.getHarnessByName(this.harnessName);
            if (!harness) {
                //reset
                this.harnessName = NONE;
                this.variantName = NONE;
                return;
            }
            this.harnessName = harness.name;
            if (!harness.hasVariant(this.variantName)) {
                this.variantName = Harness.getEmptyVariantName();
            }
        } else {
            this.groupName = 'All';
            this.harnessName = NONE;
            this.variantName = NONE;
        }
    }

    private getAppliedMockPairs() {
        var mocks = localStorage.getItem(this.storageId + "mocks") || '';
        //format --> InjectionTarget:MockName,InjectionTarget:MockName
        var mockList = mocks.split(',');
        this.appliedMocks = {};
        for (var i = 0; i < mockList.length; i++) {
            var split = mockList[i].split(':');
            if (split[0] === '') continue;
            this.appliedMocks[split[0]] = split[1];
        }
    }

    private updateHarnessList() : void {
        var harnesses : Array<Harness> = Harness.getAllInGroup(this.groupName);
        var harnessNamesInGroup : Array<string> = [];
        for (var i = 0; i < harnesses.length; i++) {
            harnessNamesInGroup.push(harnesses[i].name);
        }
        HarnessClient.createOptions(this.harnessSelect, harnessNamesInGroup);
        this.harnessName = harnesses[0].name;
        this.writeToLocalStorage();
        this.updateVariantList();
    }

    private updateVariantList() : void {
        var harness = Harness.getHarnessByName(this.harnessName);
        HarnessClient.createOptions(this.variantSelect, harness.getVariantNames());
        //todo -- what goes here?
        this.writeToLocalStorage();
    }

    private applyDefaultMocks() : void {
        var harness : Harness = Harness.getHarnessByName(this.harnessName);
        this.appliedMocks = harness.getDefaultMocks();
        this.generateMockElements();
    }

    private groupSelectHandler(ctx : HarnessClient) : EventListener {
        return function (event) {
            var element = (<Select>event.currentTarget);
            ctx.groupName = element.options[element.selectedIndex].value;
            ctx.updateHarnessList();
            ctx.applyDefaultMocks();
            ctx.writeToLocalStorage();
        }
    }

    private harnessSelectHandler(ctx : HarnessClient) : EventListener {
        return function (event) {
            var element = (<Select>event.currentTarget);
            ctx.harnessName = element.options[element.selectedIndex].value;
            ctx.updateVariantList();
            ctx.applyDefaultMocks();
            ctx.writeToLocalStorage();
        }
    }

    private variantSelectHandler(ctx : HarnessClient) : EventListener {
        return function (event) {
            var element = (<Select>event.currentTarget);
            ctx.variantName = element.options[element.selectedIndex].value;
            var harness : Harness = Harness.getHarnessByName(ctx.harnessName);
            harness.activateVariant(ctx.variantName);
            ctx.applyDefaultMocks();
            ctx.writeToLocalStorage();
        }
    }

    private mockCheckboxHandler(ctx : HarnessClient, injectionTarget : string, mock : Mock) : EventListener {
        return function (event) {
            if (mock === null) {
                delete ctx.appliedMocks[this.getAttribute('name')];
            } else {
                ctx.appliedMocks[this.getAttribute('name')] = mock.name;
            }
            //well this is just silly ...
            var header = this.parentNode.parentNode.parentNode.parentNode.childNodes[0];
            ctx.setHeaderText(header, injectionTarget);
            ctx.writeToLocalStorage();
        };
    }

    private static selectOption(parent : Select, value : string) {
        for (var i = 0; i < parent.options.length; i++) {
            var option = parent.options[i];
            if (option.value === value) {
                option.setAttribute('selected', 'true');
            } else {
                option.removeAttribute('selected');
            }
        }
    }

    private static createOptions(parent : Select, contents : Array<string>) {
        contents.sort();
        HarnessClient.removeChildren(parent);
        for (var i = 0; i < contents.length; i++) {
            var option = <HTMLOptionElement>document.createElement('option');
            option.value = contents[i];
            option.text = contents[i];
            parent.appendChild(option);
        }
    }

    private static removeChildren(element : HTMLElement) : void {
        //definitely leaking some event listeners, oh well
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    private addAccordionListener(ctx : HarnessClient, injectionTarget : string, card : HTMLElement, header : HTMLElement) {
        header.addEventListener('click', function (e : MouseEvent) {
            card.classList.toggle(HarnessClient.ToggleAccordionClass);
            ctx.openInjectionTargetHeaders[injectionTarget] = !card.classList.contains(HarnessClient.ToggleAccordionClass);
            ctx.writeToLocalStorage(true);
        }, false);
    }

    private generateMockElements() : void {
        var parentElement = document.getElementById('harness-mock-accordion');
        HarnessClient.removeChildren(parentElement);
        var fragment = document.createDocumentFragment();
        var injectionTargets : Array<string> = Mock.getInjectionTargetList();
        for (var i = 0; i < injectionTargets.length; i++) {
            var card = document.createElement('div');
            var header = document.createElement('div');
            var contents = document.createElement('div');
            if(this.openInjectionTargetHeaders[injectionTargets[i]]) {
                card.className = "harness-card";
            } else {
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
    }

    private setHeaderText(header : HTMLElement, injectionTarget : string) : void {
        var appliedMock = this.appliedMocks[injectionTarget];
        if(appliedMock) appliedMock = " [" + appliedMock + "]";
        header.innerHTML = "<h5>" + injectionTarget + (appliedMock || '') + "</h5>";
    }

    private createRadioOption(mock : Mock, injectionTarget : string) : HTMLDivElement {
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
        } else if (appliedMock && mock && appliedMock === mock.name) {
            radio.setAttribute('checked', 'true');
        }
        radio.addEventListener('change', this.mockCheckboxHandler(this, injectionTarget, mock), false);
        label.appendChild(radio);
        label.appendChild(textNode);
        container.appendChild(label);
        return container;
    }

    public static bootstrap(harness : Harness) : void {
        var deps = [harness.getRootModuleName()];
        window['angular'].module('AngularHarnessApplication', deps).directive('entryPoint', function () {
            return {
                template: harness.getTemplate(),
                templateUrl: harness.getTemplateUrl(),
                controller: harness.getContext()
            };
        });

        var element = document.querySelector("[ng-app]");
        if (element) element.removeAttribute("ng-app");
        var parent = document.getElementById('harness-page-contents');
        parent.innerHTML = '<entry-point></entry-point>';
        parent.setAttribute('ng-app', 'AngularHarnessApplication');
    }
}