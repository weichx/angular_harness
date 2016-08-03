HarnessInstance.Http.HttpRequest = (function () {
    var XHR = XMLHttpRequest;

    window.XMLHttpRequest = StubHttpRequest;

    function StubHttpRequest() {
        this.stubbedResponse = null;
        this.async = null;
        this.timeoutId = null;
        this.onload = null;
        this._onabort = null;
        this._onerror = null;
        this.requestHeaders = {};
        this.flightTime = null;

        //response data
        this.status = null;
        this.statusText = null;
        this.response = null;
        this.responseText = null;
        this.responseHeaders = {};
    }

    Object.defineProperties(StubHttpRequest.prototype, {
        onerror: {
            get: function () {
                return this._onerror;
            },
            set: function (value) {
                this._onerror = value;
            }
        },
        onabort: {
            get: function() {
                return this._onabort;
            },
            set: function(value) {
                this._onabort = value;
            }
        }
    });

    StubHttpRequest.prototype.open = function (method, url, async) {
        method = method.toLowerCase();
        this.stubbedResponse = HarnessInstance.Http.getStub(method, url);
        if(!HarnessInstance.getCurrentHarness().allowRealHttp && !this.stubbedResponse) {
            throw new Error('real request made');
        }
        if (!this.stubbedResponse) {
            this.xhr = new XHR();
            async = (typeof async === 'undefined') && true || async;
            this.xhr.open(method, url, async);
        }
    };

    StubHttpRequest.prototype.abort = function () {
        if (this.xhr) {
            this.xhr.abort();
        } else {
            this.timeoutId && clearTimeout(this.timeoutId);
            this.onabort && this.onabort();
        }
    };

    StubHttpRequest.prototype.getAllResponseHeaders = function () {
        if (this.xhr) {
            return this.xhr.getAllResponseHeaders();
        } else {
            //stringify? unsure what the format is, docs says 'DomString'
            return JSON.stringify(this.headers);
        }
    };

    StubHttpRequest.prototype.getResponseHeader = function (header) {
        if (this.xhr) {
            return this.xhr.getResponseHeader(header);
        } else {
            return this.headers[header];
        }
    };

    StubHttpRequest.prototype.send = function (data) {
        var self = this;
        if (this.xhr) {
            this.xhr.onload = function() {
                self.response = self.xhr.response;
                self.responseText = self.xhr.responseText;
                self.responseType = self.xhr.responseType;
                self.status = self.xhr.status;
                self.statusText = self.xhr.statusText;
                self.onload();
            };
            this.xhr.send(data);
        } else {
            this.body = data;
            this.stubbedResponse.invoke(this);
            this.timeoutId = setTimeout(function () {
                self.onload();
            }, this.flightTime);
        }
    };

    StubHttpRequest.prototype.setRequestHeader = function (header, value) {
        if (this.xhr) {
            this.xhr.setRequestHeader(header, value);
        } else {
            this.requestHeaders[header] = value;
        }
    };

    return StubHttpRequest;
})();