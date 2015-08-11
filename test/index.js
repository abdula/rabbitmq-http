var should = require('should');
var HttpClient = require('../lib/index');
var Promise = require('bluebird');

describe('RabbitMQ HttpClient', function() {
    var rabbitOpts = { username: 'guest', password: 'guest', url: 'http://localhost:15672/api/'};
    var client = new HttpClient(rabbitOpts);

    it('should have all repositories', function() {
        var repositories = ['bindings', 'exchanges', 'permissions', 'queues', 'users', 'vhosts'];
        repositories.forEach(function(rep) {
            client.should.have.property(rep).with.type('object');
        });
    });

    describe('Queues', function() {
        var name = 'test-queue';

        it('should return new queue', function(done) {
            client.queues.create({
                vhost: '/',
                name: name,
                auto_delete:false,
                durable:true, arguments:[]
            }).then(function(result) {
                should.exist(result);
                result.should.have.property('name').equal(name);
                done();
            }).catch(done);
        });

        it('should remove new queue', function(done) {
            client.queues.remove({vhost: '/', name: name}).then(function() {
                done();
            }).catch(done);
        });
    });


    describe('Exchanges', function() {
        var name = 'test-exchange';

        it('should return new exchange', function(done) {
            client.exchanges.create({
                name: name,
                "type":"direct",
                "auto_delete":false,
                "durable":true,"arguments":[]
            }).then(function(result) {
                should.exist(result);
                result.should.have.property('name').equal(name);
                done();
            }).catch(done);
        });

        it('should remove new exchange', function(done) {
            client.exchanges.remove({name: name}).then(function() {
                done();
            }).catch(done);
        });
    });


    describe('Vhosts', function() {
        var name = 'test-vhost';

        it('should return new vhost', function(done) {
            client
                .vhosts
                .create({name: name})
                .then(function(result) {
                    should.exist(result);
                    result.should.have.property('name').equal(name);
                    done();
                }).catch(done);
        });

        it('should remove new vhost', function(done) {
            client.vhosts.remove({name: name}).then(function() {
                done();
            }).catch(done);
        });
    });

    describe('Users', function () {
        it('should have create method', function () {
            client.users.should.have.property('create').with.type('function');
        });

        it('should have find method', function () {
            client.users.should.have.property('find').with.type('function');
        });

        describe('Finding', function() {
            it('should return user information', function(done) {
                var username = 'guest';
                client.users.find('guest').then(function(result) {
                    result.should.have.property('name').equal(username);
                    done();
                }).catch(done);
            });

            it('should return false', function(done) {
                var username = 'this-user-does-not-exists';
                client.users.find(username).then(function(result) {
                    result.should.not.be.ok;
                    done();
                }).catch(done);
            });
        });


        describe('Creating', function() {
            it('should throw invalid credentials error', function(done) {
                client.users.create({name: 'test'})
                    .then(function() {
                        done(new Error("Something wrong"));
                    })
                    .catch(function(err) {
                        done();
                    });
            });

            it('should return new user data', function(done) {
                var username = 'test-user';
                client.users.create({name: username, password: 'test'}).then(function(result) {
                    should.exist(result);
                    result.should.have.property('name').equal(username);
                    done();
                }).catch(function(err) {
                    console.log(err.message);
                    console.log(err);
                    done(err);
                });
            });

            it('should remove new user', function(done) {
                client.users.remove('test-user').then(function() {
                    done();
                }).catch(done);
            });
        });
    });


    describe('Bindings', function() {
        var queueName = 'test-binding-queue';
        var exchangeName = 'test-binding-exchange';
        this.timeout(2500);

        before(function(done) {
            console.log('Before testing bindings');
            Promise.all([
                client.queues.create({
                    name: queueName,
                    auto_delete:false,
                    durable:true, arguments:[]
                }),
                client.exchanges.create({
                    name: exchangeName,
                    type:"topic",
                    auto_delete:false,
                    durable:true,
                    arguments:[]
                })
            ]).then(function() {
                done();
            }).catch(done);
        });

        it('should return list of bindings', function(done) {
            client.bindings.all({vhost: '/'}).then(function(result) {
                done();
            }).catch(done)
        });

        it('should create new binding', function(done) {
            client.bindings.create({
                vhost: '/',
                exchange: exchangeName,
                queue: queueName,
                routing_key: '',
                arguments: []
            }).then(function() {
                console.log('Binding has been created');
                done();
            }).catch(function(err) {
                console.log(err);
                done(err);
            });
        });

        after(function(done) {
            console.log('After testing bindings');
            Promise.all([
                client.queues.remove({name: queueName}),
                client.exchanges.remove({name: exchangeName})
            ]).then(function() {
                done();
            }).catch(done);
        });
    });


    describe('Permissions', function() {
        var username = 'test-perm-user';
        before(function(done) {
            Promise.all([
                client.users.create({name: username, password: 'test'})
            ]).nodeify(done);
        });

        it('should update user permissions', function(done) {
            client.permissions.update({
                user: username,
                "configure":".*",
                "write":".test",
                "read":".*"
            }).nodeify(done);
        });

        after(function(done) {
            Promise.all([
                client.users.remove(username)
            ]).nodeify(done);
        });
    });
});