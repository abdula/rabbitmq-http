var Promise = require('bluebird');
var merge = require('../utils').merge;

module.exports = function(registry) {
    return registry.define('Vhosts', {
        path: '/vhosts/:name',
        methods: {
            validate: function(data) {
                if (!data.name) {
                    return Promise.reject(new Error('Invalid arguments: vhost name is not specified'));
                }

                if (!data.isNew) {
                    return Promise.resolve(data);
                }

                return this.find(data)
                    .then(function(result) {
                        if (result) {
                            throw new Error('Vhost already exists');
                        }
                        return data;
                    });
            },
            create: function(data) {
                data.isNew = true;

                var self = this;

                return this.validate(data)
                    .then(function(data) {
                        var body = merge({}, data);
                        delete body.isNew;
                        delete body.name;

                        return self.transport.put({
                            url: self.url(data),
                            json: body
                        });
                    }).then(function() {
                        return self.find(data);
                    });
            },
            remove: function(data) {
                if (typeof data === 'string') {
                    data = {name: data};
                }
                return this.transport.del({url: this.url(data)});
            },
            find: function(data) {
                if (typeof data === 'string') {
                    data = {name: data};
                }
                return this.transport.get(this.url(data)).catch(function(err) {
                    if (err.statusCode === 404) return false;
                    throw err;
                });
            }
        }
    });
};
