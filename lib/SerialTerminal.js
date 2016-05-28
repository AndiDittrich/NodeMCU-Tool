var _serialport = require('serialport');

/**
 * Serial Terminal - bridges serial port to stdin/stdout
 * @constructor
 */
function SerialTerminal(){
    this.device = null;
    this.errorHandler = null;
    this.connectHandler = null;
    this.encoding = 'utf8';
}

SerialTerminal.prototype.onError = function(cb){
    this.errorHandler = cb;
};

SerialTerminal.prototype.onConnect = function(cb){
    this.connectHandler = cb;
};

SerialTerminal.prototype.passthrough = function(devicename, baudrate, cb){

    // try to open the serial port
    this.device = new _serialport.SerialPort(devicename, {
        baudrate: baudrate,
        parser: _serialport.parsers.byteLength(1)
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
        process.stdout.write(input);
    }.bind(this));

    // open connection
    this.device.open(function(error){
        if (error){
            cb(error);
        }else{

            // prepare
            process.stdin.setRawMode(true);
            process.stdin.setEncoding('utf8');

            // pass-through
            process.stdin.on('data', function(data){
                // ctrl-c
                if (data == '\u0003'){
                    this.device.close();
                    cb(null);
                    process.exit();
                }
                this.device.write(data);
            }.bind(this));

            // run connect handler ?
            if (this.connectHandler){
                this.connectHandler.apply(this.connectHandler, [this.device]);
            }
        }
    }.bind(this));
};

// close instance
SerialTerminal.prototype.close = function(){
    if (this.device.isOpen()){
        this.device.close();
    }
};

module.exports = SerialTerminal;