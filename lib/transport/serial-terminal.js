const { SerialPort: _serialport, ByteLengthParser: _lengthParser } = require('serialport');

// serial connection to stdout;stdin
function passthrough(devicename, baudrate, initialCommand=null){
    return new Promise(function(resolve, reject){

        // try to open the serial port
        const _device = new _serialport({
            path: devicename,
            baudRate: parseInt(baudrate),
            autoOpen: false
        }); 

        // new length parser
        const parser = _device.pipe(new _lengthParser({length: 1}));

        // handle low-level errors
        _device.on('error', reject);

        // listen on incomming data
        parser.on('data', function(input){
            // passthrough
            process.stdout.write(input.toString('utf8'));
        });

        // open connection
        _device.open(function(err){
            if (err){
                reject(err);
            }else{
                // prepare
                if (process.stdin.isTTY){
                    process.stdin.setRawMode(true);
                }
                
                process.stdin.setEncoding('utf8');

                // initial command set ?
                if (initialCommand !== null){
                    _device.write(initialCommand + '\n');
                }

                // pass-through
                process.stdin.on('data', function(data){
                    // ctrl-c ?
                    if (data == '\u0003'){
                        _device.close(function(e){
                            if (e){
                                reject(e);
                            }else{
                                resolve();
                            }
                        });
                    }else{
                        // passthrough stdin->serial
                        _device.write(data);
                    }
                });
            }
        });
    });
}

module.exports = {
    passthrough: passthrough
};