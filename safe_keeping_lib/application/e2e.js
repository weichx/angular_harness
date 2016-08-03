var HarnessE2E = (function(Harness) {

    var parser = document.createElement('a');

    var getQuery = function (search) {
        var params = {};
        var queries = search.slice(1).split("&");
        // Convert the array of strings into an object
        for (var i = 0; i < queries.length; i++) {
            var temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }
        return params;
    };

    function ParsedUrl(url) {
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

    document.addEventListener('DOMContentLoaded', function () {
        window.AngularAsyncModules.unravelComplete = function () {
            var currentHarnessName = new ParsedUrl(location.href).query.harness;
            currentHarnessName = decodeURI(currentHarnessName);
            Harness.load(currentHarnessName);
            var harness = Harness.getCurrentHarness();

            if (harness.name !== 'Production') { //don't replace body in production
                var body = document.body;
                body.setAttribute('ng-app', harness.moduleName);
                angular.module(harness.moduleName).directive('entryPoint', function () {
                    return {
                        template: harness.template,
                        templateUrl: harness.templateUrl,
                        controller: harness.context
                    };
                });
                body.innerHTML = '<entry-point></entry-point>';
            }
        };
    });
})(HarnessInstance);