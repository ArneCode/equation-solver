let NUM = "0123456789"
let NUMDOT = NUM + "."
let ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_"
let operandChars = "+-*/^%&|."
let operands = [{
  text: "+",
  level: 0
}, {
  text: "-",
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
  if(!(typeof text=="string")){
    throw new Error("input to tokenize must be a string, not"+text)
  }
  if(text==""){
    throw new Error("input to tokenize cannot be empty string")
  }
  //alert(text)
  //console.log("tokenizing:",text)
  let tokens = []
  let index = 0
  let curr_token = ""
  while (index < text.length) {
    if (NUM.includes(text[index])) {
      //alert(text[index])
      curr_token = text[index]
      while (index < text.length) {
        index++
        if (NUMDOT.includes(text[index])) {
          curr_token += text[index]
        } else {
          break
        }
      }
      if (text[index - 1] == ".") {
        index--
        curr_token = curr_token.substr(0, curr_token.length - 1)
      }
      tokens.push({
        text: curr_token,
        type: "number",
        factor: 1
      })
      //  alert("["+tokens+"]")
      //alert(tokens.length)
      curr_token = ""
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
    } else {
      throw `error: unexpected character at index ${index}, character:${text[index]}`
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
        throw (`error at ${tokens.indexOf(token)}: operand ${token.text} is unknown`)
      }
    }
  }
  return tokens
}