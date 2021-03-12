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
  if (!(typeof text == "string")) {
    throw new Error("input to tokenize must be a string, not" + text)
  }
  if (text == "") {
    throw new Error("input to tokenize cannot be empty string")
  }
  //alert(text)
  let tokens = []
  let index = 0
  let curr_token = ""
  while (index < text.length) {
    if ((NUM).includes(text[index])) {
      let numrx = RegExp(/^(\+|-)?\d+(\.\d+)?([eE](\+|-)?\d+)?/)
      //alert("substr: "+text.substr(index)+"\nindex: "+index)
      //numrx.exec(text.substr(index))
      let subtext = text.substr(index)
      let match = subtext.match(numrx)
      if (match) {
        let numlength = match[0].length
        if (numlength > 0) {
          let numText = text.substr(index, numlength)
          let val = Number(numText)
          tokens.push({
            text: numText,
            val,
            type: "number",
            factor: 1,
            level:-1
          })
          index += numlength
        }
      }
    } else if ("[".includes(text[index])) {
      let unitName = ""
      let endFound = false
      index++
      for (index; index < text.length; index++) {
        if (text[index] == "]") {
          endFound = true
          index++
          break
        } else {
          unitName += text[index]
        }
      }
      if (endFound) {
        if (RegExp(/^[a-z]+$/i).test(unitName)) {
          tokens.push({
            text: "[" + unitName + "]",
            type: "unit",
            factor: 1,
            name: unitName
          })
        }
      } else {
        throw new Error("unmatching square Brackets")
      }
    } else if (text[index] == "\\") {
      let restString = text.substr(index + 1)
      if (restString.startsWith("sqrt")) {
        restString = restString.substr(4).trim()
        let exp = "2"
        if (restString[0] == "[") {
          let expEnd = restString.searchForCorres("[", "]")
          exp = restString.substring(1, expEnd)
          restString = restString.substr(expEnd + 1).trim()
        }
        if (restString[0] != "{") {
          throw new Error("Expression hasn't been defined right, expression: ", text)
        }
        let radikEnd = restString.searchForCorres("{", "}")
        let radik = restString.substring(1, radikEnd)
        restString = restString.substr(radikEnd + 1).trim()
        tokens.push({
          text: "\\sqrt",
          type: "root",
          radik,
          exp
        })
        index = text.length - restString.length
      }
    }
    else if (text[index] == "-") {
      tokens.push({
        text: "-",
        type: "sign",
        factor: 1,
        level:0
      })
      index++
    }
    else if (ALPHA.includes(text[index])) {
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
    }
    else if (operandChars.includes(text[index])) {
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
    }
    else if (text[index] == "±") {
      tokens.push({
        text: "±",
        type: "sign",
        factor: 1,
        name: "plusminus",
        level:0
      })
      index++
    }
    else {
      throw new Error(`error: unexpected character at index ${index}, character:${text[index]}, text:${text}`)
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
function latex_to_text(latex) {
  let text = latex
  let before = ""
  while (text != before) {
    before = text
    text = text.replace(/\\pm/g, "±")
    text = text.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    text = text.replace(/\\(left|right)([\[\]()])/g, "$2")
    text = text.replace(/\\cdot/g, "*")
    text = text.replace(/\^\{([^{}]*)\}/g, "^($1)")
  }
  return text
}
function token_to_latex(token, gReturn = false) {
  //console.log("token_to_latex",token_to_text(token))
  let text = ""
  if (token.type == "opChain") {
    let subTexts = []
    for (let subnode of token.content) {
      subTexts.push(token_to_latex(subnode))
    }
    text += subTexts.join(token.operand)
  } else if (token.type == "op") {
    if (token.name == "div") {
      let text0 = token_to_latex(token.val0, true)
      let text1 = token_to_latex(token.val1, true)
      text += `\\frac{${text0}}{${text1}}`
    } else if (token.name == "pow") {
      let text0 = token_to_latex(token.val0)
      let text1 = token_to_latex(token.val1, true)
      text += text0 + "^{" + text1 + "}"
    } else {
      text += token_to_text(token)
    }
  } else if (token.type == "group") {
    let cText = token_to_latex(token.content, true)
    if (gReturn) {
      return cText
    }
    text += "\\left(" + cText + "\\right)"
  } else if (["word", "unit", "number"].includes(token.type)) {
    text += token_to_text(token)
  } else if (token.type == "sign") {
    text += token.text + token_to_latex(token.val)
  }
  return text_to_latex(text)
}
function text_to_latex(text) {
  let before = ""
  while (before != text) {
    before = text
    text = text.replace(" \\pm ", "±")
    text = text.replace(/\*/g, " \\cdot ")
    text = text.replace(/((\\left)?)\(/g, "\\left(")
    text = text.replace(/((\\left)?)\[/g, "\\left[")
    text = text.replace(/((\\right)?)\)/g, "\\right)")
    text = text.replace(/((\\right)?)\]/g, "\\right]")
  }
  return text
}