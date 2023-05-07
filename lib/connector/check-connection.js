const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');
const _logger = require('logging-facility').getLogger('connector');

_luaCommandBuilder.command = _luaCommandBuilder.espCommands();

// checks the node-mcu connection
function checkConnection(){

    return new Promise(function(resolve, reject){

        // 1.5s connection timeout
        const watchdog = setTimeout(function(){
            // throw error
            reject(new Error('Timeout, no response detected - is NodeMCU online and the Lua interpreter ready ?'));
        }, 1500);

        // send a simple print command to the lua engine
        _virtualTerminal.executeCommand(_luaCommandBuilder.command.echo)
            .then(({echo, response}) => {
                // clear watchdog
                clearTimeout(watchdog);

                // validate command echo and command output
                if (response == 'echo1337' && echo == 'print("echo1337")') {
                    resolve();
                } else {
                    _logger.log('Echo:', echo);
                    _logger.debug('Response:', response);
                    reject(new Error('No response detected - is NodeMCU online and the Lua interpreter ready ?'));
                }
            })
            .catch(reject)
    });

}

module.exports = checkConnection;