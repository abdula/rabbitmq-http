exports.merge = function() {
    var args = Array.prototype.slice.call(arguments);
    var obj = args.shift();

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        for (var key in arg) {
            if (arg.hasOwnProperty(key)) {
                obj[key] = arg[key];
            }
        }
    }
    return obj;
};

exports.lcfirs = function(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
};

exports.ucfirs = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.omit = function(obj, keys) {
    var result = {};
    for (var key in obj) {
        if (keys.indexOf(key) === -1) {
            result[key] = obj[key];
        }
    }
    return result;
};