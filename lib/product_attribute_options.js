var util = require('util');
var qs = require('qs');


module.exports = function (restClient) {
    var module = {};

    module.list = function (attributeCode) {
        var endpointUrl = util.format('/products/attributes/%s/options', attributeCode);
        return restClient.get(endpointUrl);
    }

    module.delete = function (attributeCode, attributeValue) {
        var endpointUrl = util.format('/products/attributes/%s/options/%s', attributeCode, attributeValue);
        return restClient.delete(endpointUrl);
    }

    return module;
}
