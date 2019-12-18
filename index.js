'use strict';

var RestClient = require('./lib/rest_client').RestClient;
var categories = require('./lib/categories');
var products = require('./lib/products');
var productMedia = require('./lib/product_media');
var productAttributes = require('./lib/product_attributes');
var productAttributeOptions = require('./lib/product_attribute_options');
var productAttributeSetAttributes = require('./lib/product_attributeset_attributes');
var customers = require('./lib/customers');
var companies = require('./lib/companies');

const MAGENTO_API_VERSION = 'V1';

module.exports.Magento2Client = function (options) {
    var instance = {};

    options.version = MAGENTO_API_VERSION;
    
    var client = RestClient(options);

    instance.categories = categories(client);
    instance.products = products(client);
    instance.productAttributes = productAttributes(client);
    instance.productAttributeOptions = productAttributeOptions(client);
    instance.productAttributeSetAttributes = productAttributeSetAttributes(client);
    instance.productMedia = productMedia(client);
    instance.customers = customers(client);
    instance.companies = companies(client);

    return instance;
}
