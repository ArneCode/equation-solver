function solve_equation(part1, part2, searched) {

}

function reduce_token(token) {
  if (token.type == "op") {
    if (token.text == "+") {
      let val0 = reduce_token(token.val0)
      let val1 = reduce_token(token.val1)
      let diff = val0.kind.compare(val1.kind)
      if (diff == null) {
        if (val0.kind.length == 0) {
          let newVal = val0.val * val0.factor + val1.val * val1.factor
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
        }
      } else {
        return token
      }
    } else if (token.text == "*") {
      let val0 = reduce_token(token.val0)
      let val1
    }
  }
}
Array.prototype.compare = function(other) {
  let moreThis = []
  let moreOther = []
  for (let elt of this) {
    if (!other.includes(elt)) {
      moreThis.push(elt)
    }
  }
  for (let elt of other) {
    if (!this.includes(elt)) {
      moreOther.push(elt)
    }
  }
  if (moreThis.length > 0 || moreOther.length > 0)
    return {
      moreThis,
      moreOther
    };
  return null;
}

function token_to_text(token) {
  if (token.type.isOf(["num", "word"])) {
    return token.text
  } else if (token.type == "op") {
    return token_to_text(token.val0) + token.text + token_to_text(token.val1)
  } else if (token.type == "opChain") {
    let text = token_to_text(token.content[0].val0)
    token.content.map(elt => {
      text += elt.text + token_to_text(elt.val1)
    })
    return text
  } else if (token.type == "group") {
    return "(" + token_to_text(token.content) + ")"
  }
}
try {
let Tree=tokenize("1--*-1")
alert(Tree*";"+Tree.length)
  
  Tree=createSyntaxTree(Tree)[0]
  console.log(Tree)
  console.log(token_to_text(Tree))

} catch (e) {
  console.log(e.stack, e, e.message)
}