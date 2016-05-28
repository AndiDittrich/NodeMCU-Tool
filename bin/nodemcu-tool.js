#!/usr/bin/env node

// Manages User CLI interactions

// load utils
var _cli = require('commander');
var _progressbar = require('cli-progress');
var _pkg = require('../package.json')
var _prompt = require('prompt')
var _nodemcutool = require('../lib/NodeMCU-Tool');
var _luaCommandBuilder = require('../lib/LuaCommandBuilder');
var _colors = require('colors');
var _fs = require('fs');

// setup CLI/TTY message handler (colorized output)
_nodemcutool.onError(function(context, message){
    if (context && context.length > 0){
        console.error(_colors.red('[' + context + ']'), message);
    }else{
        console.error(message);
    }

    // die with exit code 1
    process.exit(1);
});

_nodemcutool.onOutput(function(message){
    console.log(message);
});

// helper to enable silent mode
var SilentMode = function(enable){
    if (enable){
        // ignore status messages
        _nodemcutool.onStatus(function(context, message){
        });
    }else{
        _nodemcutool.onStatus(function(context, message){
            if (context && context.length > 0){
                console.log(_colors.cyan('[' + context + ']'), message);
            }else{
                console.log(message);
            }
        });
    }
};

// initialize default config
var defaults = (function(){

    // standard configuration
    var config = {
        baudrate: '9600',
        port: '/dev/ttyUSB0',
        optimize: false,
        compile: false,
        keeppath: false
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
            config.keeppath = (d.keeppath && d.keeppath === true);
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
    .option('-b, --baud <baudrate>', 'Serial Port Baudrate in bps, default 9600', defaults.baudrate)

    // silent mode - no status messages are shown
    .option('--silent', 'Enable silent mode - no status messages are shown', false);

_cli
    .command('fsinfo')
    .description('Show file system info (current files, memory usage)')

    // json output mode
    .option('--json', 'Display output JSON encoded', false)

    .action(function(options){
        // force silent mode!
        SilentMode(options.json===true || _cli.silent===true);

        _nodemcutool.fsinfo(_cli.port, _cli.baud, options.json);
    });

_cli
    .command('run <file>')
    .description('Executes an existing .lua or .lc file on NodeMCU')
    .action(function(filename){
        // silent mode ?
        SilentMode(_cli.silent===true);

        _nodemcutool.run(_cli.port, _cli.baud, filename);
    });

_cli
    .command('upload [files...]')
    .description('Upload Files to NodeMCU (ESP8266) target')

    // file cleanup
    .option('-o, --optimize', 'Removes comments and empty lines from file before uploading', false)

    // compile files after upload
    .option('-c, --compile', 'Compile LUA file to bytecode (.lc) and remove the original file after upload', false)

    // keep-path
    .option('-k, --keeppath', 'Keep a relative file path in the destination filename (i.e: static/test.html will be named static/test.html)', false)

    // sets the remote filename
    .option('-n, --remotename <remotename>', 'Set destination file name. Default is same as original. Only available when uploading a single file!', false)

    .action(function(localFiles, options){
        // silent mode ?
        SilentMode(_cli.silent===true);

        // initialize a new progress bar
        var bar = new _progressbar.Bar({
            format: 'Upload Status {percentage}% [{bar}] | ETA {eta}s',
            clearOnComplete: true
        });

        // append global defaults
        if (!options.compile){
            options.compile = defaults.compile;
        }
        if (!options.optimize){
            options.optimize = defaults.optimize;
        }
        if (!options.keeppath){
          options.keeppath = defaults.keeppath;
        }

        // files provided ?
        if (localFiles.length == 0){
            console.error(_colors.red('[NodeMCU-Tool]'), 'No files provided for upload (empty file-list)');
            return;
        }

        // handle multiple uploads
        var currentFileNumber = 0;

        _nodemcutool.upload(_cli.port, _cli.baud, localFiles, options, function(current, total, fileNumber){

            // new file ?
            if (currentFileNumber != fileNumber){
                bar.stop();
                currentFileNumber = fileNumber;
                bar.start(total, 1);
            }else{

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
        // silent mode ?
        SilentMode(_cli.silent===true);

        _nodemcutool.download(_cli.port, _cli.baud, remoteFilename);
    });

_cli
    .command('remove <file>')
    .description('Removes a file from NodeMCU filesystem')
    .action(function(filename){
        // silent mode ?
        SilentMode(_cli.silent===true);

        _nodemcutool.remove(_cli.port, _cli.baud, filename);
    });

_cli
    .command('mkfs')
    .description('Format the SPIFFS filesystem - ALL FILES ARE REMOVED')

    // force fs creation without prompt
    .option('--noninteractive', 'Execute command without user interaction', false)

    .action(function(options){
        // silent mode ?
        SilentMode(_cli.silent===true);

        // no prompt!
        if (options.noninteractive){
            // format
            _nodemcutool.mkfs(_cli.port, _cli.baud);

            return;
        }

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
    .option('--run <filename>', 'Running a file on NodeMCU before starting the terminal session', false)
    .action(function(options){
        // silent mode ?
        SilentMode(_cli.silent===true);

        // run a initial command on startup ?
        var initialCommand = null;
        if (options.run){
            initialCommand = _luaCommandBuilder.prepare('run', [options.run]);
        }

        // start terminal session
        _nodemcutool.terminal(_cli.port, _cli.baud, initialCommand);
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

_cli
    .command('devices')
    .description('Shows a list of all available NodeMCU Modules/Serial Devices')

    // disable the device filter based on vendorId's of common NodeMCU modules
    .option('--all', 'Show all Serial Devices, not only NodeMCU Modules', false)

    // json output mode
    .option('--json', 'Display output JSON encoded', false)

    .action(function(options){
        // force silent mode!
        SilentMode(options.json===true || _cli.silent===true);

        // show all devices ?
        var showAll = options.all || false;

        _nodemcutool.devices(_cli.port, _cli.baud, showAll, options.json);
    });

_cli
    .command('*')
    .action(function(c){
        console.log(_colors.cyan('[NodeMCU-Tool]'), 'Unknown command "' + c + '"');
        _cli.outputHelp();
    });

// run the commander dispatcher
_cli.parse(process.argv);

// default action (no command provided)
if (!process.argv.slice(2).length) {
    _cli.outputHelp();
}