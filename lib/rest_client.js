'use strict';

var OAuth = require('oauth-1.0a');
var request = require('request');
var humps = require('humps');
var sprintf = require('util').format;
var slugify = require('slugify')

var logger = require('./log');

module.exports.RestClient = function (options) {
    var instance = {};

    const MAXURLRETRIES = 10
    const TIMEOUT = 60000

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

    var sleep = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    var apiCall = async function (request_data, retry = 0) {
        //console.log(request_data)
        try {
            var result = await apiCall2(request_data, retry)
            return result
        } catch (e) {
            if (e && typeof (e) == 'string' && (
                e.indexOf("URL key for specified store already exists.") >= 0 || 
                e.indexOf("URL klíč ve zvoleném obchodě již existuje.") >= 0 || 
                e.indexOf("La clé d’URL pour la boutique existe déjà.") >= 0 || 
                e.indexOf("URL-Schlüssel für angegebenen Store ist bereits vorhanden") >= 0 || 
                e.indexOf("Esiste già una URL key per il negozio specificato.") >= 0 || 
                e.indexOf("URL sleutel voor opgegeven winkel bestaat al.") >= 0 || 
                e.indexOf("Klucz URL dla wybranego sklepu już istnieje.") >= 0 || 
                e.indexOf("Belirtilen mağaza için URL anahtarı zaten var.") >= 0 ||
                e.indexOf("La clave de URL para la tienda especificada ya existe.") >= 0
            ) && retry <= MAXURLRETRIES) {
                retry++
                if (request_data.body.product) {
                    var url = slugify(request_data.body.product.name)
                    if (retry == 1) {
                        url = slugify(request_data.body.product.name + "-" + request_data.body.product.sku)
                    } else if (retry > 1) {
                        url = slugify(request_data.body.product.name + "-" + request_data.body.product.sku + "-" + retry)
                    }
                    request_data.body.product.custom_attributes.push({
                        "attribute_code": "url_key",
                        "value": url
                    })
                }
                if (request_data.body.category) {
                    console.log("Category URL already in use. Retrying with slightly changed URL: " + slugify(request_data.body.category.name + "-" + retry))
                    request_data.body.category.custom_attributes.push({
                        "attribute_code": "url_key",
                        "value": slugify(request_data.body.category.name + "-" + retry)
                    })
                }
                var result = await apiCall(request_data, retry)
                return result
            }
            else if (e && typeof (e) == 'string' && (
                e.indexOf("Database deadlock found when trying to get lock") >= 0
             ) && retry <= MAXURLRETRIES) {
                retry++
                console.log("Database deadlock found. Retrying API call.")
                await sleep(5000);
                var result = await apiCall(request_data, retry)
                return result
            }
            else if (e && typeof (e) == 'string' && (
                e.indexOf("The product can't be saved") >= 0 ||
                e.indexOf("Il prodotto non può essere salvato") >= 0 ||
                e.indexOf("Het product kan niet worden opgeslagen") >= 0 ||
                e.indexOf("Das Produkt kann nicht gespeichert werden") >= 0
             ) && retry <= MAXURLRETRIES) {
                retry++
                console.log("Product can't be saved error found. Retrying API call.")
                await sleep(10000);
                var result = await apiCall(request_data, retry)
                return result
            }
            else if (e && typeof (e) == 'string' && e.indexOf("ESOCKETTIMEDOUT") >= 0 && retry <= MAXURLRETRIES) {
                retry++
                console.log("ESOCKETTIMEDOUT. Retrying API call.")
                var result = await apiCall(request_data, retry)
                return result
            } else {
                console.log(e)
                throw new Error(JSON.stringify(e) + " | " + request_data.url)
            }
        }
    }

    function apiCall2(request_data, retry = 0) {
        logger.debug('Calling API endpoint: ' + request_data.method + ' ' + request_data.url);
        return new Promise(function (resolve, reject) {
            request({
                url: request_data.url,
                method: request_data.method,
                /*auth: {
                    user: 'zarges',
                    pass: 'yRou,8,R4#y(F)^dMXV$xLc9A1',
                    sendImmediately: false
                  },*/
                headers: oauth.toHeader(oauth.authorize(request_data, token)),
                json: true,
                body: request_data.body,
                timeout: TIMEOUT
            }, function (error, response, body) {
                logger.debug('Response received.');
                if (error) {
                    logger.error('Error occured: ' + error);
                    reject(error);
                    return;
                } else if (!httpCallSucceeded(response)) {
                    if(body){
                        var errorMessage = errorString(body.message, body.parameters);
                    }else{
                        var errorMessage = "Empty body error message"
                    }
                    if (!errorMessage)
                        errorMessage = body
                    if (retry >= MAXURLRETRIES)
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
