const _prompt = require('prompt');

// async prompt wrapper
function prompt(menu){
    return new Promise(function(resolve, reject){

        // user confirmation required!
        _prompt.start();
        _prompt.message = '';
        _prompt.delimiter = '';
        _prompt.colors = false;

        _prompt.get(menu, function (err, result){
            if (err){
                reject(err);
            }else{
                resolve(result);
            }
        });

    });
}

module.exports = prompt;