Array.prototype.clear = function () { this.length = 0; }

Array.prototype.removeAt = function (index) { this.splice(index, 1); }

const range = (start, end) => new Array(end - start).fill(start).map((el, i) => start + i);

function getHashCode(str, caseSensitive = false) {
    if (!caseSensitive) {
        str = str.toLowerCase();
    }
    let hash = 1315423911;
    for (let i = str.length - 1; i >= 0; i--) {
        hash ^= ((hash << 5) + str.charCodeAt(i) + (hash >> 2));
    }
    return (hash & 0x7FFFFFFF);
}