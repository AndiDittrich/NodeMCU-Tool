const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');

// compile a remote file
async function compile(remoteName){

    // run the lua compiler/interpreter to cache the file as bytecode
    const {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.prepare('compile', [remoteName]));
    return response;
}

module.exports = compile;
