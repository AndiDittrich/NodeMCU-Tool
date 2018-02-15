const _virtualTerminal = require('./transport/scriptable-serial-terminal');

// NodeMCU-Connector Context Logger
//const _logger = require('logging-facility').getLogger('NodeMCU-Connector');

// import connector tasks
const _checkConnection = require('./connector/check-connection');
const _compile = require('./connector/compile');
const _connect = require('./connector/connect');
const _deviceInfo = require('./connector/device-info');
const _devices = require('./connector/list-devices');
const _execute = require('./connector/execute');
const _format = require('./connector/format');
const _fsinfo = require('./connector/fsinfo');
const _remove = require('./connector/remove');
const _reset = require('./connector/reset');
const _run = require('./connector/run');
//const _download = require('./connector/download');
//const _upload = require('./connector/upload');

/*
    this.errorHandler = null;
    this.isConnected = false;
    this.name = devicename;
    this.baudrate = baudrate;
    this.isTransferWriteHelperUploaded = false;
    this.transferEncoding = 'hex';
    */


// close the serial connection
function disconnect(){
    return _virtualTerminal.disconnect();
}

// set main error handler
function onError(cb){
    _virtualTerminal.onError(cb);
}


module.exports = {
    onError: onError,
    disconnect: disconnect,
    connect: _connect,
    checkConnection: _checkConnection,
    compile: _compile,
    deviceInfo: _deviceInfo,
    listDevices: _devices,
//    download: _download,
//    upload: _upload
    execute: _execute,
    format: _format,
    fsinfo: _fsinfo,
    remove: _remove,
    softreset: _reset.softreset,
    hardreset: _reset.hardreset,
    run: _run
};
