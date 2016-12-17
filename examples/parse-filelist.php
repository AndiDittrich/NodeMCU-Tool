<?php

// Example how to fetch the File-List from NodeMCU Module using the NodeMCU-Tool

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