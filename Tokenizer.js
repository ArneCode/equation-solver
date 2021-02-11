let NUM = "0123456789"
let NUMDOT = NUM + "."
let ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_"
let operandChars = "+*/^%&|."
let operands = [{
  text: "+",
  level: 0
}, {
  text: "*",
  level: 1
}, {
  text: "/",
  level: 2
}, {
  text: "^",
  level: 3
}, {
  text: "%",
  level: 3
}]
let parantheses = "()"
let braces = "{}"
function tokenize(text) {
  //alert("tokenizing... "+text)
  if(!(typeof text=="string")){
    throw new Error("input to tokenize must be a string, not"+text)
  }
  if(text==""){
    throw new Error("input to tokenize cannot be empty string")
  }
  //alert(text)
  let tokens = []
  let index = 0
  let curr_token = ""
  while (index < text.length) {
    if ((NUM+"-").includes(text[index])) {
      let numrx=RegExp(/^(\+|-)?\d+(\.\d+)?([eE](\+|-)?\d+)?/)
      //alert("substr: "+text.substr(index)+"\nindex: "+index)
      //numrx.exec(text.substr(index))
      let subtext=text.substr(index)
      let match=subtext.match(numrx)
      if(match){
      let numlength=match[0].length
      if(numlength>0){
        let numText=text.substr(index,numlength)
        let val=Number(numText)
        tokens.push({
        text: numText,
        val,
        type: "number",
        factor: 1
      })
        index+=numlength
        }
      }else{
        console.log("case 1")
        tokens.push({
          text:"-",
          type:"sign",
          factor:1
        })
        index++
      }
    } else if (ALPHA.includes(text[index])) {
      curr_token = text[index]
      while (index < text.length) {
        index++
        if ((ALPHA + NUM).includes(text[index])) {
          curr_token += text[index];
        } else {
          break;
        }
      }
      tokens.push({
        text: curr_token,
        type: "word",
        factor: 1
      })
      curr_token = ""
    } else if (operandChars.includes(text[index])) {
      curr_token = text[index]
      while (index < text.length) {
        index++
        if (operandChars.includes(text[index])) {
          if ("+-".includes(text[index]) && "+-".includes(text[index - 1])) {
            tokens.push({ text: curr_token, type: "op" })
            curr_token = ""
          }
          curr_token += text[index]
        } else {
          break
        }
      }
      tokens.push({
        text: curr_token,
        type: "op"
      })
      curr_token = ""
    } else if (parantheses.includes(text[index])) {
      tokens.push({
        text: text[index],
        type: "paranthese",
        factor: 1
      })
      index++;
    } else if (braces.includes(text[index])) {
      tokens.push({
        text: text[index],
        type: "brace",
        factor: 1
      });
      index++;
    } else if(text[index]=="±"){
      tokens.push({
        text:"±",
        type:"sign",
        factor:1,
        name:"plusminus"
      })
      index++
    }
    else {
      throw new Error(`error: unexpected character at index ${index}, character:${text[index]}`)
    }
  }
  for (let token of tokens) {
    if (token.type == "number") {
      token.val = Number(token.text)
    } else if (token.type == "op") {
      let op = operands.find(op => op.text == token.text)
      if (op != undefined) {
        token.level = op.level
      } else {
        throw new Error(`error at ${tokens.indexOf(token)}: operand ${token.text} is unknown`)
      }
    }
  }
  return tokens
}