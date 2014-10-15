var _ = require('lodash-node');
var default_object = require('../cache-object-types/default_object.js');
var config_file = require('../cache-object-types/config_file.js');

module.exports = function init(options, callback) {
	return new cache_object_store(options, callback);
};

var cache_object_store = function cache_object_store(options, callback) {
		this.options = options || {};

		this.logger = {
				debug : (options.logger && options.logger.debug) || console.log,
				info : (options.logger && options.logger.info) || console.log,
				warn : (options.logger && options.logger.war) || console.log,
				error : (options.logger && options.logger.error) || console.log
		};

    this._cacheObject = {};
    this._objectDirectory = {};
		callback(null, "Cache Object Store setup complete");
};

cache_object_store.prototype.flush = function flush() {
    this.logger.debug('Cache flushed');
    this._cacheObject = {};
};

cache_object_store.prototype.set = function set(object, relativeObject, path) {
    var self = this;
  	var path = path || "$cache:";
    var relativeObject = relativeObject || self._cacheObject;

    for (var key in object) {
        if (_.isString(object[key]) || _.isFunction(object[key])) {
            var debugLine = object[key];
            if (_.isFunction(object[key])) {
                debugLine = '[Function]';
            }
            if (debugLine.toString().indexOf('\n') > -1) {
                debugLine = "[File]";
            }
            if (self._cacheObject && relativeObject[key]) {
                self.logger.debug('Overwriting ' + path + key + ' with value: ' + debugLine);
            } else {
                self.logger.debug('Writing ' + path + key + ' with value: ' + debugLine);
            }
            this._objectDirectory[path + key] = default_object();
            relativeObject[key] = object[key];
        } else {
            if (_.isArray(object[key])) {
                if (!relativeObject[key]) {
                    relativeObject[key] = [];
                }
                _.assign(relativeObject[key], object[key]);
            } else {
                path += key + '.';
                if (!relativeObject[key]) {
                    relativeObject[key] = {};
                }
                self.set(object[key], relativeObject[key], path);
                path = path.slice(0, path.length - key.length - 1);
            }
        }
    }
};

cache_object_store.prototype.unset = function unset(keyString) {
    var self = this;
    var keyArray = keyString.split('.');
    var deleteString = "delete self._cacheObject";
    keyArray.forEach(function(key) {
        deleteString += "['" + key + "']";
    });
    deleteString += ";";
    try {
        eval(deleteString);
    } catch (err) {
        self._log.error('Unable to unset cache object at ' + keyString);
    }
};

cache_object_store.prototype.getAll = function getAll() {
    this.logger.debug('All Cache objects returned');
    return this._cacheObject;
};

cache_object_store.prototype.getStats = function getStats() {
    this.logger.debug('All Cache stats returned');
    return this._objectDirectory;
};

cache_object_store.prototype.get = function get(key) {
    var segments = key.split('.');
    var cacheObject = undefined;
    var self = this;
		self._objectDirectory["$cache:" + key].reads++;
    segments.forEach(function(key) {
        if (!cacheObject) {
            cacheObject = self._cacheObject[key];
        } else {
            cacheObject = cacheObject[key];
        }
    });
    if (!cacheObject) {
        this.logger.debug('Cache object not found with key [' + key + ']');
        return null;
    } else {
        this.logger.debug('Cache key [' + key + '] returned');
        return cacheObject;
    }
};
