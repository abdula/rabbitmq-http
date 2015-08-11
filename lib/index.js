var utils = require('./utils');
var merge = utils.merge;
var lcfirst = utils.lcfirs;
var Promise = require('bluebird');
var rp = require('request-promise');
var querystring = require('querystring');

function normalizeName(name) {
    return name.toLowerCase();
}


/**
 * @see http://hg.rabbitmq.com/rabbitmq-management/raw-file/3646dee55e02/priv/www-api/help.html
 *
 * @param options
 * @constructor
 */
function RabbitApi(options) {
    if (!options.username || !options.password) {
        throw new Error('Invalid credentials. Username or password is not specified');
    }

    this.repositories = {};

    if (!options.url) {
        throw new Error('Entry point url is not specified');
    }

    var transport = options.transport || 'request';
    if (typeof transport === 'string') {
        this.transport = new RabbitApi.transports[transport](options);
    } else {
        this.transport = new transport(options);
    }

    //this.transport.get = function(data) {
    //    console.log(arguments);
    //    return Promise.resolve(true);
    //};
}

(function defineInstanceProps(proto) {
    proto.createRepository = function(name, options) {
        var Repository = this.constructor.repository(name);
        options = merge(options || {}, {
            api: this
        });

        return new Repository(options);
    };

    proto.hasRepository = function(name) {
        return this.constructor.hasRepository(name);
    };

    proto.getRepository = function(name, options) {
        if (!this.hasRepository(name)) {
            throw new Error('Repository with name "' + name + '" is not defined');
        }
        var lcName = normalizeName(name);

        if (options) {
            return this.createRepository(name, options);
        }
        if (!this.repositories[lcName]) {
            this.repositories[lcName] = this.createRepository(lcName);
        }
        return this.repositories[lcName];
    };
}(RabbitApi.prototype));

(function defineStaticProps(Cls) {
    Cls.repositories = {};

    Cls.hasRepository = function(name) {
        return Cls.repositories.hasOwnProperty(normalizeName(name));
    };

    Cls.repository = function(name, schema) {
        var lcName = normalizeName(name);
        if (arguments.length === 1) {
            if (!this.hasRepository(name)) {
                throw new Error('Repository with name "' + name + '" is not defined');
            }
            return Cls.repositories[lcName];
        }
        return Cls.define(name, schema);
    };

    Cls.define = function(name, schema) {
        var Collection = function(options) {
            this.api     = options.api;
            this.transport = this.api.transport;
        };

        Collection.prototype.url = function(data, options) {
            var url = this.path;
            if (options && options.path) {
                url = options.path;
            }
            Object.keys(data).forEach(function(key) {
                url = url.replace(':' + key, querystring.escape(data[key]));
            });

            return url.replace(/:[\w]+/g, '').replace(/\/{2,}/g, '/');
        };

        Collection.prototype.schema = schema;
        Collection.prototype.path = schema.path;

        var methods = schema.methods || {};

        Object.keys(methods).forEach(function(method) {
            var opts = methods[method];
            if (typeof opts === 'function') {
                this[method] = opts;
            } else {
                throw new Error('Method must have type function');
                //this[method] = function() {
                //    return this.request(data.method || 'GET');
                //};
            }
        }, Collection.prototype);

        this.repositories[normalizeName(name)] = Collection;

        Cls.prototype.__defineGetter__(lcfirst(name), function(options) {
            return this.getRepository(name, options);
        });

        return Collection;
    };


    Cls.transports = {};

    Cls.addTransport = function(transport, fn) {
        this.transports[transport] = fn;
    };

}(RabbitApi));

RabbitApi.addTransport('request', function(options) {
    return rp.defaults({
        'json': true,
        'baseUrl': options.url,
        'auth': {
            'username': options.username,
            'password': options.password
        }
    });
});


module.exports = RabbitApi;

require('./repositories')(RabbitApi);

