var util = require('util');
const qs = require('qs')

module.exports = function (restClient) {
    var module = {};

    module.get = function (id) {
        var endpointUrl = util.format('/customers/%s', id);
        return restClient.get(endpointUrl);
    }

    module.search = function (searchCriteria) {
        var query = qs.stringify(searchCriteria, { encode: false });
        var endpointUrl = util.format('/customers/search?%s', query);
        return restClient.get(endpointUrl);
    }
    
    module.create = function (customer) {
        return restClient.post('/customers', customer);
    }

    module.update = function (customerId, customer) {
        var endpointUrl = util.format('/customers/%d', customerId);
        return restClient.put(endpointUrl, customer);
    }

    module.delete = function (customerId) {
        var endpointUrl = util.format('/customers/%d', customerId);
        return restClient.delete(endpointUrl);
    }

    return module;
}
