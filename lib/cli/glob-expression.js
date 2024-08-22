const _isGlob = require('is-glob');
const _glob = require('glob');

async function expandExpression(args){

    // resolve glob expressions async
    const resolvedExpressions = await Promise.all(args.map( expr => {
        // glob expression ?
        if (_isGlob(expr)){

            // expand expression
            return _glob(expr, {});
        
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