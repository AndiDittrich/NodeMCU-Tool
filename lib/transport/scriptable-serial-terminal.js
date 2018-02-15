// Virtual Terminal to interact programmatical & asynchronous with a serial terminal
const _serialport = require('./serialport');

// NodeMCU-Connector Context Logger
const _logger = require('logging-facility').getLogger('NodeMCU-SerialConnection');

let _inputbuffer = [];
let _waitingForInput = null;
let _errorHandler = null;
const _encoding = 'utf8';

// setup low-level error handler (transport errors)
function onLowLevelError(cb){
    _errorHandler = cb;
}

function connect(devicename, baudrate, delimiterSequence){

    // setup delimiter sequence
    _serialport.setDelimiterSequence(delimiterSequence);

    // handle errors
    function onError(error){
        // proxy
        if (_errorHandler){
            _errorHandler(error);
        }else{
            _logger.alert(error);
        }
    }

    // listen on incoming data
    function onData(rawData){

        // strip delimiter sequence from array
        const input = rawData.toString(_encoding);

        // response data object - default no response data
        const data = {
            echo: input,
            response: null
        };

        // response found ? split echo and response
        const splitIndex = input.indexOf('\n');
        if (splitIndex > 0){
            data.echo = input.substr(0, splitIndex).trim();
            data.response = input.substr(splitIndex + 1).trim();
        }

        // process waiting for input ?
        if (_waitingForInput !== null){
            const resolver = _waitingForInput;
            _waitingForInput = null;
            resolver(data);
        }else{
            _inputbuffer.push(data);
        }
    }

    // try to open connection (returns promise)
    return _serialport.connect(devicename, baudrate, onData, onError);
}

// close instance
function disconnect(){
    return _serialport.disconnect();
}

// wait for next echo + response line
function getNextResponse(){
    if (_waitingForInput !== null){
        throw new Error('concurreny error - receive listener already in-queue');
    }

    return new Promise(function(resolve){
        // data received ?
        if (_inputbuffer.length > 0){
            resolve(_inputbuffer.shift());
        }else{
            // add as waiting instance (no concurrent!)
            _waitingForInput = resolve;
        }
    });
}

// write data to serial port and wait for transmission complete
async function write(data){
    await _serialport.write(data);
    await _serialport.drain();
}

// send a command to the lua engine and capture command echo and output (response)
async function executeCommand(command){
    // execute command
    await write(command + '\n');

    // fetch echo
    const data = await getNextResponse();

    return {
        echo: data.echo,
        response: data.response
    };
}

// remove unread input
async function purge(){
    await _serialport.flush();

    // flush readline buffer
    _inputbuffer = [];
}

// set flow-control control
function flowcontrol(options){
    return _serialport.set(options);
}

module.exports = {
    onError: onLowLevelError,
    connect: connect,
    disconnect: disconnect,
    getNextResponse: getNextResponse,
    write: write,
    executeCommand: executeCommand,
    purge: purge,
    flowcontrol: flowcontrol
};