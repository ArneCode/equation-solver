function solve_equation(part1, part2, searched) {
  if (part1.variables.includes(searched) && !part2.variables.includes(searched)) {
    [part1, part2] = isolate_stepwise(part1, part2, searched)
  } else if (part2.variables.includes(searched) && !part1.variables.includes(searched)) {
    [part1, part2] = isolate_stepwise(part2, part1, searched)
  }
  console.log({ part1, part2 })
  return { part1, part2 }
}
function isolate_stepwise(varPart, otherPart, searched) {
  console.log("isolate stepwise", arguments)
  let steps = []
  while (steps.length < 100) {
    //("test")
    let step = isolate_var_step(varPart, searched)
    steps.push(step)
    console.log("step:", step)
    switch (step.state) {
      case "finished": {
        return [varPart, otherPart]
      }
      case "isolating": {
        let newOtherPartText = step.prefix+"(" + token_to_text(otherPart) + step.action + ")"
        otherPart = parse(newOtherPartText)
        otherPart = reduce_token(otherPart)
        varPart = step.equation
        console.log({ newOtherPartText, otherPart, othertext: token_to_text(otherPart), varPart })
        break;
      }
    }
  }
}
function isolate_var_step(equation, searched) {
  equation = reduce_completely(equation)
  //alert("to isolate: " + token_to_text(equation))
  if (equation.type == "word" && equation.text == searched) {
    console.log("finished")
    return { state: "finished" }
  } else if (equation.type == "opChain") {
    let { content, name } = equation
    console.log("is opChain")
    for (let i = 0; i < content.length; i++) {
      let subnode = content[i]
      if (!subnode.variables.includes(searched)) {
        content.splice(i, 1)
        if (content.length == 1) {
          equation = content[0]
        }
        switch (name) {
          case "punkt": {
            console.log("is punkt")

            return {
              state: "isolating",
              action: "/" + token_to_text(subnode),
              equation,
              prefix:""
            }
            break;
          }
          case "plus": {
            return {
              state: "isolating",
              action: "-" + token_to_text(subnode),
              equation,
              prefix:""
            }
            break;
          }
        }
      }
    }
  } else if (equation.type == "op") {
    let val0 = equation.val0
    let val1 = equation.val1
    /*let varPart,otherPart
    if (val0.variables.includes(searched) && !val1.variables.includes(searched)) {
      varPart=val0
      otherPart=val1
    }
    else if (val1.variables.includes(searched) && !val0.variables.includes(searched)) {
      varPart=val1
      otherPart=val0
    }else if(val0.variables.includes(searched)&&val1.variables.includes(searched)){
      return {
        state:"limit"
      }
    }else{
      throw new Error("error in equation"+token_to_text(equation)+"\nThis equation does not include "+searched)
    }*/
    switch (equation.name) {
      case "pow": {
        if (val0.variables.includes(searched) && !val1.variables.includes(searched)) {
          return {
            state: "isolating",
            action: "^(1/" + token_to_text(val1) + ")",
            equation: val0,
            prefix:"±"
          }
        }
        else if (val1.variables.includes(searched) && !val0.variables.includes(searched)) {
          varPart = val1
          otherPart = val0
        }
        break;
      }
    }
  }
  else if (equation.type == "group") {
    return isolate_var_step(equation.content, searched)
  }
  else {
    console.log("equation:", { equation, searched })
  }
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
function groupWother(a, b, params/*{operandText,operandObj}*/) {
  a = reduce_token(a)
  b = reduce_token(b)
  let { operandObj, operandText } = params
  let group, other
  if (a.type == "group") {
    group = a
    other = b
  } else if (b.type == "group") {
    group = b
    other = a
  } else {
    return null
  }
  let gContent = group.content
  let otherText = token_to_text(other)
  if (gContent.level >= operandObj.level) {
    let newText = token_to_text(gContent) + operandText + otherText
    let newToken = parse(newText)
    newToken = reduce_token(newToken)
    return newToken
  } else if (!(other.name == "pow" && gContent.level == 0)) {
    let newTexts = []
    let content = []//subnodes of content in group
    if (gContent.type == "op") {
      content = [gContent.val0, gContent.val1]
    } else if (gContent.type == "opChain") {
      content = gContent.content
    }
    for (let subnode of content) {
      let text = token_to_text(subnode) + operandText + otherText
      newTexts.push(text)
    }
    let newText = newTexts.join(gContent.operand)
    let newToken = parse(newText)
    newToken = reduce_token(newToken)
    return newToken
  }
  return null
}

function reduce_token(token,mode="simplify") {
  //poss_modes:
  // - "expand":
  //    (a+3)^2 => a^2+6*a+9
  // - "simplyfy"
  //    2+2=4
  //    but NOT:
  //    (a+3)^2 => a^2+6*a+9 || a^2+6*a+9 => (a+3)^2
  // - "linearfactor"
  //    a^2+6*a+9 => (a+3)^2 //not implemented jet
  if (token.type == "op") {
    let val0 = token.val0 = reduce_token(token.val0)
    let val1 = token.val1 = reduce_token(token.val1)
    if (token.name == "pow") {
      if (val0.name == "pow") {
        let newBaseExpText = "(" + token_to_text(val0.val1) + "*" + token_to_text(val1) + ")"
        val0.val1 = reduce_token(parse(newBaseExpText))
        return val0
      } else if (val1.type == "number") {
        if (val0.type == "number") {
          let newVal = val0.val ** val1.val
          return parse(String(newVal))
        if (["group"].includes(val0.type)&&mode=="expand") {
          console.log("TEEEEEEEEESt")
          let gText = token_to_text(val0)
          let testTexts = new Array(Math.floor(val1.val)).fill(gText)
          let rest = val1.val % 1
          if (rest != 0) {
            testTexts.push(gText + "^" + rest)
          }
          let testText = testTexts.join("*")
          let testToken = parse(testText)
          testToken = reduce_token(testToken)
          console.log({ testText, testToken })
          if (testText != token_to_text(testToken)) {
            return testToken
          } else {
            return token
          }
        } else if (val1.val == 1) {
          return val0
        } else if (val1.val == 0) {
          return parse("1")
        }/*else if(val1.val<0){
          let newText=`(1/${token_to_text(val0)}^${Math.abs(val1.val)})`
          let newToken=parse(newText)
          newToken=reduce_token(newToken)
          return newToken
        }*/
      } else if (val0.type == "number") {
        if (val0.val == 1) {
          return parse("1")
        } else if (val0.val == 0) {
          return parse("0")
        }
      }
    } else if (token.name == "div") {
      let gwotherResult = groupWother(val0, val1, { operandText: token.operand, operandObj: token })
      if (gwotherResult) {
        return gwotherResult
      }
      if (token_to_text(val0) == token_to_text(val1)) {
        return parse("1")
      } else if (val0.type == "number" && val1.type == "number") {
        let newVal = val0.val / val1.val
        val0.val = newVal
        val0.text = String(newVal)
        return val0
      }
    }
  } else if (token.type == "number") {
    return token
  } else if (token.type == "opChain") {
    token.content = token.content.map(reduce_token)
    token.content.eachWeach(function (elt1, elt2, loop_info) {
      let { i1, i2, list, restart_loop } = loop_info
      let result = groupWother(elt1, elt2, { operandText: token.operand, operandObj: token })
      if (result) {
        list[i1] = result
        list.splice(i2, 1)
        return restart_loop()
      }
    })
    if (token.content.length == 1) {
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
      if (token.content.some(elt => elt.val == 0)) {
        return parse("0")
      }
      token.content.eachWeach(function (elt1, elt2, loop_info) {
        let info1 = getInfo(elt1)
        let info2 = getInfo(elt2)
        let { i1, i2, list, restart_loop } = loop_info
        if (elt1.name == "pow" && elt2.name == "pow") {
          let base1Text = token_to_text(elt1.val0)
          let base2Text = token_to_text(elt2.val0)
          if (base1Text == base2Text) {
            let newExpText = `(${token_to_text(elt1.val1)}+${token_to_text(elt2.val1)})`
            let newExp = parse(newExpText)
            newExp = reduce_token(newExp)
            elt1.val1 = newExp
            list.splice(i2, 1)
            return restart_loop()
          }
        }
        else if (elt1.name == "pow" || elt2.name == "pow") {
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
            let newText = "(" + token_to_text(elt1) + ")" + "^2"
            list[i1] = reduce_token(parse(newText))
            list.splice(i2, 1)
            return restart_loop
          }
        }
        else if (elt1.val == 1) {
          list[i1] = elt2
          list.splice(i2, 1)
          restart_loop()
        }
        else if (elt2.val == 1) {
          list.splice(i2, 1)
          restart_loop()
        }
        else if (elt1.name == "div" && elt2.name == "div") {
          let testText = `(${token_to_text(elt1.val0)}*${token_to_text(elt2.val0)})/(${token_to_text(elt1.val1)}*${token_to_text(elt2.val1)})`
          let testToken = parse(testText)
          testToken = reduce_token(testToken)
          if (token_to_text(testToken) != testText) {
            list[i1] = testToken
            list.splice(i2, 1)
            return restart_loop()
          }
        }
        else if (elt1.name == "div" || elt2.name == "div") {
          let div, other
          if (elt1.name == "div") {
            div = elt1
            other = elt2
          } else {
            div = elt2
            other = elt1
          }
          let testText = "(" + token_to_text(other) + "/" + token_to_text(div.val1) + ")"
          let testToken = parse(testText)
          testToken = reduce_token(testToken)
          if (token_to_text(testToken) != testText) {
            list[i1] = div.val0
            list[i2] = testToken
            return restart_loop()
          }
        }
      })
      if (token.content.length == 1) {
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
