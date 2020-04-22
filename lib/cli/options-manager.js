const _loggingFacility = require('logging-facility');
const _logger = _loggingFacility.getLogger('config');
const _nodemcutool = require('./nodemcu-tool');
const _serialport = require('../transport/serialport');
const _fs = require('fs-magic');
const _path = require('path');
const _configFilename = _path.join(process.cwd(), '.nodemcutool');

async function parseOptions(options){
    // default
    options = options || {};

    // debug mode enabled by flag ?
    if (options.parent.debug===true){
        // enable silent mode (decrease logging level)
        _logger.notice('debug mode enabled');
        _loggingFacility.setBackend(_loggingFacility.LOGGER.FANCY(_loggingFacility.LEVEL.DEBUG));

        // io debug mode ?
        if (options.parent.ioDebug===true){
            _logger.notice('io-debug mode enabled - rx/tx messages are passed to logger');
            _serialport.debug(true);
        }

    // silent mode enabled by flag ?
    // silent mode enabled by json output format ?
    // silent mode enabled by json raw format ?
    } else if (options.parent.silent===true || options.json === true || options.raw === true){
        // enable silent mode (decrease logging level)
        _loggingFacility.setBackend(_loggingFacility.LOGGER.FANCY(_loggingFacility.LEVEL.WARNING));
    }else{
        _loggingFacility.setBackend(_loggingFacility.LOGGER.FANCY(_loggingFacility.LEVEL.INFO));
    }

    // project based configuration
    let configFile = {};
    if (await _fs.isFile(_configFilename)){

        // try to load project based configuration
        const data = await _fs.readFile(_configFilename, 'utf8');

        if (data.length > 10){
            // decode json based data
            configFile = JSON.parse(data);
            _logger.log('Project based configuration loaded');
        }
    }

    // generated config
    const config = {};

    // utility function to merge different options
    // cli args take presendence over config
    function mergeOptions(...opt){
        // extract default (last argument)
        const result = opt.pop();

        // try to find first match
        while (opt.length > 0){
            // extract first argument (priority)
            const o = opt.shift();

            // value set ?
            if (typeof o !== 'undefined' && o !== null){
                return o;
            }
        }

        return result;
    }

    // merge global flags, command flags and global defaults
    // config file + cli args
    config.baudrate =        mergeOptions(options.parent.baud, configFile.baudrate, '115200');
    config.port =           mergeOptions(options.parent.port, configFile.port, '/dev/ttyUSB0');
    config.connectionDelay = mergeOptions(options.parent.connectionDelay, configFile.connectionDelay, 0);
    config.minify =         mergeOptions(options.minify, configFile.minify, false);
    config.compile =        mergeOptions(options.compile, configFile.compile, false);
    config.keeppath =       mergeOptions(options.keeppath, configFile.keeppath, false);

    // CLI args only
    config.remotename =     mergeOptions(options.remotename, null);
    config.run =            mergeOptions(options.run, false);
    config.all =            mergeOptions(options.all, false);
    config.json =           mergeOptions(options.json, false);
    config.raw =            mergeOptions(options.raw, false);
    config.softreset =      mergeOptions(options.softreset, false);
    config.noninteractive = mergeOptions(options.noninteractive, false);

    // set port/baud options
    _nodemcutool.setOptions({
        device:             config.port,
        baudrate:           config.baudrate,
        connectionDelay:    config.connectionDelay
    });

    // dump config in debug mode
    if (options.parent.debug===true){
        for (const key in config){
            _logger.log(`${key.padEnd(20,' ')} = ${config[key]} (type:${typeof config[key]})`);
        }
    }

    return config;
}

// write options to file
async function storeOptions(options){
    await _fs.writeFile(_configFilename, JSON.stringify(options, null, 4));
}

module.exports = {
    parse: parseOptions,
    store: storeOptions
};
