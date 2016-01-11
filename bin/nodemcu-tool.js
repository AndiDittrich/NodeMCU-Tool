#!/usr/bin/env node

// load utils
var _cli = require('commander');
var _progressbar = require('cli-progress');
var _pkg = require('../package.json')
var _prompt = require('prompt')
var _nodemcutool = require('../lib/NodeMCU-Tool');
var _colors = require('colors');
var _fs = require('fs');

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

// initialize default config
var defaults = (function(){

    // standard configuration
    var config = {
        baudrate: '9600',
        port: '/dev/ttyUSB0',
        optimize: false,
        compile: false
    };

    try{
        // try to load project based configuration
        var data = _fs.readFileSync('.nodemcutool', 'utf8');

        if (data){
            // decode json based data
            var d = JSON.parse(data);

            // extract values
            config.baudrate = d.baudrate || config.baudrate;
            config.port = d.port || config.port;
            config.optimize = (d.optimize && d.optimize === true);
            config.compile = (d.compile && d.compile === true);

            console.log(_colors.cyan('[NodeMCU-Tool]'), 'Project based configuration loaded');
        }
    }catch (err){
    }

    return config;
})();


// CLI setup
_cli
    // read file version package.json
    .version(_pkg.version)

    // serial port device
    .option('-p, --port <port>', 'Serial port device name e.g. /dev/ttyUSB0, COM1', defaults.port)

    // serial port baudrate
    .option('-b, --baud <baudrate>', 'Serial Port Baudrate in bps, default 9600', defaults.baudrate);

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
    .description('Upload Files to NodeMCU (ESP8266) target')

    // file cleanup
    .option('-o, --optimize', 'Removes comments and empty lines from file before uploading', false)

    // compile files after upload
    .option('-c, --compile', 'Compile LUA file to bytecode (.lc) and remove the original file after upload', false)

    .action(function(localFile, options){
        // initialize a new progress bar
        var bar = new _progressbar.Bar({
            format: 'Upload Status {percentage}% [{bar}] | ETA {eta}s',
            clearOnComplete: true
        })

        // append global defaults
        if (!options.compile){
            options.compile = defaults.compile;
        }
        if (!options.optimize){
            options.optimize = defaults.optimize;
        }

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
    .command('download <file>')
    .description('Download files from NodeMCU (ESP8266) target')

    .action(function(remoteFilename){
        _nodemcutool.download(_cli.port, _cli.baud, remoteFilename);
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

_cli
    .command('init')
    .description('Initialize a project-based Configuration (file) within current directory')
    .action(function(){
        console.log('[NodeMCU-Tool] Creating project based configuration file..');

        // get user input
        _prompt.start();
        _prompt.message = '';
        _prompt.delimiter = '';
        _prompt.colors = false;

        _prompt.get({
            properties: {
                baudrate: {
                    pattern: /^\d+$/,
                    description: '[NodeMCU-Tool] Baudrate in Bit per Seconds, e.g. 9600 (default)',
                    required: false,
                    message: 'Only Integers allowed!',
                    default: 9600
                },
                port: {
                    pattern: /^.+$/,
                    description: '[NodeMCU-Tool] Serial connection to use, e.g. COM1 or /dev/ttyUSB2',
                    required: false,
                    default: '/dev/ttyUSB0'
                }
            }
        }, function (err, data){

            if (err){
                console.error(err);
            }else{
                // set defaults
                data.optimize = false;
                data.compile = false;

                // write config to file
                _fs.writeFileSync('.nodemcutool', JSON.stringify(data, null, 4));
            }
        });
    });

// run the commander dispatcher
_cli.parse(process.argv);

// default action (no command provided)
if (!process.argv.slice(2).length) {
    _cli.outputHelp();
}