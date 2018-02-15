const _virtualTerminal = require('../transport/scriptable-serial-terminal');

// LOW LEVEL - run a lua command directly
function executeCommand(cmd){

    // run the lua interpreter
    return _virtualTerminal.executeCommand(cmd);
}

module.exports = executeCommand;
