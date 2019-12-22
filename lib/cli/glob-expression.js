const _isGlob = require('is-glob');
const _glob = require('glob');
const _util = require('util');

// promisify glob
const _globResolver = _util.promisify(_glob);

async function expandExpression(args){

    // resolve glob expressions async
    const resolvedExpressions = await Promise.all(args.map( expr => {
        // glob expression ?
        if (_isGlob(expr)){

            // expand expression
            return _globResolver(expr, {});
        
        // passthrough (e.g. bash/zsh automatically expand glob expressions)
        }else{
            return Promise.resolve(expr);
        }
    }));

    // flatten array - Array.flat is only availble in Node.js >= 11
    return resolvedExpressions.reduce((aggregator, value) => {
        return aggregator.concat(value);
    }, []);
}

module.exports = {
    expand: expandExpression
}