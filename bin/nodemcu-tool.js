#!/usr/bin/env node

// load utils
var _cli = require('commander');
var _progressbar = require('cli-progress');
var _pkg = require('../package.json')
var _prompt = require('prompt')
var _nodemcutool = require('../lib/NodeMCU-Tool');
var _colors = require('colors');

// setup CLI/TTY message handler (colorized output)
_nodemcutool.onError(function(context, message){
    if (context && context.length > 0){
        console.error(_colors.red('[' + context + ']'), message);
    }else{
        console.error(message);
    }
});
_nodemcutool.onStatus(function(context, message){
    if (context && context.length > 0){
        console.log(_colors.cyan('[' + context + ']'), message);
    }else{
        console.log(message);
    }
});


// CLI setup
_cli
    // read file version package.json
    .version(_pkg.version)

    // serial port device
    .option('-p, --port <port>', 'Serial port device name e.g. /dev/ttyUSB0, COM1', '/dev/ttyUSB0')

    // serial port baudrate
    .option('-b, --baud <baudrate>', 'Serial Port Baudrate in bps, default 9600', '9600');

_cli
    .command('fsinfo')
    .description('Show file system info (current files, memory usage)')
    .action(function(){
        _nodemcutool.fsinfo(_cli.port, _cli.baud);
    });

_cli
    .command('run <file>')
    .description('Executes an existing .lua or .lc file on NodeMCU')
    .action(function(filename){
        _nodemcutool.run(_cli.port, _cli.baud, filename);
    });


_cli
    .command('upload <file>')
    .description('Upload LUA files to NodeMCU (ESP8266) target')

    // file cleanup
    .option('-o, --optimize', 'Removes comments and empty lines from file before uploading', false)

    // compile files after upload
    .option('-c, --compile', 'Compile LUA file to bytecode (.lc) and remove the original file after upload', false)

    .action(function(localFile, options){
        // initialize a new progress bar
        var bar = new _progressbar.Bar({
            format: 'Upload Status {percentage}% [{bar}] | ETA {eta}s',
            clearOnComplete: true
        });

        _nodemcutool.upload(_cli.port, _cli.baud, localFile, options, function(current, total){
            // bar initialized ?
            if (current == 0) {
                bar.start(total, 0);
            }else {
                bar.update(current);

                // finished ?
                if (current >= total) {
                    bar.stop();
                }
            }
        });
    });

_cli
    .command('remove <file>')
    .description('Removes a file from NodeMCU filesystem')
    .action(function(filename) {
        _nodemcutool.remove(_cli.port, _cli.baud, filename);
    });

_cli
    .command('mkfs')
    .description('Format the SPIFFS filesystem - ALL FILES ARE REMOVED')
    .action(function(){
        // user confirmation required!
        _prompt.start();
        _prompt.message = '';
        _prompt.delimiter = '';
        _prompt.colors = false;

        _prompt.get({
            properties: {
                confirm: {
                    pattern: /^(yes|no|y|n)$/gi,
                    description: '[NodeMCU-Tool] Do you really want to format the filesystem and delete all file ?',
                    message: 'Type yes/no',
                    required: true,
                    default: 'no'
                }
            }
        }, function (err, result){
            if (err){
                console.log('\n[NodeMCU-Tool] Formatting aborted')
                return;
            }

            // transform to lower case
            var c = result.confirm.toLowerCase();

            // check
            if (c!='y' && c!='yes'){
                console.log('[NodeMCU-Tool] Formatting aborted');
                return;
            }

            // format
            _nodemcutool.mkfs(_cli.port, _cli.baud);
        });

    });


_cli
    .command('terminal')
    .description('Opens a Terminal connection to NodeMCU')
    .action(function(){
        _nodemcutool.terminal(_cli.port, _cli.baud);
    });

// run the commander dispatcher
_cli.parse(process.argv);

// default action (no command provided)
if (!process.argv.slice(2).length) {
    _cli.outputHelp();
}