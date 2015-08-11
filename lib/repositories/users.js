var Promise = require('bluebird');
var merge = require('../utils').merge;

module.exports = function(registry) {
    return registry.define('Users', {
        path: '/users/:name',
        methods: {
            validate: function(data) {
                if (!data.name || !data.password) {
                    return Promise.reject(new Error('Invalid arguments. name or password is not specified'));
                }
                var name = data.name;

                return this.find(name)
                    .then(function(result) {
                        if (result) {
                            throw new Error('User already exists');
                        } else {
                            return true;
                        }
                    });
            },
            create: function(data) {
                data.isNew = true;

                var name = data.name;

                if (!data.tags) {
                    data.tags = 'none';
                }
                var self = this;
                var url = this.url(data);
                return this.validate(data)
                    .then(function() {
                        var body = merge({}, data);
                        delete body.isNew;
                        delete body.name;

                        return self.transport.put({
                            url: url,
                            json: body
                        });
                    }).then(function() {
                        return self.find(name);
                    });
            },
            remove: function(data) {
                var name;
                if (typeof data === 'string') {
                    name = data;
                } else {
                    name = data.name;
                }
                return this.transport.del({url: this.url({name: name})});
            },
            find: function(name) {
                var data = name;
                if (typeof name === 'string') {
                    data = {name: name};
                }
                return this.transport.get(this.url(data)).catch(function(err) {
                    if (err.statusCode === 404) return false;
                    throw err;
                });
            }
        }
    });
};
