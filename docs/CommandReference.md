Command Reference
===========================

### General Syntax ###

```shell
$ nodemcu-tool [options] command [args..]
```

## Connection ##
To configure the connection settings you can use the global options `--port <port>` and `--baud <baudrate>` to select the serial port and baudrate.
The default values are **115200bps** as baudrate and **/dev/ttyUSB0** as serial device

**Example**

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --baudrate=9600 run test.lua
```

## Show Help ##
To get an overview of all available commands, just call the tool with the `--help` option.

**Example**

```shell
$ nodemcu-tool --help

  Usage: nodemcu-tool [options] [command]


  Commands:

    fsinfo [options]             Show file system info (current files, memory usage)
    run <file>                   Executes an existing .lua or .lc file on NodeMCU
    upload [options] [files...]  Upload Files to NodeMCU (ESP8266) target
    download <file>              Download files from NodeMCU (ESP8266) target
    remove <file>                Removes a file from NodeMCU filesystem
    mkfs [options]               Format the SPIFFS filesystem - ALL FILES ARE REMOVED
    terminal [options]           Opens a Terminal connection to NodeMCU
    init                         Initialize a project-based Configuration (file) within current directory
    devices [options]            Shows a list of all available NodeMCU Modules/Serial Devices
    reset [options]              Execute a Hard-Reset of the Module using DTR/RTS reset circuit
    *

  Options:

    -h, --help                  output usage information
    -V, --version               output the version number
    -p, --port <port>           Serial port device name e.g. /dev/ttyUSB0, COM1
    -b, --baud <baudrate>       Serial Port Baudrate in bps, default 115200
    --silent                    Enable silent mode - no status messages are shown
    --connection-delay <delay>  Connection delay between opening the serial device and starting the communication

```

## Show connected NodeMCU Modules ##
To show a list of all connected NodeMCU Modules you can use the `devices` command. It will filter NodeMCU Modules by its USB VendorID

**Syntax** `nodemcu-tool [options] devices

**Options** 
  
  * `--all` | Show ALL connected serial devices, not only NodeMCU modules (filtered by USB vendorId)
  * `--json` | Outputs the device list as JSON Array, Status messages are rejected

**Example**

```shell
$ nodemcu-tool devices
[NodeMCU] Connected Devices | Total: 1
          |- /dev/ttyUSB0 (Silicon_Labs, usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0)
```

## Upload Files ##
The most important task of this tool: upload local files to the module. 

**Syntax** `nodemcu-tool [options] upload <local-filenames...>`

**Options**

* `--optimize` | Deprecated! - Remove Comments, Whitespaces and empty lines from the file before upload
* `--minify`   | Minifies the code before upload
* `--compile`  | Compiles the uploaded .lua file into executable bytecode and removes the source .lua file (performance)
* `--keeppath` | Keeps the relative file path in the destination filename (i.e: static/test.html will be named static/test.html)
* `--remotename` | Set the destination file name

**Example 1**

Upload and minify the file "test.lua"

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --minify --compile upload test.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "toolkit/test.lua" ...
[NodeMCU-Tool] Data Transfer complete!
[NodeMCU] compiling lua file..
[NodeMCU] Success
[NodeMCU] Original Lua file removed
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

**Example 4**

Upload a static file and keep its relative path as remote name.

```shell
$ nodemcu-tool upload static/hello.html --keeppath
```

The remote file name will be "static/hello.html"

**Example 5**

Relative parts of the local filename got removed - useful when having split your project into different party

```shell
$ nodemcu-tool upload ../../projectX/static/hello.html --keeppath
```

The remote file name will be "projectX/static/hello.html"

**Example 6**

Upload a text file and change its remote name.

```shell
$ nodemcu-tool upload HelloWorld.txt --remotename MyFile.txt
```

The remote file name will be "MyFile.txt"

**Example 7**

Upload multiple files to the module at once and compile Lua files. Non-existing files will be ignored!

```shell
$ nodemcu-tool upload helloworld.lua dev/f1.lua dev/f2.lua xxx.txt dev/f3.lua helloworld.lua test.lua --keeppath --compile
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "helloworld.lua" >> "helloworld.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- success
[NodeMCU]  |- original Lua file removed
[NodeMCU-Tool] Uploading "dev/f1.lua" >> "dev/f1.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Uploading "dev/f2.lua" >> "dev/f2.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Local file not found "xxx.txt" skipping...
[NodeMCU-Tool] Uploading "dev/f3.lua" >> "dev/f3.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Uploading "helloworld.lua" >> "helloworld.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Local file not found "test.lua" skipping...
[NodeMCU-Tool] Bulk File Transfer complete!
```


## Download Files ##
To backup files or fetch recorded data, NodeMCU-Tool allows you to download these files from NodeMCU using the `download` command.
A file with the same name as the remote-file is created in the current working directory - the path is dropped!

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

## Delete Files ##
To delete files on your Module use the `remove` command

**Syntax** `nodemcu-tool [options] remove <remote-filename>`

**Example**

```shell
$ nodemcu-tool remove test.lua
$ nodemcu-tool remove test.lc
```

## File System Info ##
Maybe you want to retrieve the flash free space or get a list of all files stored in the SPIFFS

**Syntax** `nodemcu-tool [options] fsinfo`

**Options** 

  * `--json` | Outputs the file list as JSON Array, Status messages are rejected

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

## Format the File System ##
To store file in the SPI Flash, the file system needs to be initialized. This have to be done **before uploading** any files to the modules.
Otherwise no file will be stored. This command also allows you to delete all files on the module.

**Syntax** `nodemcu-tool [options] mkfs`

**Options**
 
  * `--noninteractive` | Execute command without user interaction (dialog to confirm the formatting is disabled)

**Example**

```shell
$ nodemcu-tool mkfs
[NodeMCU-Tool] Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Formatting the file system...this will take around ~30s
[NodeMCU] File System created | format done.
```

## Run/Execute Files ##
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

## Reset the Module ##
Doing a hard-reset on modules which have an integrated reset circuit based on RTS/DST flowcontrol pins.
A soft-reset is also possible.  

**Syntax** `nodemcu-tool [options] reset`

**Options**
 
  * `--softreset` | Soft-Resets the module using the internal `node.restart()` command


**Example**

```shell
$ nodemcu-tool reset
[NodeMCU-Tool] Project based configuration loaded
[NodeMCU-Tool] Connected
[NodeMCU] Version: 1.5.1 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Hard-Reset executed (100ms)
```

## Terminal Mode ##

The Terminal mode will open a direct serial connection to NodeMCU and passes all keyboard inputs to the module.
This allows you to interact with the module during development without the need of an additional serial terminal.
You can quit the terminal session by pressing <kbd>ctrl+c</kbd>

**Syntax** `nodemcu-tool [options] terminal`

**Options**
 
  * `--run <filename>` | Executes a command on start of the terminal session - useful for testing/debugging

**Example 1**

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

**Example 2**
```shell
$ nodemcu-tool terminal --run helloworld.lua
[SerialTerminal] Starting Terminal Mode - press ctrl+c to exit
dofile("helloworld.lua")
Hello World!
|---|
| H |
| E |
| L |
| L |
| O |
| | |
| W |
| O |
| R |
| L |
| D |
|---|
YEAH!!! HELLO WORLD!!!
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
```
