(function (Harness) {

    if (!Harness) throw new Error('HarnessInstance.Http requires HarnessInstance to be defined before it runs!');
    var httpMocks = {};

    var HttpMock = function (name, pattern, impl) {
        this.name = name;
        this.urlPattern = new Harness.Http.UrlPattern(pattern);
        this.impl = impl;
    };

    var httpVerbs = [
        'get', 'put', 'post', 'delete', 'patch', 'head'
    ];

    Harness.Http = function (name, urlPattern, impl) {
        var keys = Object.keys(impl);
        for (var i = 0; i < keys.length; i++) {
            var verb = keys[i];
            if (httpVerbs.indexOf(verb) !== -1) {
                httpMocks[verb + name] = new HttpMock(name, urlPattern, impl[verb]);
            }
        }
    };

    Harness.Http.getStub = function (verb, url) {
        var harness = Harness.getCurrentHarness();
        var httpMockNames = Object.keys(harness.http);

        //get all http mocks on current harness
        //for each of them
        //get their implementation
        //if implementation, check its pattern against url
        //if matched return true;
        for (var i = 0; i < httpMockNames.length; i++) {
            var httpName = httpMockNames[i];
            //check if we have a stub with the verb `verb` and name `httpName`
            var httpMock = Harness.__entities.http[verb + httpName];
            if (!httpMock) continue;
            //if stub exists see if it matches our url pattern
            var params = httpMock.urlPattern.match(url);
            if (params) {
                //if pattern matches check if we actually have the verb mocked
                if (verb === '*' || harness.http[httpName].indexOf(verb) !== -1) {
                    return new Harness.Http.HttpResponse(url, params, httpMock.impl);
                }
            }
        }
        return null;
    };

    Harness.__entities.http = httpMocks;
})(HarnessInstance);

