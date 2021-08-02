Array.prototype.clear = () => this.length = 0;

function format() {
    if (arguments.length == 0)
        return null;
    let str = arguments[0];
    for (let i = 1; i < arguments.length; i++) {
        let re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
}

const range = (start, end) => new Array(end - start).fill(start).map((el, i) => start + i);