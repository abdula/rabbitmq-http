var defaultVhost = require('../conf').DEFAULT_HOST;
var merge = require('../utils').merge;
var Promise = require('bluebird');

module.exports = function(registry) {
    registry.define('Permissions', {
        path: '/permissions/:vhost/:user',
        methods: {
            /**
             * {"scope":"client",}
             *
             * @param data
             * @returns {boolean}
             */
            update: function(data) {
                data = merge({vhost: defaultVhost, configure:".*", write:".*", read: ".*"}, data);

                return Promise.try(function() {
                    if (!data.user) {
                        throw new Error('User is not specified');
                    }

                }).then(function() {
                    var url = this.url(data);
                    var body = merge({}, data);

                    delete body.user;
                    delete body.vhost;

                    return this.transport.put({
                        url: url,
                        json: body
                    });
                }.bind(this));
            }
        }
    });
};