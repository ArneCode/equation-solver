function solve_equation(part1, part2, searched) {

}
function tokensBelowLevel(token, level) {
  let tokens = []
  if (token.type == "opChain") {
    for (let elt of token.content) {
      if (elt.level < level) {
        tokens = tokens.concat(tokensBelowLevel(elt, level))
      }
    }
    return tokens
  } else {
    return [token]
  }

}
function GroupWOther(group, other, action, level, position) { //multiplies Group and something else
  let otherText = token_to_text(other)
  let content = group.content
  let tokens = tokensBelowLevel(content, level)
  let text = ""
  for (let token of tokens) {
    let tokenText = token_to_text(token)
    if (position == "after") {
    }
  }
  if (content.type == "opChain") {
    if (content.name == "plus") {
      let texts = []
      texts.push(token_to_text(content.content[0].val0))
      for (let elt of content.content) {
        texts.push(token_to_text(content.content[0].val1))
      }
      for (let text of texts) {
        text = otherText + "*" + text
      }
      let text = texts.join("+")
      let newTree = createSyntaxTree(tokenize(text))
      return newTree
    } else {
      let text = token_to_text(content)
      text += "*" + otherText
      let newTree = createSyntaxTree(tokenize(text))
      return newTree
    }
  }
}

function reduce_token(token) {
  console.log("reducing...", token)
  if (token.type == "op") {
    if (token.text == "+") {
      let val0 = reduce_token(token.val0)
      let val1 = reduce_token(token.val1)
      let info0 = getInfo(val0)
      let info1 = getInfo(val1)
      //let diff = val0.kind.compare(val1.kind)
      if (info1.kind == info0.kind) {
        if (info0.kind.length == 0) {
          let newVal = val0.val + val1.val
          token.val = newVal
          token.kind = []
          return token
        } else {
          /*let newFactor = val0.factor + val1.factor
          let newToken = val0.kind.join("*")
          newToken = tokenize(newToken)
          newToken = createSyntaxTree(newToken)
          newToken.factor = newFactor
          return newToken*/

        }
      } else {
        return token
      }
    } else if (token.text == "*") {
      let val0 = reduce_token(token.val0)
      let val1 = reduce_token(token.val1)
      if (val0.type == "number") {

      }
    }
  } else if (token.type == "number") {
    return token
  } else if (token.type == "opChain") {
    console.log("is opchain", token)
    if (token.name == "plus") {
      console.log("is plus", token)
      let nContent = token.content.eachWeach(function (elt1, elt2) {
        console.log("in f", { elt1, elt2 })
        /*let val1 = reduce_token(elt1)
        let val2 = reduce_token(elt2)*/
        let info1 = getInfo(elt1)
        let info2 = getInfo(elt2)
        console.log({  info1, info2 })
        //let diff = val1.kind.compare(val2.kind)
        if (info1.kind == info2.kind) {
          /*
          if (info1.kind.length == 0) {
            let newVal = val1.val + val2.val
            token.val = newVal
            token.kind = []
            return token
          } else {
            let newFactor = val0.factor + val1.factor
            let newToken = val0.kind.join("*")
            newToken = tokenize(newToken)
            newToken = createSyntaxTree(newToken)
            newToken.factor = newFactor
            return newToken
          }*/
          let newVal = info1.factor + info2.factor
          let newText = newVal + "*" + info1.kind
          console.log({ newText })
          return newText
        } else {
          return token_to_text(token)
        }
      })
      console.log({nContent})
      return createSyntaxTree(tokenize(nContent.join("+")))[0]
    }
  }
  return token
}
function getInfo(token) {
  console.log("requesting info about:",token)
  let info = {}
  if (token.type == "opChain") {
    let content = [...token.content]
    if (token.name = "punkt") {
      for (let i = 0; i < content.length; i++) {
        let subnode = content[i]
        if (subnode.type == "number") {
          content.splice(i, 1)
          info.factor = subnode.val
          if (content.length == 1) {
            info.kindObj = content[0]
          } else {
            info.kindObj = { type: "opChain", name: "punkt", content: content }
          }
          console.log({kinfObj:info.kindObj})
          info.kind = token_to_text(info.kindObj)
          return info
        }
      }
    }
  } else if (token.type == "number") {
    return {
      factor: token.val,
      kind: ""
    }
  }
  return { factor: 1, kindObj: token, kind: token_to_text(token) }
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
function token_to_text(token) {
  console.log("to text:",token)
  if (token.type.isOf(["number", "word"])) {
    return token.text
  } else if (token.type == "op") {
    return token_to_text(token.val0) + token.operand + token_to_text(token.val1)
  } else if (token.type == "opChain") {
    let text = token.content.map(elt => token_to_text(elt))
    text = text.join(token.operand)
    return text
  } else if (token.type == "group") {
    return "(" + token_to_text(token.content) + ")"
  }
}
function start() {
  try {
    let Tree = tokenize("2*b+1*b")
    Tree = createSyntaxTree(Tree)[0]
    console.log(Tree)
    console.log("token to text:", token_to_text(Tree))
    //console.log("info:", getInfo(Tree))
    console.log("result:", token_to_text(reduce_token(Tree)))
    //console.log("variables:",variablesInBlock(Tree))
  } catch (e) {
    console.log(e.stack, e, e.message)
  }
}