var util = require('util');
const qs = require('qs')

module.exports = function (restClient) {
    var module = {};

    module.search = function (searchCriteria) {
        var query = qs.stringify(searchCriteria, { encode: false });
        var endpointUrl = util.format('/orders?%s', query);
        return restClient.get(endpointUrl);
    }
    module.get = function (id) {
        var endpointUrl = util.format('/orders/%s', id);
        return restClient.get(endpointUrl);
    }

    module.update = function (payload) {
        var endpointUrl = util.format('/orders');
        return restClient.post(endpointUrl, payload);
    }

    return module;
}
