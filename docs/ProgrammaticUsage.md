Use NodeMCU-Tool programmatically with 3rd Party Applications
=============================================================

Maybe you're working on an high-level application or make use of a deployment script and you want to use NodeMCU-Tool to manage the file transfer.

3rd Party Applications
----------------------

This means build systems like [ANT](http://ant.apache.org/) or python, php scripts for example.

### ANT Build Example ###

**Description** Download files to NodeMCU using ANT [exec task](https://ant.apache.org/manual/Tasks/exec.html)

**Example File** [apache-ant-build.xml](../examples/apache-ant-build.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>

<project name="test" default="build" basedir=".">
    <taskdef resource="net/sf/antcontrib/antcontrib.properties"/>

    <target name="build">
        <!-- Download Files to NodeMCU !-->
        <exec executable="node">
            <arg value="bin/nodemcu-tool.js" />
            <arg value="upload" />
            <arg value="helloworld.lua" />
        </exec>
    </target>
</project>
```

### Python Device-List Example ###

**Description** Process connected NodeMCU Devices

**Example File** [parse-devicelist.py](../examples/parse-devicelist.py)

```python
import subprocess
import json

# Capture Exception to handle the return_code
try:
    # Run NodeMCU-Tool to fetch a list of available devices
    output = subprocess.check_output(['node', '../bin/nodemcu-tool.js', 'devices', '--json'])

except subprocess.CalledProcessError as exc:
    print "NodeMCU-Tool Error: Code: ", exc.returncode, " - ", exc.output
    quit()

# Decode the json output
devices = json.loads(output)

# Check result
if len(devices) == 0:
    # Error, no devices
    print "No Devices found!"
    quit();

else:
    print "Possible NodeMCU Devices found:"

    # Output Device List
    for device in devices:
        print ">>", device["vendorId"], "(", device["pnpId"], ") on",  device["comName"]
```

### PHP File-List Example ###

**Description** Fetch file-list from NodeMCU Module

**Example File** [parse-filelist.php](../examples/parse-filellist.php)

```php
// List of arguments
$args = array(
    // the application file
    'bin/nodemcu-tool.js',

    // the command
    'fsinfo',

    // json output mode
    '--json'
);

// For Security - escape the shell args (not necessary in this example, but required for dynamic input)
$args = array_map(function($param){
    return escapeshellarg($param);
}, $args);

// build the command string - don't forget to add the node.js binary!
$command = 'node ' . implode(' ', $args);

// run the command
exec($command, $output, $return_var);

// command failed ?
if ($return_var !== 0){
    // show status code
    die('Program Error '. $return_var);
}

// decode json data - keep in mind that $output is an array (line-wise)
$data = json_decode(implode("\n", $output), true);

// process the output
foreach ($data['files'] as $file){
    echo '>> ', $file['name'], ' - ', $file['size'], "\n";
}
```


Node.js based Application
------------------------------

It's possible to use the underlying "NodeMcuConnector" in your own Node.js projects to communicate with a NodeMCU based device.
For more details, take a look into the [sources](https://github.com/AndiDittrich/NodeMCU-Tool/tree/master/lib)!

### Low Level Connector Example ###

**Description** Run `node.compile()` on NodeMCU and display the output

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