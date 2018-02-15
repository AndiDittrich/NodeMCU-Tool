const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');

// format the filesystem
async function format(){

    // create new filesystem
    const {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.fsFormat);
    return response;
}

module.exports = format;