'use strict';

var OAuth = require('oauth-1.0a');
var request = require('request');
var humps = require('humps');
var sprintf = require('util').format;
var slugify = require('slugify')

var logger = require('./log');

module.exports.RestClient = function (options) {
    var instance = {};

    var servelrUrl = options.url;
    var storeId = options.storeId ? options.storeId : 'all';
    var apiVersion = options.version;
    var oauth = OAuth({
        consumer: {
            public: options.consumerKey,
            secret: options.consumerSecret
        },
        signature_method: 'HMAC-SHA1'
    });
    var token = {
        public: options.accessToken,
        secret: options.accessTokenSecret
    };

    var apiCall = async function(request_data, retry = 0){
        try{
            var result = await apiCall2(request_data)
            return result
        }catch(e){
            if(e == "URL key for specified store already exists." && retry <= 5){
                retry++
                if(request_data.body.product){
                    request_data.body.product.custom_attributes.push({
                        "attribute_code": "url_key",
                        "value": slugify(request_data.body.product.name + "-" + retry)
                    })
                }
                if(request_data.body.category){
                    request_data.body.category.custom_attributes.push({
                        "attribute_code": "url_key",
                        "value": slugify(request_data.body.category.name + "-" + retry)
                    })
                }
                var result = await apiCall(request_data, retry)
                return result
            }else{
                throw new Error(e)
            }
        }
    }

    function apiCall2(request_data) {
        logger.debug('Calling API endpoint: ' + request_data.method + ' ' + request_data.url);
        return new Promise(function (resolve, reject) {
            request({
                url: request_data.url,
                method: request_data.method,
                headers: oauth.toHeader(oauth.authorize(request_data, token)),
                json: true,
                body: request_data.body
            }, function (error, response, body) {
                logger.debug('Response received.');
                if (error) {
                    logger.error('Error occured: ' + error);
                    reject(error);
                    return;
                } else if (!httpCallSucceeded(response)) {
                    var errorMessage = errorString(body.message, body.parameters);
                    logger.error('API call failed: ' + errorMessage);
                    reject(errorMessage);
                }
                var bodyCamelized = humps.camelizeKeys(body);
                resolve(bodyCamelized);
            });
        });
    }

    function httpCallSucceeded(response) {
        return response.statusCode >= 200 && response.statusCode < 300;
    }

    function errorString(message, parameters) {
        if (parameters === null) {
            return message;
        }
        if (parameters instanceof Array) {
            for (var i = 0; i < parameters.length; i++) {
                var parameterPlaceholder = '%' + (i + 1).toString();
                message = message.replace(parameterPlaceholder, parameters[i]);
            }
        } else if (parameters instanceof Object) {
            for (var key in parameters) {
                var parameterPlaceholder = '%' + key;
                message = message.replace(parameterPlaceholder, parameters[key]);
            }
        }

        return message;
    }

    instance.get = function (resourceUrl) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'GET'
        };
        return apiCall(request_data);
    }

    function createUrl(resourceUrl) {
        var url = servelrUrl
        if (storeId)
            url += '/' + storeId
        url += '/' + apiVersion + resourceUrl
        return url
    }

    instance.post = function (resourceUrl, data) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'POST',
            body: data
        };
        return apiCall(request_data);
    }

    instance.put = function (resourceUrl, data) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'PUT',
            body: data
        };
        return apiCall(request_data);
    }

    instance.delete = function (resourceUrl) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'DELETE'
        };
        return apiCall(request_data);
    }

    return instance;
}
