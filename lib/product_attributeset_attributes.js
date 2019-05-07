var util = require('util');
var qs = require('qs');


module.exports = function (restClient) {
    var module = {};

    module.update = function (attributeInfo) {
        var endpointUrl = util.format('/products/attribute-sets/attributes/');
        return restClient.post(endpointUrl, attributeInfo);
    }

    return module;
}
