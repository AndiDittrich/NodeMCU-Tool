const _loggingFacility = require('logging-facility');
const _logger = _loggingFacility.getLogger('NodeMCU-Tool');
const _nodemcutool = require('../nodemcu-tool');
const _fs = require('fs-magic');
const _path = require('path');
const _configFilename = _path.join(process.cwd(), '.nodemcutool');

async function parseOptions(options){
    // default
    options = options || {};

    // silent mode enabled by flag ?
    // silent mode enabled by json output format ?
    // silent mode enabled by json raw format ?
    if (options.parent.silent===true || options.json === true || options.raw === true){
        // enable silent mode (decrease logging level)
        _loggingFacility.setBackend(_loggingFacility.LOGGER.FANCY(_loggingFacility.LEVEL.WARNING));
    }

    // merge global flags, command flags and global defaults
    const defaultConfig = {
        // global flags
        baudrate:           options.parent.baud           || '115200',
        port:               options.parent.port           || '/dev/ttyUSB0',
        connectionDelay:    options.parent.connectionDelay || 0,

        // command specific flags
        minify:     options.minify      || false,
        compile:    options.compile     || false,
        keeppath:   options.keeppath    || false,
        remotename: options.remotename  || null,
        run:        options.run         || false,
        all:        options.all         || false,
        json:       options.json        || false,
        raw:        options.raw         || false,
        softreset:  options.softreset   || false
    };

    // project based configuration
    if (await _fs.isFile(_configFilename)){

        // try to load project based configuration
        const data = await _fs.readFile(_configFilename, 'utf8');

        if (data.length > 10){
            // decode json based data
            const d = JSON.parse(data);

            // extract values
            defaultConfig.baudrate = d.baudrate || defaultConfig.baudrate;
            defaultConfig.port = d.port || defaultConfig.port;
            defaultConfig.minify = (d.minify && d.minify === true);
            defaultConfig.optimize = (d.optimize && d.optimize === true);
            defaultConfig.compile = (d.compile && d.compile === true);
            defaultConfig.keeppath = (d.keeppath && d.keeppath === true);
            _logger.log('Project based configuration loaded');
        }
    }

    // set port/baud options
    _nodemcutool.setOptions({
        device: defaultConfig.port,
        baudrate: defaultConfig.baudrate,
        connectionDelay: defaultConfig.connectionDelay
    });

    return defaultConfig;
}

// write options to file
async function storeOptions(options){
    await _fs.writeFile(_configFilename, JSON.stringify(options, null, 4));
}

module.exports = {
    parse: parseOptions,
    store: storeOptions
};