const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');
const _async = require('async-magic');

// reset NodeMCU devkit - compatible with devices using rts/dtr reset/programming circuit
// @see https://github.com/nodemcu/nodemcu-devkit-v1.0/blob/master/NODEMCU_DEVKIT_V1.0.PDF Page #3
// Reset => DTR=1, RTS=0
async function hardreset(devicename){
    // initiate lowlevel connection
    if (!_virtualTerminal.isConnected()){
        await _virtualTerminal.connect(devicename, 115200);
    }

    // pull down RST pin using the reset circuit
    await _virtualTerminal.flowcontrol({
        dtr: false,
        rts: true
    });

    // 100ms delay
    await _async.sleep(100);

    // restore previous state after 100ms
    await _virtualTerminal.flowcontrol({
        dtr: false,
        rts: false
    });
}

// Software Reset using node.restart() command
async function softreset(){
    await _virtualTerminal.executeCommand(_luaCommandBuilder.command.reset);
}

module.exports = {
    softreset: softreset,
    hardreset: hardreset
};