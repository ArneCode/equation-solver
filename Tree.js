function indexWhereOpLevel(tokens, level) {
  //gives back indexes of tokens whose level==level given as parameter
  let indexes = []
  for (let i in tokens) {
    if (tokens[i].type == "op") {
      if (tokens[i].level == level) {
        indexes.push(Number(i))
      }
    }
  }
  return indexes
}
function tokenPosVal(token) {
  if (token.type == "number") {
    return 0
  }
  return Math.abs(token_to_text(token).hashCode())
}
function variablesInBlock(token) {
  let variables = []
  if (token.type == "op") {
    let var0 = variablesInBlock(token.val0)
    let var1 = variablesInBlock(token.val1)
    variables = variables.concat(var0, var1)
  } else if (token.type == "opChain") {
    for (let c of token.content) {
      variables = variables.concat(variablesInBlock(c))
    }
  } else if (token.type == "group") {
    variables = variables.concat(variablesInBlock(token.content))
  } else if (token.type == "word") {
    variables = [token.text]
  } else if (token.type == "sign") {
    variables = variables.concat(variablesInBlock(token.val))
  }
  variables = variables.filter((v, idx) => variables.indexOf(v) == idx)
  token.variables = variables
  return variables
}
function indexWhereType(tokens, type) {
  let indexes = []
  for (let i in tokens) {
    if (tokens[i].type == type) {
      indexes.push(Number(i))
    }
  }
  return indexes
}
function handleSyntaxOp(tokens, level, name, doChain = false, reversed = false) {
  let tokenIndexes = indexWhereOpLevel(tokens, level)
  let indexOff = 0
  let opChain = []
  for (let indexI = 0; indexI < tokenIndexes.length; indexI++) {
    let tokenIndex = tokenIndexes[indexI] - indexOff
    let token = tokens[tokenIndex]
    if (doChain) {
      let valBefore = tokens[tokenIndex - 1]
      let valAfter = tokens[tokenIndex + 1]
      let nextOpIndex = tokenIndexes[indexI + 1] - indexOff
      opChain.push(valBefore)
      if (nextOpIndex != tokenIndex + 2 || tokens[nextOpIndex].text != token.text) {
        let chainStart = 1 + tokenIndex - opChain.length * 2
        let chainLength = 1 + opChain.length * 2
        opChain.push(valAfter)
        opChain = opChain.sort((a, b) => tokenPosVal(a) - tokenPosVal(b))
        newObj = {
          name,
          type: "opChain",
          content: opChain,
          operand: token.text,
          level: token.level
        }
        tokens.splice(chainStart, chainLength, newObj)
        indexOff += chainLength - 1
        opChain = []
      }
    } else {
      let val0 = tokens[tokenIndex - 1]
      let val1 = tokens[tokenIndex + 1]
      let newObj = {
        val0,
        val1,
        name,
        type: "op",
        operand: token.text,
        level: token.level
      }
      tokens.splice(tokenIndex - 1, 3, newObj)
      indexOff += 2
    }
  }
}
function handleOpReversed(tokens, level, name) {
  let tokenIndexes = indexWhereOpLevel(tokens, level)
  //let indexOff = 0
  for (let indexI = tokenIndexes.length - 1; indexI >= 0; indexI--) {
    let tokenIndex = tokenIndexes[indexI]// + indexOff
    let token = tokens[tokenIndex]
    let val0 = tokens[tokenIndex - 1]
    let val1 = tokens[tokenIndex + 1]
    let newObj = {
      val0,
      val1,
      name,
      type: "op",
      operand: token.text,
      level: token.level
    }
    tokens.splice(tokenIndex - 1, 3, newObj)
    //indexOff += 2
  }
}
function createSyntaxTree(tokens, level = 4) {
  if (level == 2) {
    let tokenIndexes = []
    //implementing sign
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type == "op") {
        if (tokens[i].level == 0) {
          tokenIndexes.push(i);
        }
      }
    }
    let indexOff = 0
    let additionList = []
    for (let indexI = 0; indexI < tokenIndexes.length; indexI++) {
      let tokenIndex = tokenIndexes[indexI] - indexOff
      let nextToken = tokens[tokenIndex + 1]
      let operand = tokens[tokenIndex]
      if (!["op", "opChain"].includes(nextToken.type)) {
        if (operand.text == "-") {
          nextToken.val *= -1
          if (nextToken.text[0] == "-") {
            nextToken.text = nextToken.text.substr(1)
          } else {
            nextToken.text = "-" + nextToken.text
          }
        }
      } else {
        if (operand.text == "-") {
          nextToken.text = nextToken.text == "+" ? "-" : "+"
        }
      }
      tokens.splice(tokenIndex, 1)
      indexOff++
    }
  }
  if (level == 4) {
    let tokenIndexes = indexWhereType(tokens, "paranthese")
    let maxIter = tokenIndexes.length
    let iter = -1
    while (tokenIndexes.length > 0 && iter < maxIter) {
      iter++
      for (let indexI in tokenIndexes) {
        indexI = Number(indexI)
        let tokenIndex = tokenIndexes[indexI]
        let token = tokens[tokenIndex]
        let nextTokenIndex = tokenIndexes[indexI + 1]
        let nextToken = tokens[nextTokenIndex]
        if (token.text == "(") {
          if (nextToken) {
            if (nextToken.text == ")") {
              let newToken = {
                type: "group",
                content: null,
                factor: 0
              }
              let inbetween = tokens.splice(tokenIndex, (nextTokenIndex + 1) - tokenIndex, newToken)
              newToken.content = createSyntaxTree(inbetween.slice(1, -1))[0]
              tokenIndexes = indexWhereType(tokens, "paranthese")
              break;
            }
          } else {
            throw new Error("unmatching Brackets0")
          }
        } else {
          throw new Error("unmatching Brackets1")
        }
      }
    }
    if (tokenIndexes.length != 0) {
      throw {
        message: "unmatching Brackets2",
        tokenIndexes
      }
    }
  }
  if (level == 3) {
    handleSyntaxOp(tokens, 3, "pow")
  }
  if (level == 0) {
    handleSyntaxOp(tokens, 1, "punkt", true)
  }
  if (level == 1) {
    handleOpReversed(tokens, 2, "div")
  }
  if (level == -1) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type == "sign") {
        let nextToken = tokens[i + 1]
        if (nextToken) {
          tokens.splice(i, 2, {
            text: tokens[i].text,
            val: nextToken,
            type: "sign"
          })
        } else {
          throw new Error("Expected token after sign, but got nothing")
        }
      }
    }
    let i = 0
    while (i < tokens.length) {
      if (tokens[i + 1]) {
        tokens.splice(i + 1, 0, {
          text: "+",
          level: 0,
          type: "op"
        })
      }
      i += 2
    }
    handleSyntaxOp(tokens, 0, "plus", true)
  }
  if (level >= 0) {
    return createSyntaxTree(tokens, level - 1)
  }
  else {
    variablesInBlock(tokens[0])
    return tokens
  }
  //alert("test")
}
function parse(text) {
  text = cleanSigns(text)
  let tokens = tokenize(text)
  let Tree = createSyntaxTree(tokens)[0]
  return Tree
}
function parse_equation(text) {
  if (!text.includes("=")) {
    text += "=0"
  }
  text = text.replace(/\s/g, "")
  let [part1Text, part2Text] = text.split("=")
  let part1 = parse(part1Text)
  let part2 = parse(part2Text)
  return { part1, part2 }
}
function cleanSigns(text) {
  let before = ""
  while (text != before) {
    before = text
    text = text.replace(/\-\-/, "+")
    text = text.replace(/\++/, "+")
    text = text.replace(/(\+\-|\-\+)/, "-")
  }
  return text
}