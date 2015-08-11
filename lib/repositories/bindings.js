var merge = require('../utils').merge;
var omit = require('../utils').omit;
var Promise = require('bluebird');
var defaultVhost = require('../conf').DEFAULT_HOST;

module.exports = function(register) {
    return register.define('Bindings', {
        path: '/bindings/:vhost/:queue/:exchange',
        methods: {
            find: function(data) {
                data = merge({vhost: defaultVhost}, data);

                return this.transport.get(this.url(data)).catch(function(err) {
                    if (err.statusCode === 404) return false;
                    throw err;
                });
            },
            all: function(data) {
                return this.transport.get(this.url(data || {}));
            },
            create: function(data) {
                data = merge({vhost: defaultVhost}, data);

                if (!data.arguments) {
                    data.arguments = [];
                }

                return Promise.try(function() {
                    if (!data.queue) {
                        throw new Error('queue is not specified');
                    }

                    if (!data.exchange) {
                        throw new Error('exchange is not specified');
                    }

                    if (!data.hasOwnProperty('routing_key')) {
                        data.routing_key = '';
                    }
                }).then(function() {
                    var body = omit(data, ['vhost', 'queue', 'exchange']);
                    var url = this.url(data, {path: '/bindings/:vhost/e/:exchange/q/:queue/'});

                    return this.transport.post({
                        url: url,
                        json: body
                    });
                }.bind(this)).then(function() {
                    return this.find(data);
                }.bind(this));
            }
        }
  });
};