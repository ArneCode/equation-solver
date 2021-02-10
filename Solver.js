function solve_equation(part1, part2, searched) {
  part1 = reduce_completely(part1)
  part2 = reduce_completely(part2)
  if(!(part1.variables.includes(searched)||part2.variables.includes(searched))){
    throw new InformationError(`there wasn't enough information given to find variable ${searched}`)
  }
  let solutions = trySolvingTactics(part1, part2, searched)
  console.log("solutions:", solutions)
  for (let i = 0; i < solutions.length; i++) {
    let solution = solutions[i]
    console.log("solution:", solution)
    if (solution.includes("±")) {
      let plusVariant = solution.replace("±", "+")
      let minusVariant = solution.replace("±", "-")
      solutions.push(plusVariant)
      solutions.push(minusVariant)
      solutions.splice(i, 1)
      i--
    }
  }
  let finalSolutions = []
  for (let solution of solutions) {
    try {
      let token = parse(solution)
      token = reduce_completely(token)
      finalSolutions.push(token_to_text(token))
    } catch (err) {
      if (err.constructor == NegativeRootError) {
        continue;
      } else {
        throw err
      }
    }
  }
  finalSolutions = finalSolutions.filter((elt, idx) => finalSolutions.indexOf(elt) == idx)
  //console.log({ part1, part2 })
  return finalSolutions
}
function trySolvingTactics(part1, part2, searched) {
  part1 = reduce_completely(part1)
  part2 = reduce_completely(part2)
  let result
  console.log("1")
  if (part1.variables.includes(searched) && !part2.variables.includes(searched)) {
    [part1, part2] = isolate_stepwise(part1, part2, searched)
  } else if (part2.variables.includes(searched) && !part1.variables.includes(searched)) {
    [part1, part2] = isolate_stepwise(part2, part1, searched)
  }
  if (part1.text == searched) {
    if (!part2.variables.includes(searched)) {
      console.log("finished solution:", part2)
      return [token_to_text(part2)]
    }
  }
  result = mitternachtsformel(part1, part2, searched)
  if (result.length > 0) {
    return result
  }
}
function mitternachtsformel(part1, part2, searched) {
  console.log("inside of midnigt formula", { searched })
  let expression = all_one_side(part1, part2).newPart1
  console.log("expression:", { expression })
  expression = reduce_completely(expression, "expand")
  let parts = getCoefficients(expression, searched)
  console.log("coefficients of midnight formula", parts)
  if (parts.length == 0) {
    console.log("midnight parts length 0", clone_entirely(parts))
    return []
  }
  console.log("midnight test 1")
  let ks = new Array(3).fill("0")
  for (let part of parts) {
    console.log("midnight test 2", { part })
    if (isInt(part.exp)) {
      let n = Number(part.exp)
      if (n < 0 || n > 2) {
        return []
      } else {
        ks[n] = part.k
      }
    } else {
      console.log("is not int", part.exp)
      return []
    }
  }
  console.log("midnight ks", ks)
  let [c, b, a] = ks //^0, ^1, ^2s
  let solution = `(-${b}±((${b})^2-4*${a}*${c})^0.5)/(2*${a})`
  console.log("solution after midnight formula: ", solution)
  return [solution]
}
function getCoefficients(token, searched) {
  //coefficients, k because in German it's koefficient
  console.log("getCoefficients", clone_entirely(arguments))
  if (token.name == "plus") {
    let ks = []
    for (let node of token.content) {
      ks = ks.concat(getCoefficients(node, searched))
    }
    console.log("coefficients plus", ks)
    return ks
  } else if (token.name == "punkt") {
    console.log("coefficients punkt token:", token)
    let expPart, others = []
    for (let elt of token.content) {
      if (elt.type == "pow" && !expPart) {
        console.log("coefficients punkt elt pow elt:", elt)
        if (elt.val0.text == searched) {
          console.log("coefficients punkt pow case 1")
          if (!expPart) {
            expPart = token_to_text(elt.val1)
          }
        } else {
          console.log("coefficients punkt pow case 2")
          others.push(token_to_text(elt))
        }
      } else if (elt.text == searched && !expPart) {
        console.log("coefficients punkt case else if", { elt, elttext: token_to_text(elt), expPart })
        expPart = "1"
      }
      else {
        console.log("coefficients punkt case else", { elt, elttext: token_to_text(elt), expPart, searched })
        others.push(token_to_text(elt))
      }
    }
    let result = [{ k: others.join("*"), exp: expPart ? expPart : "0" }]
    console.log("coefficients punkt result", { result, others, expPart })
    return result
  } else if (token.name == "pow") {
    console.log("coefficients pow token:", token)
    if (token.val0.text == searched) {
      let result = [{ k: "1", exp: token_to_text(token.val1) }]
      console.log("coefficients pow1", result)
      return result
    } else {
      console.log("coefficients pow2")
      return [{ k: token_to_text(token), exp: "0" }]
    }
  } else {
    return [{ k: token_to_text(token), exp: "0" }]
  }
}
function all_one_side(part1, part2) {
  let newPart1Text = "(" + token_to_text(part1) + ")-(" + token_to_text(part2) + ")"
  console.log("newPart1Text", newPart1Text)
  let newPart1 = parse(newPart1Text)
  let newPart2 = parse("0")
  return { newPart1, newPart2 }
}
function isolate_stepwise(varPart, otherPart, searched) {
  console.log("isolate stepwise", clone_entirely({ arguments, varPart, otherPart, searched }))
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
        let newOtherPartText = step.prefix + "(" + token_to_text(otherPart) + step.action + ")"
        otherPart = parse(newOtherPartText)
        otherPart = reduce_completely(otherPart)
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
              prefix: ""
            }
            break;
          }
          case "plus": {
            return {
              state: "isolating",
              action: "-" + token_to_text(subnode),
              equation,
              prefix: ""
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
          let prefix = ""
          if (val1.val % 2 == 0) {
            prefix = "±"
          }
          return {
            state: "isolating",
            action: "^(1/" + token_to_text(val1) + ")",
            equation: val0,
            prefix
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
    return { state: "finished" }
    console.log("equation:", { equation, searched })
  }
  return { state: "finished" }
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
  let { operandObj, operandText, reduce_mode } = params
  /*a = reduce_token(a, reduce_mode)
  b = reduce_token(b, reduce_mode)*/
  let group, other
  let gFirst
  if (a.type == "group") {
    group = a
    other = b
    gFirst = true
  } else if (b.type == "group") {
    gFirst = false
    group = b
    other = a
  } else {
    //console.log("returning in groupWother", {a,b,params})
    return null
  }
  let gContent = group.content
  /*if(gContent.name=="punkt"&&operandObj.name=="div"){
    return null
  }*/
  let otherText = token_to_text(other)
  console.log("inside of groupWother", { gContent, other, operandObj, operandText, reduce_mode })
  if (gContent.level >= operandObj.level) {
    let newText
    if (gFirst) {
      newText = token_to_text(gContent) + operandText + otherText
    } else {
      newText = otherText + operandText + token_to_text(gContent)
    }
    console.log("new Text in gContent", { newText, operandText, otherText, gContent })
    let newToken = parse(newText)
    newToken = reduce_token(newToken, reduce_mode)
    return newToken
  } else if (!(other.name == "pow" && gContent.level == 0)) {
    let newTexts = []
    let content = []//subnodes of content in group
    if (gContent.type == "op") {
      return null
    } else if (gContent.type == "opChain") {
      content = gContent.content
    }
    console.log("gWother 2 opChain")
    for (let subnode of content) {
      let text = token_to_text(subnode) + operandText + otherText
      newTexts.push(text)
    }
    let newText = newTexts.join(gContent.operand)
    let newToken = parse(newText)
    newToken = reduce_token(newToken, reduce_mode)
    return newToken
  }
  return null
}

function reduce_token(token, mode = "simplify") {
  //poss_modes:
  // - "expand":
  //    (a+3)^2 => a^2+6*a+9
  // - "simplyfy"
  //    2+2=4
  //    but NOT:
  //    (a+3)^2 => a^2+6*a+9 || a^2+6*a+9 => (a+3)^2
  // - "linearfactor"
  //    a^2+6*a+9 => (a+3)^2 //not implemented jet
  //console.log("reducing...", token)
  //alert("reducing... " + token_to_text(token))
  if (token.type == "op") {
    let val0 = token.val0 = reduce_token(token.val0, mode)
    let val1 = token.val1 = reduce_token(token.val1, mode)
    console.log({ val0, val1, token })
    if (token.name == "pow") {
      console.log("token name is pow")
      if (val0.name == "pow") {
        let newBaseExpText = "(" + token_to_text(val0.val1) + "*" + token_to_text(val1) + ")"
        val0.val1 = reduce_token(parse(newBaseExpText), mode)
        return val0
      } else if (val1.type == "number") {
        console.log("pow val1 is number")
        if (val0.type == "number") {
          if (val1.val % 1 != 0 && val0.val < 0) {
            throw new NegativeRootError("negative root, solution might be to implement i", val0.val, val1.val)
          }
          console.log("pow test")
          let newVal = val0.val ** val1.val
          return parse(String(newVal))
          if (["group"].includes(val0.type) && mode == "expand") {
            let gText = token_to_text(val0)
            let testTexts = new Array(Math.floor(val1.val)).fill(gText)
            let rest = val1.val % 1
            if (rest != 0) {
              testTexts.push(gText + "^" + rest)
            }
            let testText = testTexts.join("*")
            let testToken = parse(testText)
            testToken = reduce_token(testToken, mode)
            if (testText != token_to_text(testToken)) {
              return testToken
            } else {
              return token
            }
          }
        } else if (val1.val == 1) {
          return val0
        } else if (val1.val == 0) {
          return parse("1")
        } else if (val1.val < 0) {
          console.log("negative exponent is beeing transformed", clone_entirely({ token, val0, val1 }))
          let newText = `(1/${token_to_text(val0)}^${Math.abs(val1.val)})`
          let newToken = parse(newText)
          newToken = reduce_token(newToken)
          console.log("newToken after transformed", { newToken, newText })
          //throw new Error("test")
          return newToken
        }
      } else if (val0.type == "number") {
        if (val0.val == 1) {
          return parse("1")
        } else if (val0.val == 0) {
          return parse("0")
        }
      }
    }
    else if (token.name == "div") {
      if (token_to_text(val0) == token_to_text(val1)) {
        return parse("1")
      }
      let gwotherResult = groupWother(val0, val1, { operandText: token.operand, operandObj: token, reduce_mode: mode })
      if (gwotherResult) {
        return gwotherResult
      }
       if (val0.type == "number" && val1.type == "number") {
        let newVal = val0.val / val1.val
        val0.val = newVal
        val0.text = String(newVal)
        return val0
      }

      else if (val1.name == "div") {
        let testText = `(${token_to_text(val0)}/${token_to_text(val1.val0)}*${token_to_text(val1.val1)})`
        let testToken = parse(testText)
        testToken = reduce_token(testToken)
        console.log("testing reform", { testText, testToken, tokenText: token_to_text(testToken) })
        if (token_to_text(testToken) != testText) {
          return testToken
        }
      }
      if (val0.type == "group" && val1.type == "group") {
        let gInfo0 = getInfo(val0.content)
        let gInfo1 = getInfo(val1.content)
        if (gInfo0.kind == gInfo1.kind) {
          let newVal = gInfo0.factor / gInfo1.factor
          return parse(String(newVal))
        }
      }
      if (val0.type == "group") {
        let gInfo = getInfo(val0.content)
        let info1 = getInfo(val1)
        if (gInfo.kind == info1.kind) {
          let newVal = gInfo.factor / info1.factor
          return parse(String(newVal))
        }
      }
      if (val1.type == "group") {
        let info0 = getInfo(val0)
        let gInfo = getInfo(val1.content)
        if (gInfo.kind == info0.kind) {
          let newVal = info0.factor / gInfo.factor
          return parse(String(newVal))
        }
      }
      else {
        let info0 = getInfo(val0)
        let info1 = getInfo(val1)
        if (info0.kind == info1.kind) {
          let newVal = info0.factor / info1.factor
          return parse(String(newVal))
        }
      }
      return token
    }
  } else if (token.type == "number") {
    return token
  } else if (token.type == "opChain") {
    token.content = token.content.map(elt => reduce_token(elt, mode))
    token.content.eachWeach(function (elt1, elt2, loop_info) {
      let { i1, i2, list, restart_loop } = loop_info
      let result = groupWother(elt1, elt2, { operandText: token.operand, operandObj: token, reduce_mode: mode })
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
      token.content = token.content.filter(elt => elt.val != 1)
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
            newExp = reduce_token(newExp, mode)
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
              list[i1] = reduce_token(parse(newText), mode)
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
            list[i1] = reduce_token(parse(newText), mode)
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
          console.log("place thing 1", clone_entirely(testToken),testToken,token_to_text(testToken))
          testToken = reduce_token(testToken, mode)
          console.log("place thing",token_to_text(testToken))
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
          testToken = reduce_token(testToken, mode)
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
    return token
  } else if (token.type == "group") {
    token.content = reduce_token(token.content, mode)
    let { content } = token
    if (["number", "word", "group"].includes(content.type)) {
      return content
    }
  } else if (token.type == "sign") {
    console.log("reducing sign")
    token.val = reduce_token(token.val, mode)
    let testText = "-1*" + token_to_text(token.val)
    let testToken = reduce_token(parse(testText), mode)
    if (token_to_text(testToken) != testText) {
      console.log("returning testToken")
      return testToken
    } else {
      console.log("not returning testToken", { testToken, testText })
    }
    return token
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
  }else if(token.type=="sign"){
    return {factor: -1,kind:token_to_text(token.val)}
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
  } else if (token.type == "sign") {
    return token.text + token_to_text(token.val)
  }
  else {
    return token.text
  }
}
class NegativeRootError extends Error {
  constructor(message, rootContent, exponent) {
    super(message); // (1)
    this.name = "NegativeRootError"; // (2)
    this.rootContent = rootContent
    this.exponent = exponent
  }
}
class InformationError extends Error{
  constructor(message){
    super(message)
  }
}