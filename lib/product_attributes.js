var util = require('util');
var qs = require('qs');


module.exports = function (restClient) {
    var module = {};

    module.list = function (searchCriteria) {
        var query = qs.stringify(searchCriteria, { encode: false });
        var endpointUrl = util.format('/products/attributes?%s', query);
        return restClient.get(endpointUrl);
    }

    module.get = function (attributeCode) {
        var endpointUrl = util.format('/products/attributes/%s', attributeCode)
        return restClient.get(endpointUrl);
    }

    module.create = function (attributeAttributes) {
        return restClient.post('/products/attributes', attributeAttributes);
    }

    module.update = function (attributeCode, attributeAttributes) {
        var endpointUrl = util.format('/products/attributes/%s', attributeCode);
        return restClient.put(endpointUrl, attributeAttributes);
    }

    module.delete = function (attributeCode) {
        var endpointUrl = util.format('/products/attributes/%s', attributeCode);
        return restClient.delete(endpointUrl);
    }

    return module;
}
