const _fs = require('fs-magic');
const _nodeMcuConnector = require('../nodemcu-connector');
const _serialTerminal = require('../transport/serial-terminal');
const _path = require('path');
const _loggingFacility = require('logging-facility');

// NodeMCU-Tool Context Logger
const _logger = _loggingFacility.getLogger('NodeMCU-Tool');

// NodeMCU Context Logger
const _mculogger = _loggingFacility.getLogger('device');

// Serial Terminal Context Logger
const _terminallogger = _loggingFacility.getLogger('terminal');

// output
let outputHandler = function(){};

function writeOutput(message){
    if (outputHandler){
        outputHandler(message);
    }
}

// global options
const _options = {
    // serial port baudrate
    baudrate: 115200,

    // serial device connected to nodemcu
    device: '/dev/ttyUSB0',

    // delay after opening the connection
    connectionDelay: 0
};

// helper function to create a NodeMCU Tool Connection
async function getConnection(){
    // already connected ?
    if (_nodeMcuConnector.isConnected()){
        return;
    }

    // create new connector
    try{
        const msg = await _nodeMcuConnector.connect(_options.device, _options.baudrate, true, _options.connectionDelay);

        // status message
        _logger.log('Connected');
        _mculogger.log(msg);

    }catch(e){
        _logger.error('Unable to establish connection');
        throw e;
    }
}

function disconnect(){
    return _nodeMcuConnector.disconnect();
}

// show file-system info
async function fsinfo(format){

    // try to establish a connection to the module
    await getConnection();

    const {metadata, files} = await _nodeMcuConnector.fsinfo();

    // json output - third party applications
    if (format == 'json') {
        writeOutput(JSON.stringify({
            files: files,
            meta: metadata
        }));

    // raw format - suitable for use in bash scripts
    }else if (format == 'raw'){
        // print fileinfo
        files.forEach(function(file){
            writeOutput(file.name);
        });

    }else{
        _mculogger.log('Free Disk Space: ' + metadata.remaining + ' KB | Total: ' + metadata.total + ' KB | ' + files.length + ' Files');

        // files found ?
        if (files.length==0){
            _mculogger.log('No Files found - have you created the file-system?');
        }else{
            _mculogger.log('Files stored into Flash (SPIFFS)');

            // print fileinfo
            files.forEach(function(file){
                _mculogger.log(' - ' + file.name + ' (' + file.size + ' Bytes)');
            });
        }
    }
}

// run a file on NodeMCU (.lc or .lua)
async function run(filename){
    // try to establish a connection to the module
    await getConnection();

    // trigger reset
    const output = await _nodeMcuConnector.run(filename);

    // show command response
    _mculogger.log('Running "' + filename + '"');
    _mculogger.log('>----------------------------->');
    writeOutput(output + '\n');
    _mculogger.log('>----------------------------->');
}

// upload a local file to nodemcu
async function upload(localFiles, options, onProgess){

    // the index of the current uploaded file
    let fileUploadIndex = 0;

    async function uploadFile(localFile, remoteFilenameRelative){

        // increment upload index
        fileUploadIndex++;

        // get file stats
        try{
            const stats = await _fs.statx(localFile);

            // check if file is directory
            if (stats.isDirectory()) {
                _mculogger.error('Path "' + localFile + '" is a directory.');
                return;
            }

        // local file available
        }catch (err){
            _logger.error('Local file not found "' + localFile + '" skipping...');
            _logger.debug(err);
            return;
        }

        // display filename
        _logger.log('Uploading "' + localFile + '" >> "' + remoteFilenameRelative + '"...');

        // normalize the remote filename (strip relative parts)
        const remoteFilename = remoteFilenameRelative.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/^\.\//, '');

        // delete old file (may existent)
        await _nodeMcuConnector.remove(remoteFilename);

        // start file transfer
        await _nodeMcuConnector.upload(localFile, remoteFilename, options, function(current, total){
            // proxy and append file-number
            onProgess(current, total, fileUploadIndex);
        });

        // compile flag set ? and is a lua file ?
        if (options.compile && _path.extname(localFile).toLowerCase() == '.lua'){
            _mculogger.log(' |- compiling lua file..');

            await _nodeMcuConnector.compile(remoteFilename);
            _mculogger.log(' |- success');

            // drop original lua file
            await _nodeMcuConnector.remove(remoteFilename);
            _mculogger.log(' |- original Lua file removed');
        }
    }

    // try to establish a connection to the module
    await getConnection();

    // single file upload ?
    if (localFiles.length == 1){
        // extract first element
        const localFile = localFiles[0];

        // filename defaults to original filename minus path.
        // this behaviour can be overridden by --keeppath and --remotename options
        const remoteFile = options.remotename ? options.remotename : (options.keeppath ? localFile : _path.basename(localFile));

        // start single file upload
        await uploadFile(localFile, remoteFile);

        // log message
        _logger.log('File Transfer complete!');

        // run file ?
        if (options.run === true){
            await run(remoteFile);
        }

    // bulk upload ?
    }else{

        // file available ?
        while (localFiles.length > 0){
             // extract file
             const localFile = localFiles.shift();

             // keep-path option set ?
             const remoteFile = (options.keeppath ? localFile : _path.basename(localFile));

             // trigger upload
             // eslint-disable-next-line no-await-in-loop
             await uploadFile(localFile, remoteFile);
        }

        // log message
        _logger.log('Bulk File Transfer complete!');
    }
}

// download a remote file from nodemcu
async function download(remoteFile){
    // strip path
    let localFilename = _path.basename(remoteFile);

    // local file with same name already available ?
    if (await _fs.exists(remoteFile)){
        // change filename
        localFilename += '.' + (new Date().getTime());

        _logger.log('Local file "' + remoteFile + '" already exist - new file renamed to "' + localFilename + '"');
    }

    // try to establish a connection to the module
    await getConnection();

    _logger.log('Downloading "' + remoteFile + '" ...');

    let data = null;

    // download the file
    try{
        data = await _nodeMcuConnector.download(remoteFile);
        _logger.log('Data Transfer complete!');

    }catch(e){
        _logger.debug(e);
        throw new Error('Data Transfer FAILED!');
    }

    // store the file
    try{
        await _fs.writeFile(localFilename, data);
        _logger.log('File "' + localFilename + '" created');
    }catch(e){
        _logger.debug(e);
        throw new Error('i/o error - cannot save file');
    }
}

// removes a file from NodeMCU
async function remove(filename){

    // try to establish a connection to the module
    await getConnection();

    // remove the file
    await _nodeMcuConnector.remove(filename);

    // just show complete message (no feedback from nodemcu)
    _mculogger.log('File "' + filename + '" removed!');
}

// format the file system
async function mkfs(){

    // try to establish a connection to the module
    await getConnection();

    _mculogger.log('Formatting the file system...this will take around ~30s');

    try{
        const response = await _nodeMcuConnector.format();

        // just show complete message
        _mculogger.log('File System created | ' + response);
    }catch(e){
        _mculogger.error('Formatting failed');
        _logger.debug(e);
    }
}

// Reset of the NodeMCU Module
async function softreset(){

    // try to establish a connection to the module
    await getConnection();

    // trigger softeset
    await _nodeMcuConnector.softreset();

    // log
    _mculogger.log('Soft-Reset executed (node.restart())');
}

// Reset of the NodeMCU Module
// @TODO reset without connection check!!!!
async function hardreset(){

    // trigger reset
    await _nodeMcuConnector.hardreset(_options.device);

    // log
    _mculogger.log('Hard-Reset executed (100ms)');
}

// serial terminal <> console session
async function terminal(initialCommand=null){
    _terminallogger.log('Starting Terminal Mode - press ctrl+c to exit');

    // run initial command before starting terminal session ?
    // start
    await _serialTerminal.passthrough(_options.device, _options.baudrate, initialCommand);
}

// show serial devices connected to the system
async function devices(showAll, jsonOutput){
    
    try{
        const serialDevices = await _nodeMcuConnector.listDevices(showAll);

        if (jsonOutput){
            writeOutput(JSON.stringify(serialDevices));
        }else{
            // just show complete message
            if (serialDevices.length == 0){
                _mculogger.error('No Connected Devices found | Total: ' + serialDevices.length);

            }else{
                // info message in case std filter is active
                if (!showAll){
                    _mculogger.info('Device filter is active - only known NodeMCU devices (USB vendor-id) will be listed.');
                }

                _mculogger.log('Connected Devices | Total: ' + serialDevices.length);
    
                // print fileinfo
                serialDevices.forEach(function(device){
                    _mculogger.log('- ' + device.path + ' (' + device.manufacturer + ', ' + device.pnpId + ')');
                });
            }
        }
    }catch(e){
        _mculogger.alert('Cannot retrieve serial device list - ');
        _logger.debug(e);
    }
}

// Programmatic Access to the core functions
module.exports = {
    // access the connector directly
    Connector: _nodeMcuConnector,

    // set output handler
    onOutput: function (handler) {
        outputHandler = handler;
    },

    // set connector options
    setOptions: function(opt){
        // merge with default options
        Object.keys(_options).forEach(function(key){
            _options[key] = opt[key] || _options[key];
        });
    },

    onError: _nodeMcuConnector.onError,
    disconnect: disconnect,

    // cli-commmands
    terminal: terminal,
    devices: devices,
    fsinfo: fsinfo,
    softreset: softreset,
    hardreset: hardreset,
    run: run,
    mkfs: mkfs,
    upload: upload,
    download: download,
    remove: remove
};
