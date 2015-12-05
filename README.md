NodeMCU-Tool
============
Upload LUA files to your ESP8266 module with NodeMCU firmware.

**Simple. Command Line. Cross-Platform. File Management. [NodeMCU](http://nodemcu.com/index_en.html).**

Summary
-------------
NodeMCU Tool allows you to

* Upload LUA files to your ESP8266/NodeMCU module
* Upload any text files
* Delete files
* Format the file system
* Show existing files on your module
* Precompile LUA files live on NodeMCU
* Optimize LUA files before uploading by stripping comments (saves flash memory)
* Run files on NodeMCU and display the output
* Simple Serial Terminal to interact with NodeMCU
directly from the command line.

*Successful tested on Windows10, Debian 8.2 and Ubuntu 14 LTS - works out of the box without any tweaks*

Terminology
-----------
* **NodeMCU** Original [NodeMCU](http://nodemcu.com/index_en.html) Module **OR** any [ESP8266](http://espressif.com/en/products/esp8266/) platform with [NodeMCU Firmware](https://github.com/nodemcu/nodemcu-firmware)
* **Upload** Transfer files from your PC to NodeMCU/ESP8266 module
* **Download** Transfer files/obtaining information from the module

Installation/Requirements
-------------------------

In case you're not familiar with [Node.js](https://nodejs.org) and [NPM](https://www.npmjs.com) it's recommended to read some [basic introductions](https://docs.npmjs.com/getting-started/what-is-npm) first!

Depending on your Module-Type you have to install the platform-specific driver for the usb-serial-interface. 
The original NodeMCU v0.9 comes with a CH341 chip with may requires manual driver installation. Modern versions like 1.0 use a CP210x chip with work out of the box on most common systems.
Other ESP8266 platforms may user other interfaces - please refer to their user manuals!

* Install [Node.js](https://nodejs.org/en/download/) on your system (in case it's not already there)
* Open a Terminal window and install **NodeMCU-Tool** with NPM 
...Global installation (root privileges): `npm install nodemcu-tool -g` (recommended)
...Local installation (within current directory): `npm install nodemcu-tool`
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
Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMcuConnector] Connecting..
[NodeMcuConnector] ONLINE. Fetching device data..
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0

[NodeMCU] Formatting the file system...this will take around ~30s

[NodeMCU] File System created | format done.
```

### Upload a new File ###

```shell
$ nodemcu-tool --port=/dev/ttyUSB0 --optimize upload main.lua
```

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

* `--optimize` | Remove Comments and empty lines from the file before upload
* `--compile`  | Compiles the uploaded .lua file into executable bytecode and removes the source .lua file (performance) 

**Example 1**

Upload and optimize the file "test.lua"

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --optimize upload test.lua
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
[NodeMcuConnector] Connecting..
[NodeMcuConnector] ONLINE. Fetching device data..
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0

[NodeMCU] Free Disk Space: 3343 KB | Total: 3346 KB
[NodeMCU] Files stored into Flash (SPIFFS)
 |- test.lc (264 Bytes)
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
Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMcuConnector] Connecting..
[NodeMcuConnector] ONLINE. Fetching device data..
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
Starting Terminal Mode - press ctrl+c to exit
st = "String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr"
> st = st..[[ hello]]
> print(st)
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr hello
>
Connection closed
```

Behind the Scene
----------------
Many beginners may ask how the tool is working because there is no binary interface documented like FTP to access files.
The answer is quite simple: **NodeMCU-Tool** implements a serial terminal connection to the Module and runs some command line based lua commands like file.open(), file.write() to access the filesystem. That's it!
Therefore keep attention to the following limitations:

### Limitations ###
* You cannot upload files over the serial connection with more than **235 characters per line**
* Your script must not use the string initialization sequence **[===[**

Any Questions ? Report a Bug ? Enhancements ?
---------------------------------------------
Please open a new issue on [GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues)

License
-------
NodeMCU-Tool is OpenSource and licensed under the Terms of [The MIT License (X11)](http://opensource.org/licenses/MIT). You're welcome to [contribute](https://github.com/AndiDittrich/NodeMCU-Tool/blob/master/CONTRIBUTE.md)!