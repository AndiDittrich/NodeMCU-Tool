const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');

// execute a remote file
async function run(remoteName){

    const {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.prepare('run', [remoteName]));
    return response;
}

module.exports = run;