HarnessInstance.Http.HttpResponse = (function() {

    var StubHttpResponse = function (url, urlParameters, impl) {
        this.url = url;
        this.urlParameters = urlParameters;
        this.impl = impl;
    };

    StubHttpResponse.prototype.invoke = function (request, fn) {
        var retn = this.impl(this.url, this.urlParameters, request.body, request.requestHeaders) || {};
        request.status = retn.status || StubHttpResponse.DefaultStatus;
        request.statusText = retn.statusText || StubHttpResponse.getStatusText(request.status);
        request.responseHeaders = retn.headers || {};
        request.response = retn.response || "";
        request.responseType = retn.responseType || StubHttpResponse.getResponseType(request.response);
        request.flightTime = retn.flightTime || StubHttpResponse.DefaultFlightTime;
    };

    StubHttpResponse.DefaultFlightTime = 200;
    StubHttpResponse.DefaultStatus = 200;
    StubHttpResponse.DefaultResponse = "";
    StubHttpResponse.DefaultResponseHeaders = {};

    StubHttpResponse.getStatusText = function (status) {
        switch(status) {
            case 100:
                return '100 Continue';
            case 101:
                return '101 Switching Protocols';
            case 200:
                return '200 OK';
            case 201:
                return '201 Created';
            case 202:
                return '202 Accepted';
            case 203:
                return '203 Non-Authoritative Information';
            case 204:
                return '204 No Content';
            case 205:
                return '205 Reset Content';
            case 206:
                return '206 Partial Content';
            case 300:
                return '300 Multiple Choices';
            case 301:
                return '301 Moved Permanently';
            case 302:
                return '302 Found';
            case 303:
                return '303 See Other';
            case 304:
                return '304 Not Modified';
            case 305:
                return '305 Use Proxy';
            case 307:
                return '307 Temporary Redirect';
            case 400:
                return '400 Bad Request';
            case 401:
                return '401 Unauthorized';
            case 402:
                return '402 Payment Required';
            case 403:
                return '403 Forbidden';
            case 404:
                return '404 Not Found';
            case 405:
                return '405 Method Not Allowed';
            case 406:
                return '406 Not Acceptable';
            case 422:
                return '422 Unprocessable Entity';
            case 500:
                return '500 Internal Server Error';
            default:
                return status + ' Unknown';
        }
    };

    StubHttpResponse.getResponseType = function (body) {
        if (body === "") return "";
        if (typeof body === 'string') return "text";
        if (body instanceof ArrayBuffer) return "arraybuffer";
        if (body instanceof Blob) return "blob";
        if (body instanceof Document) return "document";
        if (typeof body === 'object') return "json";
    };

    return StubHttpResponse;
})();