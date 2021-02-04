function indexWhereOpLevel(tokens, level) {
  //gives back indexes of tokens whose level=level
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
  }

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

function handleSyntaxOp(tokens, level, name, doChain = false) {
  let tokenIndexes = indexWhereOpLevel(tokens, level)
  let indexOff = 0
  let opChain = []
  for (let indexI =0;indexI<tokenIndexes.length;indexI++) {
    indexI = Number(indexI)
    let tokenIndex = tokenIndexes[indexI] - indexOff
    let token = tokens[tokenIndex]
    let val0 = tokens[tokenIndex - 1]
    let val1 = tokens[tokenIndex + 1]
    let nextOpIndex = tokenIndexes[indexI + 1] - indexOff
    let newObj = {
      name,
      val0,
      val1,
      type: "op",
      text: token.text
    }

    if (nextOpIndex == tokenIndex + 2 && doChain) {
      opChain.push(newObj)
    } else if (opChain.length > 0 && doChain) {
      opChain.push(newObj)

      let chainStart = 1 + tokenIndex - opChain.length * 2
      let chainLength = 1 + opChain.length * 2
      newObj = {
        name,
        type: "opChain",
        content: opChain
      }
      tokens.splice(chainStart, chainLength, newObj)

      indexOff += opChain.length
      opChain = []
    } else {
      tokens.splice(tokenIndex - 1, 3, newObj)
      indexOff += 2
    }
  }
}

function createSyntaxTree(tokens, level = 4) {
  //console.log("got", tokens)
  if (level == 2) {
    let tokenIndexes = []
    //implementing sign
    for (let i =0;i< tokens.length;i++) {
      if (tokens[i].type == "op") {
        if (tokens[i].level == 0) {
          tokenIndexes.push(i);
        }
      }
    }
    let indexOff = 0

    let additionList = []
    for (let indexI=0 ;indexI<tokenIndexes.length;indexI++) {
      let tokenIndex = tokenIndexes[indexI] - indexOff
      let nextToken = tokens[tokenIndex + 1]
      let operand = tokens[tokenIndex]
      if(nextToken.type!="op"){
      if(operand.text=="-"){
        nextToken.val*=-1
        if(nextToken.text[0]=="-"){
nextToken.text=nextToken.text.substr(1)
}else{
nextToken.text="-"+nextToken.text
}
}}else{
  if(operand.text=="-"){
nextToken.text=nextToken.text=="+"?"-":"+"
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
    while (tokenIndexes.length>0&& iter < maxIter) {
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
            throw "unmatching Brackets0"
          }
        } else {
          throw "unmatching Brackets1"
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
    handleSyntaxOp(tokens, 2, "pow")

  }
  if (level == 1) {
    handleSyntaxOp(tokens, 1, "punkt", true)
  }
  if (level == 0) {
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
  if (level > 0)
    return createSyntaxTree(tokens, level - 1)
  else
    variablesInBlock(tokens[0])
  return tokens
}