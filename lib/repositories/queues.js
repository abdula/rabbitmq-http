var Promise = require('bluebird');
var merge = require('../utils').merge;
var defaultVhost = require('../conf').DEFAULT_HOST;

module.exports = function(registry) {

    registry.define('Queues', {
        path: '/queues/:vhost/:name',
        methods: {
            remove: function(data) {
                if (typeof data === 'string') {
                    data = {name: data};
                }
                data = merge({vhost: defaultVhost}, data);
                return this.transport.del({url: this.url(data)});
            },
            find: function(data) {
                if (typeof data === 'string') {
                    data = {name: data};
                }
                data = merge({vhost: defaultVhost}, data);

                return this.transport.get(this.url(data)).catch(function(err) {
                    if (err.statusCode === 404) return false;
                    throw err;
                });
            },
            create: function(data) {
                data = merge({vhost: defaultVhost}, data);


                if (!data.name) {
                    return Promise.reject(new Error('Queue\'s name is not specified'));
                }

                var body = merge({}, data);

                delete body.name;
                delete body.vhost;

                var self = this;
                return this.find(data)
                    .then(function(result) {
                        if (result) {
                            throw new Error('Queue already exists');
                        }
                        return self.transport.put({
                            url: self.url(data),
                            json: data
                        });
                    }).then(function() {
                        return self.find(data);
                    });
            }
        }
    });
};