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
function groupWother(a,b,params/*{operandText,operandObj}*/){
  a=reduce_token(a)
  b=reduce_token(b)
  let {operandObj,operandText}=params
  let group,other
  if(a.type=="group"){
    group=a
    other=b
  }else if(b.type=="group"){
    group=b
    other=a
  }else{
    return null
  }
  let gContent=group.content
  let otherText=token_to_text(other)
  if(gContent.level>=operandObj.level){
    let newText=token_to_text(gContent)+operandText+otherText
    let newToken=parse(newText)
    newToken=reduce_token(newToken)
    return newToken
  }else{
    let newTexts=[]
    let content=[]//subnodes of content in group
    if(gContent.type=="op"){
      content=[gContent.val0,gContent.val1]
    }else if(gContent.type=="opChain"){
      content=gContent.content
    }
    for(let subnode of content){
      let text=token_to_text(subnode)+operandText+otherText
      newTexts.push(text)
    }
    let newText=newTexts.join(gContent.operand)
    let newToken=parse(newText)
    newToken=reduce_token(newToken)
    return newToken
  }
  return null
}
function reduce_token(token) {
  //console.log("reducing...",token_to_text(token))
  if (token.type == "op") {
    let val0 = token.val0 = reduce_token(token.val0)
    let val1 = token.val1 = reduce_token(token.val1)
    let gwotherResult=groupWother(val0,val1,{operandText:token.operand,operandObj:token})
    if(gwotherResult){
      return gwotherResult
    }
    if(token.name=="pow"){
      if(val0.name=="pow"){
        let newBaseExpText="("+token_to_text(val0.val1)+"*"+token_to_text(val1)+")"
        val0.val1=reduce_token(parse(newBaseExpText))
        return val0
      }else if(val1.type=="number"){
        if(val0.type=="number"){
          let newVal=val0.val**val1.val
          return parse(String(newVal))
        }
      }
    }else if(token.name=="div"){
      if(token_to_text(val0)==token_to_text(val1)){
        return parse("1")
      }else if(val0.type=="number"&&val1.type=="number"){
        let newVal=val0.val/val1.val
        val0.val=newVal
        return val0
      }
    }
  } else if (token.type == "number") {
    return token
  } else if (token.type == "opChain") {
    token.content = token.content.map(reduce_token)
    token.content.eachWeach(function(elt1,elt2,loop_info){
      let {i1,i2,list,restart_loop}=loop_info
      let result=groupWother(elt1,elt2,{operandText:token.operand,operandObj:token})
      if(result){
        list[i1]=result
        list.splice(i2,1)
        return restart_loop()
      }
    })
    if(token.content.length==1){
      return token.content[0]
    }
    if (token.name == "plus") {

      token.content.eachWeach(function (elt1, elt2, loop_info) {

        /*let val1 = reduce_token(elt1)
        let val2 = reduce_token(elt2)*/
        let info1 = getInfo(elt1)
        let info2 = getInfo(elt2)

        //let diff = val1.kind.compare(val2.kind)
        if (info1.kind == info2.kind) {
          let newVal = info1.factor + info2.factor
          let newText = newVal + (info1.kind ? ("*" + info1.kind) : "")
          let { list, i1, i2, restart_loop } = loop_info
          list.splice(i2, 1)
          restart_loop()
          list[i1] = parse(newText)
        }
      })
      if (token.content.length == 1) {
        return token.content[0]
      }
      return token//nContent.join("+")[0]
    } else if (token.name == "punkt") {
      token.content.eachWeach(function (elt1, elt2, loop_info) {
        let info1 = getInfo(elt1)
        let info2 = getInfo(elt2)
        let { i1, i2, list, restart_loop } = loop_info

        if (elt1.name == "pow" || elt2.name == "pow") {
          let pow, other //pow ist the element in which exponentiation occurs
          //other is the other element
          if (elt1.name == "pow") {
            pow = elt1
            other = elt2
          } else {
            pow = elt2
            other = elt1
          }
          let powBaseText = token_to_text(pow.val0)
          let otherText = token_to_text(other)
          if (powBaseText == otherText) {
            if (pow.val1.type == "number") {
              let newText = `${powBaseText}^(${token_to_text(pow.val1)}+1)`
              list[i1] = reduce_token(parse(newText))
              list.splice(i2, 1)
              return restart_loop()
            }
          }
        } else if (info1.kind == info2.kind) {
          if (info1.kind == "") {
            let newVal = info1.factor * info2.factor
            list[i1] = tokenize(String(newVal))[0]
            list.splice(i2, 1)
            return restart_loop()
          } else {
            let newText = token_to_text(elt1) + "^2"
            list[i1] = parse(newText)
            list.splice(i2, 1)
            return restart_loop
          }
        }
      })
      if(token.content.length==1){
        return token.content[0]
      }
      return token
    }
  } else if (token.type == "group") {
    token.content = reduce_token(token.content)
    let { content } = token
    if (["number", "word", "group"].includes(content.type)) {
      return content
    }
  }
  return token
}
function getInfo(token) {

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
            info.kindObj = { type: "opChain", name: "punkt", content: content, operand: token.operand }
          }

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

function token_to_text(token) {
  //console.log("totext:", token)
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
