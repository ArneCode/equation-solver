function solve_equation(part1, part2, searched) {

}
function tokensBelowLevel(token,level){
let tokens=[]
if(token.type=="opChain"){
for(let elt of token.content){
if(elt.level<level){
tokens=tokens.concat(tokensBelowLevel(elt,level))
}
}
  return tokens
}else{
  return [token]
}
  
}
function GroupWOther(group, other,action,level,position) { //multiplies Group and something else
  let otherText = token_to_text(other)
  let content = group.content
  let tokens=tokensBelowLevel(content,level)
let text=""
  for(let token of tokens){
    let tokenText=token_to_text(token)
    if(position=="after"){
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
  if (token.type == "op") {
    if (token.text == "+") {
      let val0 = reduce_token(token.val0)
      let val1 = reduce_token(token.val1)
      let diff = val0.kind.compare(val1.kind)
      if (diff == null) {
        if (val0.kind.length == 0) {
          let newVal = val0.val + val1.val
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
      let val1 = reduce_token(token.val1)
      if (val0.type == "num") {

      }
    }
  }
}
Array.prototype.compare = function(other) {
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
  let Tree = tokenize("2*3*1/a")

  Tree = createSyntaxTree(Tree)[0]
  console.log(Tree)
  console.log(token_to_text(Tree))

} catch (e) {
  console.log(e.stack, e, e.message)
}