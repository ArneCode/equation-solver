//Nützliche Helferfunktionen, haben nicht umbedingt etwas mit dem Rechner zu tun

const range = (start, stop, step) => Array.from({
  length: (stop - start) / step + 1
}, (_, i) => start + (i * step)); //from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from


function concatRegex(regex1, regex2) { //code from https://stackoverflow.com/a/185529
  let flags = (regex1.flags + regex2.flags).split("").sort().join("").replace(/(.)(?=.*\1)/g, "")
  return new RegExp(regex1.source + regex2.source, flags);
}
String.prototype.isOf = function (arr) {
  for (let e of arr) {
    if (this == e) {
      return true
    }
  }
  return false
}
//map is from https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


function numToAlpha(n) {
  return (Math.floor(n / 26) + 10).toString(36) + ((n % 26) + 10).toString(36)
}

function alphaToNum(alpha) {
  alpha = alpha.split("")
  return (parseInt(alpha[0], 36) - 10) * 26 + parseInt(alpha[1], 36) - 10
}
String.prototype.searchForCorres = function (open, close, start = 0) {
  let index = start
  let level = 0
  let corres = -1
  let rechnung = this
  while (corres < 0 && index < rechnung.length) {
    if (rechnung[index] == open) {
      level++
    } else if (rechnung[index] == close) {
      level--
      if (level == 0) {
        return index
      }
    }
    index++
  }
  return corres
}

function toFile(data) {
  window.open("data:application/octet-stream," + encodeURIComponent(data), "funcdata")
}

Math.radians = function (degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function (radians) {
  return radians * 180 / Math.PI;
};

function HSVtoRGB(h, s, v) { //from https://stackoverflow.com/a/17243070
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      r = v, g = t, b = p;
      break;
    case 1:
      r = q, g = v, b = p;
      break;
    case 2:
      r = p, g = v, b = t;
      break;
    case 3:
      r = p, g = q, b = v;
      break;
    case 4:
      r = t, g = p, b = v;
      break;
    case 5:
      r = v, g = p, b = q;
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}
Array.prototype.eachWeach = function (f) {

  let nlist = new Array()
  let restart
  let restart_func = function(val = true){restart = val}
  for (let i1 = 0; i1 < this.length; i1++) {
    restart = true
    while (restart) {
      restart = false
      for (let i2 = i1 + 1; i2 < this.length; i2++) {
        let elt1 = this[i1]
        let elt2 = this[i2]

        nlist[i1] = f(elt1, elt2,{i1,i2,list:this,restart_loop:restart_func})
      }
    }
  }
  return nlist
}
String.prototype.hashCode = function () {
  //from https://stackoverflow.com/a/7616484
  let hash = 0, i, chr;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
function clone_entirely(obj){
  let clone=obj.constructor()
  if(!["object","array"].includes(typeof obj)){
    return obj
  }
  for(let attr in obj){
    clone[attr]=clone_entirely(obj[attr])
  }
  return clone
}
Array.prototype.compare = function (other) {
  let moreThis = []
  let moreOther = []
  let same = []
  for (let elt of this) {
    if (!other.includes(elt)) {
      moreThis.push(elt)
    } else {
      same.push(elt)
    }
  }
  for (let elt of other) {
    if (!this.includes(elt)) {
      moreOther.push(elt)
    }
  }
  if (moreThis.length > 0 || moreOther.length > 0) {
    return {
      diff0: moreThis,
      diff1: moreOther,
      same
    };
  }
  return null;
}