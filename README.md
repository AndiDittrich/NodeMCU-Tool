NodeMCU-Tool
============
Upload/Download LUA files to your ESP8266 module with NodeMCU firmware.

**Simple. Command Line. Cross-Platform. File Management. [NodeMCU](http://nodemcu.com/index_en.html).**

```shell
$ npm install nodemcu-tool
```

![Demo](https://github.com/AndiDittrich/NodeMCU-Tool/raw/master/video.gif)

Tool Summary
-------------
NodeMCU Tool allows you to

* Upload LUA files to your ESP8266/NodeMCU module
* Upload any file-types (binary save)
* Download any file-type (binary save)
* Delete files
* Format the file system
* Simple Serial Terminal to interact with NodeMCU
* Show existing files on your module
* Precompile LUA files live on NodeMCU
* Optimize LUA files before uploading by stripping comments (saves flash memory)
* Use the **NodeMcuConnector API** in your own projects
* Project based configurations
* Run files on NodeMCU and display the output

directly from the command line.

*Successful tested on Windows10, Debian 8.2 and Ubuntu 14 LTS - works out of the box without any tweaks*

Terminology
-----------
* **NodeMCU** Original [NodeMCU](http://nodemcu.com/index_en.html) Module **OR** any [ESP8266](http://espressif.com/en/products/esp8266/) platform with [NodeMCU Firmware](https://github.com/nodemcu/nodemcu-firmware)
* **Upload** Transfer files from your PC to NodeMCU/ESP8266 module
* **Download** Transfer files/obtaining information from the module

Installation/Requirements
-------------------------

### For Experienced Users ###

```shell
$ npm install nodemcu-tool
```

### For Beginners ###

In case you're not familiar with [Node.js](https://nodejs.org) and [NPM](https://www.npmjs.com) it's recommended to read some [basic introductions](https://docs.npmjs.com/getting-started/what-is-npm) first!

Depending on your Module-Type you have to install the platform-specific driver for the usb-serial-interface. 
The original NodeMCU v0.9 comes with a CH341 chip with may requires manual driver installation. Modern versions like 1.0 use a CP210x chip with work out of the box on most common systems.
Other ESP8266 platforms may user other interfaces - please refer to their user manuals!

* Install [Node.js](https://nodejs.org/en/download/) on your system (in case it's not already there)
* Open a Terminal window and install **NodeMCU-Tool** with NPM
  Local installation (within current directory): `npm install nodemcu-tool`
* Now you're ready to upload custom lua files

First Steps
-----------
After installing **NodeMCU-Tool** you should open a **new** terminal window and check if the tool is working by obtaining the current version. It should output the current semantic-version tag.
Depending on your installation type (global ==> file is registered into your path) you can use the tool directly or you have to go into the module directory:

### For Global Installations ###
```bash
$ nodemcu-tool --version
1.0.0
```

### For Local Installations ###
```bash
$ cd node_modules/nodemcu-tool/bin
$ ./nodemcu-tool --version
1.0.0
```

### Create the initial File System ###
This will remove all existing files on the module but is required when running the module **for the first time**

```shell
$ nodemcu-tool mkfs
[NodeMCU-Tool] Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Formatting the file system...this will take around ~30s
[NodeMCU] File System created | format done.
```

### Upload a new File ###

```shell
$ nodemcu-tool upload --port=/dev/ttyUSB0 --optimize helloworld.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "main.lua" ...
[NodeMCU-Tool] Data Transfer complete!
```

**Run It directly and view the output**

```shell
$ nodemcu-tool run helloworld.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Running "helloworld.lua"
>----------------------------->
Hello World!
YEAH!!! HELLO WORLD!!!
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
>----------------------------->
```

Project based configuration
---------------------------

In case you're using different serial port or the baudrate-settings, it's possible to create a configuration file with specific settings for your project.
To initially create the configuration file, use the `init` command:

```shell
$ nodemcu-tool init
[NodeMCU-Tool] Creating project based configuration file..
[NodeMCU-Tool] Baudrate in Bit per Seconds, e.g. 9600 (default) (9600) 9600
[NodeMCU-Tool] Serial connection to use, e.g. COM1 or /dev/ttyUSB2 (/dev/ttyUSB0) COM3
```

This will create a JSON based configuration file named `.nodemcutool` in your **current ddirectory** - you can edit this file manually

### Example Configuration ###

In this Example, the baudrate is changed to 19.2k and COM3 is selected as default port. Additionally the `--optimize` and `--compile` flags are set permanently.

```json
{
    "baudrate": "19200",
    "port": "COM3",
    "compile": true,
    "optimize": true
}
```
 
### Configuration Keys ###

All configuration options are **optional**

* **baudrate** (int) - the default baudrate in bits per second
* **port** (string) - the comport to use
* **compile** (boolean) - compile lua files after upload
* **optimize** (boolean) - optimize files before uploading
 
 
### Notes ###
  
* NodeMCU-Tool will only search in the **current directory** for the `.nodemcutool` file!
* All default options can be overwritten by using the command line options
* The `.nodemcutool` file is only recognized in `CLI Mode` **NOT** in `API Mode`

Usage
-----

#### General Syntax ####

```shell
$ nodemcu-tool [options] command [args..]
```

### Connection ###
To configure the connection settings you can use the global options `--port <port>` and `--baud <baudrate>` to select the serial port and baudrate.
The default values are **9600bps** as baudrate and **/dev/ttyUSB0** as serial device

**Example**

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --baudrate=115200 run test.lua
```

### Show Help ###
To get an overview of all available commands, just call the tool with the `--help` option.

**Example**

```shell
$ nodemcu-tool --help

  Usage: nodemcu-tool [options] [command]

  Commands:

    fsinfo                   Show file system info (current files, memory usage)
    run <file>               Executes an existing .lua or .lc file on NodeMCU
    upload [options] <file>  Upload LUA files to NodeMCU (ESP8266) target
    remove <file>            Removes a file from NodeMCU filesystem
    mkfs                     Format the SPIFFS filesystem - ALL FILES ARE REMOVED
    terminal                 Opens a Terminal connection to NodeMCU

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -p, --port <port>      Serial port device name e.g. /dev/ttyUSB0, COM1
    -b, --baud <baudrate>  Serial Port Baudrate in bps, default 9600
```

### Upload Files ###
The most important task of this tool: upload local files to the module. 

**Syntax** `nodemcu-tool [options] upload <local-filename>`

**Options**

* `--optimize` | Remove Comments, Whitespaces and empty lines from the file before upload
* `--compile`  | Compiles the uploaded .lua file into executable bytecode and removes the source .lua file (performance) 

**Example 1**

Upload and optimize the file "test.lua"

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --optimize --compile upload test.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "toolkit/test.lua" ...
[NodeMCU-Tool] Data Transfer complete!
[NodeMCU] compiling lua file..
[NodeMCU] Success
[NodeMCU] Original LUA file removed
```

**Example 2**

Upload and precompile a new main file

```shell
$ nodemcu-tool --compile upload main.lua
```

**Example 3**

Upload a text file.

```shell
$ nodemcu-tool upload HelloWorld.txt
```

### Download Files ###
To backup files or fetch recorded data, NodeMCU-Tool allows you to download these files from NodeMCU using the `download` command.
A file with the same name as the remote-file is created in the current working directory.

**Syntax** `nodemcu-tool [options] download <remote-filename>`

**Example**

```shell
$ nodemcu-tool download main.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Downloading "main.lua" ...
[NodeMCU-Tool] Data Transfer complete!
[NodeMCU-Tool] File "main.lua" created
```

### Delete Files ###
To delete files on your Module use the `remove` command

**Syntax** `nodemcu-tool [options] remove <remote-filename>`

**Example**

```shell
$ nodemcu-tool remove test.lua
$ nodemcu-tool remove test.lc
```

### File System Info ###
Maybe you want to retrieve the flash free space or get a list of all files stored in the SPIFFS

**Syntax** `nodemcu-tool [options] fsinfo`

**Example**

```shell
$ nodemcu-tool fsinfo
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Free Disk Space: 3339 KB | Total: 3346 KB
[NodeMCU] Files stored into Flash (SPIFFS)
          |- init.lua (871 Bytes)
          |- telnet-server.lc (784 Bytes)
          |- wifi.lc (988 Bytes)
          |- main.lua (255 Bytes)
          |- test.lc (264 Bytes)
          |- terminal-server.lc (852 Bytes)
          |- package.json (397 Bytes)
          |- LICENSE.md (1089 Bytes)
```

### Format the File System ###
To store file in the SPI Flash, the file system needs to be initialized. This have to be done **before uploading** any files to the modules.
Otherwise no file will be stored. This command also allows you to delete all files on the module.

**Syntax** `nodemcu-tool [options] mkfs`

**Example**

```shell
$ nodemcu-tool mkfs
[NodeMCU-Tool] Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Formatting the file system...this will take around ~30s
[NodeMCU] File System created | format done.
```

### Run/Execute Files ###
For testing purpose, you can execute uploaded scripts (lua, lc) with the tool and capture the output (the `dofile()` function is invoked).

**Syntax** `nodemcu-tool [options] run <remote-filename>`

**Example**

```shell
$ nodemcu-tool run test.lua
[NodeMcuConnector] Connecting..
[NodeMcuConnector] ONLINE. Fetching device data..
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Running "test.lua"
Hello World!
HELLO WORLD!!!
HEllo HEllo Hello
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
```

### Terminal Mode ###
**Notice - This Mode is currently experimental and may not work with all versions of node.js (tested with v4.2.3)**

The Terminal mode will open a direct serial connection to NodeMCU and passes all keyboard inputs to the module.
This allows you to interact with the module during development without the need of an additional serial terminal.
You can quit the terminal session by pressing `ctrl+c`

**Syntax** `nodemcu-tool [options] terminal`

**Example**

```shell
$ nodemcu-tool terminal
[SerialTerminal] Starting Terminal Mode - press ctrl+c to exit
dofile("test.lc")
Hello World!
HELLO WORLD!!!
HEllo HEllo Hello
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
> [SerialTerminal] Connection closed
```

Behind the Scene
----------------
Many beginners may ask how the tool is working because there is no binary interface documented like FTP to access files.

The answer is quite simple: **NodeMCU-Tool** implements a serial terminal connection to the Module and runs some command line based lua commands like file.open(), file.write() to access the filesystem. That's it!

Since Version 1.2 it's also possible to transfer **binary** files to your device. NodeMCU-Tool uses a hexadecimal encode/decoding to transfer the files binary save!
The required encoding (file downloads) / decoding (file uploads) functions are automatically uploaded on each operation.

Low Level API
-------------
It's possible to use the underlying "NodeMcuConnector" in your own projects to communicate with a NodeMCU based device.
For more details, take a look into the sources!

**Low Level Example**
Run `node.compile()` on NodeMCU and display the output

```js
var _connector = require('nodemcu-tool').Connector;

// create a new connector instance
var con = new _connector('/dev/ttyUSB4', 9600);

// open the serial connection
con.connect(function(err, response){
    // get version, flashid ... message
    console.log(response);
    
    // run a command on the LUA command line
    con.executeCommand('node.compile("testfile.lua");', function(err, echo, response){
        if (err){
            console.error('IO Error - ', err);
        }else{
            console.log(response);
        }
    });
});
```

FAQ
---

### The serial file transfer is pretty slow ###
By default, the serial connection uses a 9600 baud with 8N1 - this means maximal 960 bytes/s raw data rate.
Due to the limitations of a line-wise file upload, these maximal transfer rate cannot be reached, because every line has to be processed by the lua interpreter and NodeMCU-Tool is waiting for it's response.
It's recommended to use the `--optimize` flag to strip whitespaces before uploading

Any Questions ? Report a Bug ? Enhancements ?
---------------------------------------------
Please open a new issue on [GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues)

License
-------
NodeMCU-Tool is OpenSource and licensed under the Terms of [The MIT License (X11)](http://opensource.org/licenses/MIT). You're welcome to [contribute](https://github.com/AndiDittrich/NodeMCU-Tool/blob/master/CONTRIBUTE.md)!