#!/usr/bin/env node

// Manages User CLI interactions

// load utils
var _cli = require('commander');
var _progressbar = require('cli-progress');
var _pkg = require('../package.json');
var _prompt = require('prompt');
var _nodemcutool = require('../lib/NodeMCU-Tool');
var _luaCommandBuilder = require('../lib/LuaCommandBuilder');
var _colors = require('colors');
var _fs = require('fs');
var _loggingFacility = require('logging-facility');
var _logger = _loggingFacility.getLogger('NodeMCU-Tool');

// silent mode flag
var silentModeEnabled = false;

// set the logging backend/upstream
// every log message is passed to this function
_loggingFacility.setBackend(function(facility, level, args){
    // args to string
    args = args.map(function(s){
        return s.toString();
    });

    // log, info, debug
    if (level > 5){
        // only display messages in normal operation mode
        if (silentModeEnabled !== true){
            console.log(_colors.cyan('[' + facility.trim() + ']'), args.join(' '));
        }

        // errors
    }else{
        console.log(_colors.red('[' + facility.trim() + ']'), args.join(' '));
    }
});

// general content
_nodemcutool.onOutput(function(message){
    console.log(message);
});

function cliPrepare(options){
    // default
    options = options || {};

    // silent mode enabled by flag ?
    silentModeEnabled = (_cli.silent===true);

    // silent mode enabled by json output format ?
    if (options.json && options.json === true){
        silentModeEnabled = true;
    }

    // silent mode enabled by json raw format ?
    if (options.raw && options.raw === true){
        silentModeEnabled = true;
    }

    // merge global flags, command flags and global defaults
    var defaultConfig = {
        // global flags
        baudrate:           _cli.baud           || '115200',
        port:               _cli.port           || '/dev/ttyUSB',
        connectionDelay:    _cli.connectionDelay || 0,

        // command specific flags
        optimize:   options.optimize    || false,
        compile:    options.compile     || false,
        keeppath:   options.keeppath    || false,
        remotename: options.remotename  || null,
        run:        options.run         || false,
        all:        options.all         || false,
        json:       options.json        || false,
        raw:        options.raw         || false,
        softreset:  options.softreset   || false
    };

    // project based configuration
    try{
        // try to load project based configuration
        var data = _fs.readFileSync('.nodemcutool', 'utf8');

        if (data){
            // decode json based data
            var d = JSON.parse(data);

            // extract values
            defaultConfig.baudrate = d.baudrate || defaultConfig.baudrate;
            defaultConfig.port = d.port || defaultConfig.port;
            defaultConfig.optimize = (d.optimize && d.optimize === true);
            defaultConfig.compile = (d.compile && d.compile === true);
            defaultConfig.keeppath = (d.keeppath && d.keeppath === true);
            _logger.log('Project based configuration loaded');
        }
    }catch (err){
    }

    // set port/baud options
    _nodemcutool.setOptions({
        device: defaultConfig.port,
        baudrate: defaultConfig.baudrate,
        connectionDelay: defaultConfig.connectionDelay
    });

    return defaultConfig;
}


// CLI setup
_cli
    // read file version package.json
    .version(_pkg.version)

    // serial port device
    .option('-p, --port <port>', 'Serial port device name e.g. /dev/ttyUSB0, COM1', null)

    // serial port baudrate
    .option('-b, --baud <baudrate>', 'Serial Port Baudrate in bps, default 115200', null)

    // silent mode - no status messages are shown
    .option('--silent', 'Enable silent mode - no status messages are shown', false)

    // connection delay between opening the serial device and starting the communication
    .option('--connection-delay <delay>', 'Connection delay between opening the serial device and starting the communication', 0);

_cli
    .command('fsinfo')
    .description('Show file system info (current files, memory usage)')

    // json output mode
    .option('--json', 'Display output JSON encoded', false)

    // raw output mode
    .option('--raw', 'Display output as simple text with tab delimiter', false)

    .action(function(opt){
        var options = cliPrepare(opt);

        // output format
        var format = 'human';

        // json format ?
        if (options.json){
            format = 'json';
        }

        // raw format (text)
        if (options.raw){
            format = 'raw';
        }

        _nodemcutool.fsinfo(format);
    });

_cli
    .command('run <file>')
    .description('Executes an existing .lua or .lc file on NodeMCU')
    .action(function(filename, opt){
        var options = cliPrepare(opt);

        _nodemcutool.run(filename);
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

    .action(function(localFiles, opt){
        var options = cliPrepare(opt);

        // initialize a new progress bar
        var bar = new _progressbar.Bar({
            format: 'Upload Status {percentage}% [{bar}] | ETA {eta}s',
            clearOnComplete: true
        });

        // files provided ?
        if (localFiles.length == 0){
            _logger.error('No files provided for upload (empty file-list)');
            return;
        }

        // handle multiple uploads
        var currentFileNumber = 0;

        _nodemcutool.upload(localFiles, options, function(current, total, fileNumber){

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

    .action(function(remoteFilename, opt){
        var options = cliPrepare(opt);

        _nodemcutool.download(remoteFilename);
    });

_cli
    .command('remove <file>')
    .description('Removes a file from NodeMCU filesystem')
    .action(function(filename, opt){
        var options = cliPrepare(opt);

        _nodemcutool.remove(filename);
    });

_cli
    .command('mkfs')
    .description('Format the SPIFFS filesystem - ALL FILES ARE REMOVED')

    // force fs creation without prompt
    .option('--noninteractive', 'Execute command without user interaction', false)

    .action(function(opt){
        var options = cliPrepare(opt);

        // no prompt!
        if (opt.noninteractive){
            // format
            _nodemcutool.mkfs();

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
                    description: _colors.cyan('[NodeMCU-Tool]') + ' Do you really want to format the filesystem and delete all file ?',
                    message: 'Type yes/no',
                    required: true,
                    default: 'no'
                }
            }
        }, function (err, result){
            if (err){
                _logger.error('Formatting aborted');
                return;
            }

            // transform to lower case
            var c = result.confirm.toLowerCase();

            // check
            if (c!='y' && c!='yes'){
                _logger.error('Formatting aborted');
                return;
            }

            // format
            _nodemcutool.mkfs();
        });

    });


_cli
    .command('terminal')
    .description('Opens a Terminal connection to NodeMCU')
    .option('--run <filename>', 'Running a file on NodeMCU before starting the terminal session', false)
    .action(function(opt){
        var options = cliPrepare(opt);

        // run a initial command on startup ?
        var initialCommand = null;
        if (options.run){
            initialCommand = _luaCommandBuilder.prepare('run', [options.run]);
        }

        // start terminal session
        _nodemcutool.terminal(initialCommand);
    });

_cli
    .command('init')
    .description('Initialize a project-based Configuration (file) within current directory')
    .action(function(opt){
        var options = cliPrepare(opt);

        _logger.log('Creating project based configuration file..');

        // get user input
        _prompt.start();
        _prompt.message = '';
        _prompt.delimiter = '';
        _prompt.colors = false;

        _prompt.get({
            properties: {
                baudrate: {
                    pattern: /^\d+$/,
                    description: _colors.cyan('[NodeMCU-Tool]') + ' Baudrate in Bit per Seconds, e.g. 9600 (default)',
                    required: false,
                    message: 'Only Integers allowed!',
                    default: 9600
                },
                port: {
                    pattern: /^.+$/,
                    description: _colors.cyan('[NodeMCU-Tool]') + ' Serial connection to use, e.g. COM1 or /dev/ttyUSB2',
                    required: false,
                    default: '/dev/ttyUSB0'
                }
            }
        }, function (err, data){

            if (err){
                _logger.error(err);
            }else{
                // set defaults
                data.optimize = false;
                data.compile = false;
                data.keeppath = false;

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


    .action(function(opt){
        var options = cliPrepare(opt);

        _nodemcutool.devices(options.all, options.json);
    });

_cli
    .command('reset')
    .description('Execute a Hard-Reset of the Module using DTR/RTS reset circuit')

    // softreset mode
    .option('--softreset', 'Resets the module using node.restart() command', false)


    .action(function(opt){
        var options = cliPrepare(opt);

        // software reset
        if (options.softreset){
            _nodemcutool.softreset();

        // hard-reset nRST
        }else{
            _nodemcutool.reset();
        }

    });

_cli
    .command('*')
    .action(function(c){
        _logger.error('Unknown command "' + c + '"');
        _cli.outputHelp();
    });

// run the commander dispatcher
_cli.parse(process.argv);

// default action (no command provided)
if (!process.argv.slice(2).length) {
    _cli.outputHelp();
}