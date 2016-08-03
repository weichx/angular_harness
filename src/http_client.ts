document.addEventListener('DOMContentLoaded', function (event : any) {
    window['HarnessClient'] = new HarnessHTTPClient();
}, false);

var parser = document.createElement('a');

var getQuery = function (search : string) {
    var params : any = {};
    var queries = search.slice(1).split("&");
    // Convert the array of strings into an object
    for (var i = 0; i < queries.length; i++) {
        var temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
    return params;
};

function ParsedUrl(url : string) {
    parser.href = url;
    this.url = url;
    this.protocol = parser.protocol;
    this.hostname = parser.hostname;
    this.host = parser.host;
    this.port = parser.port;
    this.pathname = parser.pathname;
    this.search = parser.search;
    this.hash = parser.hash;
    this.query = getQuery(this.search);
}

class HarnessHTTPClient {

    constructor() {
        var params = new ParsedUrl(location.href).query;
        var harnessName = params['harness'];
        var variantName = params['variant'];
        var mockSets = params['mocks'];
        if (harnessName) {
            harnessName = decodeURIComponent(harnessName);
            var mocks : any = {};
            if (mockSets) {
                mocks = JSON.parse(decodeURIComponent(mockSets));
            }
            var harness = Harness.getHarnessByName(harnessName);
            if (!harness) {
                harness = Harness.getDefaultHarness();
                console.warn(`unable to load harness ${harnessName}, loading default instead`)
            }
            if(variantName) {
                variantName = decodeURIComponent(variantName);
            }
            if (variantName && !harness.hasVariant(variantName)) {
                console.warn(`unable to load variant ${variantName}, loading default harness`)
            }
            Mock.assertValidMocks(mocks || {});
            harness.activateVariant(variantName);
            Harness.load(Harness.mergeMocks(harness.getDefaultMocks(), mocks));
            HarnessHTTPClient.bootstrap(harness);
        }
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
        var parent = document.body;
        //provides a button that will destroy a directive when clicked and re-create it when clicked again. this shaves
        //a huge amount of time off of automated test runs that reload the page each time.
        parent.innerHTML = '<button class="HARNESS-RESET" ng-init="i = 1" ng-click="i = i + 1">\n    Reset Harness\n</button>\n<entry-point ng-if="i % 2 !== 0"></entry-point>\n\n';
        parent.setAttribute('ng-app', 'AngularHarnessApplication');
    }
}