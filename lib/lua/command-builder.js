const _esp8266_commands = require('./esp8266-commands');

// prepare command be escaping args
function luaPrepare(commandName, args){
    // get command by name
    let command = _esp8266_commands[commandName] || null;

    // valid command name provided ?
    if (command == null){
        return null;
    }

    // replace all placeholders with given args
    args.forEach(function(arg){
        // simple escaping quotes
        arg = arg.replace(/[^\\]"/g, '\"');

        // apply arg
        command = command.replace(/\?/, arg);
    });

    return command;
};

module.exports = {
    command: _esp8266_commands,
    prepare: luaPrepare
};
