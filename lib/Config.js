var _prompt = require('prompt')
var _fs = require('fs');

// project based configuration
function generateConfig(){
    // get user input
    _prompt.start();
    _prompt.message = '';
    _prompt.delimiter = '';
    _prompt.colors = false;

    _prompt.get({
        properties: {
            baudrate: {
                pattern: /^\d+$/,
                description: 'Baudrate in Bit per Seconds, e.g. 9600 (default)',
                required: false,
                message: 'Only Integers allowed!',
                default: 9600
            },
            port: {
                pattern: /^.+$/,
                description: 'Serial connection to use, e.g. COM1 or /dev/ttyUSB2',
                required: false,
                default: '/dev/ttyUSB0'
            }
        }
    }, function (err, data){

        if (err){
            console.error(err);
        }else{
            // write config to file
            _fs.writeFileSync('.nodemcutool', JSON.stringify(data, null, 4));
        }
    });
};


module.exports = {
    init: generateConfig
};