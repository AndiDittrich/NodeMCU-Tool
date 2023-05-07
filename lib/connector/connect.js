const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _async = require('async-magic');
const _checkConnection = require('./check-connection');
const _deviceInfo = require('./device-info');
const _luaCommandBuilder = require('../lua/command-builder');
const _logger = require('logging-facility').getLogger('connector');

async function connect(devicename, baudrate, applyConnectionCheck=true, connectDelay=0){
    // handle connection errors (device not available, permission errors..)
    try{
        // new terminal line sequence "\n\r>"
        await _virtualTerminal.connect(devicename, baudrate, [13,10,62]);

    // custom error messagr
    }catch(e){
        _logger.debug(e);
        throw new Error('Cannot open port "' + devicename + '"');
    }
    
    // no connection check ?
    if (applyConnectionCheck === false){
        return 'Skipping Connection Check..';
    }

    // delay the connection process ? may fix issues related to rebooting modules
    if (connectDelay && connectDelay > 1){
        // step 1 - sleep
        await _async.sleep(connectDelay);

        // step 2 - send dummy sequence
        await _virtualTerminal.write('\n\n\n'  + _luaCommandBuilder.command.echo + '\n\n\n');

        // step 3 - wait 1/3 to get the dummy sequence processed
        await _async.sleep(connectDelay);

        // step 4 - send seconf dummy sequence
        await _virtualTerminal.write('\n\n\n'  + _luaCommandBuilder.command.echo + '\n\n\n');

        // step 5 - wait 1/3 to get the dummy sequence processed
        await _async.sleep(connectDelay);

        // purge received data
        await _virtualTerminal.purge();
    }

    // perform standard check
    await _checkConnection();

    // fetch device info
    const data = await _deviceInfo();

    _luaCommandBuilder.setArch(data.arch);
    _luaCommandBuilder.command = _luaCommandBuilder.espCommands();

    return 'Arch: ' + data.arch + ' | Version: ' + data.version + ' | ChipID: 0x' + data.chipID + ' | FlashID: 0x' + data.flashID;
}

module.exports = connect;