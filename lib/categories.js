var util = require('util');
const qs = require('qs')

module.exports = function (restClient) {
    var module = {};

    module.list = function (searchCriteria) {
        var query = qs.stringify(searchCriteria, { encode: false });
        var endpointUrl = util.format('/categories/list?%s', query);
        return restClient.get(endpointUrl);
    }
    
    module.create = function (categoryAttributes) {
        return restClient.post('/categories', categoryAttributes);
    }

    module.update = function (categoryId, categoryAttributes) {
        var endpointUrl = util.format('/categories/%d', categoryId);
        return restClient.put(endpointUrl, categoryAttributes);
    }

    module.delete = function (categoryId) {
        var endpointUrl = util.format('/categories/%d', categoryId);
        return restClient.delete(endpointUrl);
    }

    return module;
}
