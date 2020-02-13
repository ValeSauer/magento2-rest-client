var util = require('util');
const qs = require('qs')

module.exports = function (restClient) {
    var module = {};

    module.search = function (searchCriteria) {
        var query = qs.stringify(searchCriteria, { encode: false });
        var endpointUrl = util.format('/company/?%s', query);
        return restClient.get(endpointUrl);
    }

    module.get = function (id) {
        var endpointUrl = util.format('/company/%s', id);
        return restClient.get(endpointUrl);
    }
    
    module.create = function (company) {
        return restClient.post('/company', company);
    }

    module.update = function (companyId, company) {
        var endpointUrl = util.format('/company/%d', companyId);
        return restClient.put(endpointUrl, company);
    }

    module.delete = function (companyId) {
        var endpointUrl = util.format('/company/%d', companyId);
        return restClient.delete(endpointUrl);
    }

    return module;
}
