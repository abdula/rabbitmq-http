module.exports = function(api) {
    require('./bindings')(api);
    require('./exchanges')(api);
    require('./permissions')(api);
    require('./queues')(api);
    require('./users')(api);
    require('./vhosts')(api);
};
