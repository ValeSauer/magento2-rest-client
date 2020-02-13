var util = require('util');
const qs = require('qs')

module.exports = function (restClient) {
    var module = {};

    module.get = function (id) {
        var endpointUrl = util.format('/orders/%s', id);
        return restClient.get(endpointUrl);
    }

    return module;
}
