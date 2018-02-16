const _serialport = require('serialport');
const _delimiterParser = _serialport.parsers.Delimiter;

// current device
let _device = null;

// read delimiter
let _delimiterSequence = [10, 13];

function requireConnection(){
    if (_device === null){
        throw new Error('serial device not connected - establish a connection before performing i/o operations');
    }
}

function connect(devicename, baudrate=115200, onData=null, onError=null){
    // wrap into promise
    return new Promise(function(resolve, reject){

        // try to open the serial port
        _device = new _serialport(devicename, {
            baudRate: parseInt(baudrate),
            autoOpen: false
        }); 

        // new delimiter parser
        const parser = _device.pipe(new _delimiterParser({ delimiter: Buffer.from(_delimiterSequence) }));

        // add listener
        if (onData !== null){
            parser.on('data', onData);
        }
        if (onError !== null){
            _device.on('error', onError);
        }

        // open connection
        _device.open(function(err){
            if (err){
                reject(err);
            }else{
                resolve();
            }
        });
    });
}

function setDelimiterSequence(delimiter){
    _delimiterSequence = delimiter;
}

function disconnect(){
    // wrap into promise
    return new Promise(function(resolve, reject){
        // device handle available ?
        if (_device !== null){

            // close port
            _device.close(err => {
                if (err){
                    reject(err);
                }else{
                    // clear handle
                    _device = null;

                    resolve();
                }
            });
        }else{
            resolve();
        }
    });
}

function write(data){
    requireConnection();

    // wrap into promise
    return new Promise(function(resolve, reject){
        _device.write(data, err => {
            if (err){
                reject(err);
            }else{
                resolve();
            }
        })
    });
}

function set(opt){
    requireConnection();

    // wrap into promise
    return new Promise(function(resolve, reject){
        _device.set(opt, err => {
            if (err){
                reject(err);
            }else{
                resolve();
            }
        })
    });
}

function flush(){
    requireConnection();

    // wrap into promise
    return new Promise(function(resolve, reject){
        _device.flush(err => {
            if (err){
                reject(err);
            }else{
                resolve();
            }
        })
    });
}

function drain(){
    requireConnection();

    // wrap into promise
    return new Promise(function(resolve, reject){
        _device.drain(err => {
            if (err){
                reject(err);
            }else{
                resolve();
            }
        })
    });
}

function list(){
    return _serialport.list();
}

function isConnected(){
    return _device !== null;
}

module.exports = {
    connect: connect,
    disconnect: disconnect,
    setDelimiterSequence: setDelimiterSequence,
    set: set,
    flush: flush,
    drain: drain,
    write: write,
    list: list,
    isConnected: isConnected
};