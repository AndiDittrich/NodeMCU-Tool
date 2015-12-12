var _serialport = require('serialport');

/**
 * Virtual Terminal to interact programmatical & asynchronous with a serial terminal
 * @constructor
 */
function ScriptableSerialTerminal(delimiterSequence){
    this.device = null;
    this.inputbuffer = [];
    this.waitingForInput = null;
    this.errorHandler = null;
    this.delimiterSequence = delimiterSequence;
    this.encoding = 'utf8';
}

ScriptableSerialTerminal.prototype.onError = function(cb){
    this.errorHandler = cb;
};

ScriptableSerialTerminal.prototype.open = function(devicename, baudrate, cb){

    // try to open the serial port
    this.device = new _serialport.SerialPort(devicename, {
        baudrate: baudrate,
        parser: _serialport.parsers.byteDelimiter(this.delimiterSequence)
    }, false);

    // handle errors
    this.device.on('error', function(error){
        // proxy
        if (this.errorHandler){
            this.errorHandler.apply(this, [error]);
        }

        // device opened ?
        if (this.device.isOpen()){
            this.device.close();
        }
    }.bind(this));

    // listen on incoming data
    this.device.on('data', function(input){

        // strip delimiter sequence from array
        input.splice(input.length-this.delimiterSequence.length, this.delimiterSequence.length);

        // convert byte array UTF8 to string;
        input = (new Buffer(input)).toString(this.encoding);

        // response data object - default no response data
        var data = {
            echo: input,
            response: null
        };

        // response found ? split echo and response
        var splitIndex = input.indexOf('\n');
        if (splitIndex > 0){
            data.echo = input.substr(0, splitIndex).trim();
            data.response = input.substr(splitIndex + 1).trim();
        }

        // process waiting for input ?
        if (this.waitingForInput){
            var t = this.waitingForInput;
            this.waitingForInput = null;
            t.apply(t, [data])
        }else{
            this.inputbuffer.push(data);
        }

    }.bind(this));

    // open connection
    this.device.open(cb);
};

// close instance
ScriptableSerialTerminal.prototype.close = function(){
    if (this.device.isOpen()){
        this.device.close();
    }
};

// wait for next echo + response line
ScriptableSerialTerminal.prototype.getNextResponse = function(cb){
    if (this.inputbuffer.length > 0){
        cb(this.inputbuffer.shift());
    }else{
        // add as waiting instance (no concurrent!)
        this.waitingForInput = cb;
    }
};

// write data to serial port and wait for transmission complete
ScriptableSerialTerminal.prototype.write = function(data, cb){
    this.device.write(data, function(error){
        if (error){
            cb(error, null);
        }else{
            this.device.drain(cb);
        }
    }.bind(this));
};

// send a command to the lua engine and capture command echo and output (response)
ScriptableSerialTerminal.prototype.executeCommand = function(command, cb){
    // send command
    this.write(command + '\n', function(error){
        // write successful ?
        if (error) {
            cb('Cannot run command: ' + error, null);
        }else{
            // get echo
            this.getNextResponse(function(data){
                cb(null, data.echo, data.response);
            }.bind(this));
        }
    }.bind(this));
};

// remove unread input
ScriptableSerialTerminal.prototype.purge = function(cb){
    // flush input buffer
    this.device.flush(function(error){
        // flush readline buffer
        this.inputbuffer = [];

        // run callback
        if (cb){
            cb.apply(this, [error]);
        }
    }.bind(this));
};

module.exports = ScriptableSerialTerminal;