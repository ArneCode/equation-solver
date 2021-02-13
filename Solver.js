function solve_equation(part1, part2, searched, otherEquations, historyNode = null, substitutions = {}, already_tried = []) {
  let history = []
  let thisNode = document.createElement("div")
  thisNode.id = "solve_equation" + Math.random()
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  thisNode.appendChild(childNode)
  childNode.id = ("solve_equation_child_node" + Math.random())
  //console.log(childNode,childNode.id,Math.random())
  //[part1, part2] = 
  let result = reduce_equation(part1, part2, "simplify", childNode)
  console.log("result:", result)
  part1 = result[0]
  part2 = result[1]
  let variables = part1.variables.concat(part2.variables)
  let subst_result = getSubstitutions(variables.filter(v => v != searched), otherEquations, substitutions, already_tried)
  console.log("substitutions found:", subst_result)
  substitutions = subst_result.substitutions
  if (Object.keys(substitutions).length > 0) {
    subst_result = substitute(substitutions, part1, part2, childNode)
    part1 = subst_result[0]
    part2 = subst_result[1]
  }
  let reduce_result = reduce_equation(part1, part2, "simplify", childNode)
  part1 = reduce_result[0]
  part2 = reduce_result[1]
  if (!(part1.variables.includes(searched) || part2.variables.includes(searched))) {
    throw new InformationError(`there wasn't enough information given to find variable ${searched}`)
  }
  let solutions = trySolvingTactics(part1, part2, searched, childNode)
  /*if (Object.keys(substitutions).length != 0) {
    let newPart2Text
  }
*/
  for (let i = 0; i < solutions.length; i++) {
    let solution = solutions[i]
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
    let solutionNode=document.createElement("div")
    solutionNode.className="historyBlock"
    childNode.appendChild(solutionNode)
    try {
      let token = parse(solution)
      token = reduce_completely(token,"expand",solutionNode)
      finalSolutions.push(token_to_text(token))
    } catch (err) {
      if (err.constructor == NegativeRootError) {
        //console.warn(err.message)
        continue;
      } else {
        throw err
      }
    }
  }
  //finalSolutions = finalSolutions.filter((elt, idx) => finalSolutions.indexOf(elt) == idx)
  return { solutions: finalSolutions, history }
}
function substitute(substitutions, part1, part2, historyNode) {
  if (Object.keys(substitutions).length == 0) {
    return [part1, part2]
  }
  let thisNode = document.createElement("div")
  /*thisNode.innerHTML=`<h3>Substituting:</h3><br/>
  In the equation there are still variables that are unknown, so we need to find their value by looking at other equations`*/
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  //childNode.className="historyBlock indented"
  let part1Text = token_to_text(part1)
  let part2Text = token_to_text(part2)
  for (let var_name in substitutions) {
    let subst = substitutions[var_name]
    //childNode.innerHTML+=`<h3>${token_to_text(subst.part1)} = ${token_to_text(subst.part2)}</h3>`
    //childNode.innerHTML+=`<h3>finding ${var_name}:</h3>`
    let childSubNode = document.createElement("div")
    childNode.appendChild(childSubNode)
    let _substitutions = clone_entirely(substitutions)
    delete _substitutions[var_name]
    let solution = solve_equation(subst.part1, subst.part2, var_name, [], childSubNode, _substitutions, []).solutions[0]
    part1Text = part1Text.split(var_name).join(solution)
    part2Text = part2Text.split(var_name).join(solution)
    console.log("new texts after substituting", part1Text, " = ", part2Text, { solution, substitutions }, token_to_text(subst.part1), token_to_text(subst.part2))
    childNode.innerHTML += "<br/>"
  }
  thisNode.appendChild(childNode)
  return [parse(part1Text), parse(part2Text)]
}
function getSubstitutions(variables, otherEquations, substitutions = {}, already_tried = []) {
  if (variables.length == 0) {
    return { substitutions, allFound: true, vars_unknown: [] }
  }
  console.log("get substituting the folllowing variables:" + variables.join(", "), clone_entirely(arguments))
  let unknown = []
  for (let i = 0; i < variables.length; i++) {
    let v = variables[i]
    console.log("testing for variable..", v)
    if (substitutions[v]) {
      continue;
    }
    let solutionFound = false
    let missing = []
    for (let eq of otherEquations) {
      if (already_tried.includes(token_to_text(eq.part1) + token_to_text(eq.part2))) {
        continue;
      }
      already_tried.push(token_to_text(eq.part1) + token_to_text(eq.part2))
      let eqvars = eq.part1.variables.concat(eq.part2.variables)
      if (eqvars.includes(v)) {
        let solution = trySolvingTactics(eq.part1, eq.part2, v, document.createElement("div"))[0]
        if (solution) {
          let _eqvars = eqvars.filter(_v => _v != v)
          let result = getSubstitutions(_eqvars, otherEquations, substitutions, already_tried)
          console.log("result after trying to find a substitute for :", { eqvars, v, result, _eqvars, eq })
          if (result.allFound) {
            substitutions[v] = eq
            solutionFound = true
            break;
          } else {
            missing.push({ eq, vars_unknown: result.unknown })
          }
        }
      }
    }
    if (!solutionFound) {
      //return { substitutions, allFound=false }
      let solutionFound = false
      for (let elt of missing) {
        let result = getSubstitutions(vars_unknown, otherEquations, substitutions, already_tried)
        if (result.allFound) {
          substitutions[v] = elt.eq
          solutionFound = true
        }
      }
      if (!solutionFound) {
        unknown.push(v)
      }
    }
  }
  return { substitutions, allFound: true, vars_unknown: unknown }
}
function trySolvingTactics(part1, part2, searched, historyNode = null) {
  let thisNode = document.createElement("div")
  thisNode.id = "trySolvingTactics" + Math.random()
  //thisNode.innerHTML="<h3>Trying solving tactics:</h3>"
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  childNode.id = "trySolvingTactics_child_node" + Math.random()
  thisNode.appendChild(childNode)
  console.log("trySolvingTactics nodes", { historyNode, thisNode, childNode })
  let result
  result = reduce_equation(part1, part2, "simplify", childNode)
  part1 = result[0]
  part2 = result[1]
  let newPart1, newPart2 //newParts, so that the original part1 and part2 are not changed
  let isolate_actions = []
  if (part1.variables.includes(searched) && !part2.variables.includes(searched)) {
    result = isolate_stepwise_completely(clone_entirely(part1), clone_entirely(part2), searched, childNode)
    newPart1 = result[0]
    newPart2 = result[1]
  } else if (part2.variables.includes(searched) && !part1.variables.includes(searched)) {
    result = isolate_stepwise_completely(clone_entirely(part1), clone_entirely(part2), searched, childNode)
    newPart1 = result[0]
    newPart2 = result[1]
  }
  if (newPart1.text == searched) {
    if (!newPart2.variables.includes(searched)) {
      /*if (historyCallba ck) {
        historyCallbac k({
          title: `Isolating ${searched} by reforming the equations`,
          actions: isolate_actions,
          delimiter: ""
        })
      }*/
      return [token_to_text(newPart2)]
    }
  }
  childNode.innerHTML = ""//deleting isolation history if isolation isn't used
  result = mitternachtsformel(part1, part2, searched, childNode)
  if (result.length > 0) {
    return result
  }
  return []
}
function mitternachtsformel(part1, part2, searched, historyNode = null) {
  let actions = []
  let thisNode = document.createElement("div")
  thisNode.innerHTML = "<h3>Using midnight formula</h3>"
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  thisNode.appendChild(childNode)
  let expression = all_one_side(part1, part2, childNode).newPart1
  try {
    expression = reduce_completely(expression, "expand", childNode)
  } catch (err) {
    if (err.constructor == NegativeRootError) {
      console.log("negative root error while expanding expression")
      return []
    } else {
      throw err
    }
  }
  let parts = getCoefficients(expression, searched)
  if (parts.length == 0) {
    return []
  }
  let ks = new Array(3).fill("0")
  for (let part of parts) {
    if (isInt(part.exp)) {
      let n = Number(part.exp)
      if (n < 0 || n > 2) {
        return []
      } else {
        ks[n] = part.k
      }
    } else {
      return []
    }
  }
  let [c, b, a] = ks
    if(a==0){
    //a is 0 (or false)
    console.log("!a")
    return []
  }
  childNode.innerHTML += `<h3>Finding a, b and c</h3>
    <span class="historyBlock">
    a = ${a}
    <br/>
    b = ${b}
    <br/>
    c = ${c}
    </span>
    `
  let solution = `(-${b}±((${b})^2-4*${a}*${c})^0.5)/(2*${a})`
  childNode.innerHTML += `<h3>Inserting a, b and c into the midnight formula</h3>
    <br/>
    <span>${searched}<sub>1/2</sub> = ${solution}</span>`
  solution = parse(solution)
  solution = reduce_completely(solution, "simplify", childNode)
  solution = token_to_text(solution)
  return [solution]
}
function getCoefficients(token, searched) {
  //coefficients, k because in German it's koefficient
  if (token.name == "plus") {
    let ks = []
    for (let node of token.content) {
      ks = ks.concat(getCoefficients(node, searched))
    }
    return ks
  } else if (token.name == "punkt") {
    let expPart, others = []
    for (let elt of token.content) {
      if (elt.name == "pow" && !expPart) {
        if (elt.val0.text == searched) {
          if (!expPart) {
            expPart = token_to_text(elt.val1)
          }
        } else {
          others.push(token_to_text(elt))
        }
      } else if (elt.text == searched && !expPart) {
        expPart = "1"
      }
      else {
        others.push(token_to_text(elt))
      }
    }
    let result = [{ k: others.join("*"), exp: expPart ? expPart : "0" }]
    return result
  } else if (token.name == "pow") {
    if (token.val0.text == searched) {
      let result = [{ k: "1", exp: token_to_text(token.val1) }]
      return result
    } else {
      return [{ k: token_to_text(token), exp: "0" }]
    }
  } else {
    return [{ k: token_to_text(token), exp: "0" }]
  }
}
function all_one_side(part1, part2, historyNode = null) {
  let newPart1Text = "(" + token_to_text(part1) + ")-(" + token_to_text(part2) + ")"
  let newPart1 = parse(newPart1Text)
  let newPart2 = parse("0")
  if (part2.val != 0) {
    let thisNode = document.createElement("div")
    thisNode.innerHTML = `
    <h3>Putting everything on one Side</h3><br/>
    <span>${token_to_text(part1)} = ${token_to_text(part2)} | -(${token_to_text(part2)})</span>`
    historyNode.appendChild(thisNode)
  }
  return { newPart1, newPart2 }
}
function isolate_stepwise_completely(varPart, otherPart, searched, historyNode) {
  let thisNode = document.createElement("div")
  //thisNode.innerHTML=`<h3>Isolating ${searched} by reforming the equations</h3>`
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  thisNode.appendChild(childNode)
  let steps = []
  while (steps.length < 100) {
    //("test")
    let step = isolate_var_step(varPart, searched)
    steps.push(step)
    console.log("step", clone_entirely(step))
    switch (step.state) {
      case "finished": {
        //actionsCal lback(`${token_to_text(varPart)} = ${token_to_text(otherPart)}`)
        childNode.innerHTML += `<span class="historyBlock">${token_to_text(varPart)} = ${token_to_text(otherPart)}</span>`
        return [varPart, otherPart]
      }
      case "isolating": {
        let newOtherPartText = step.prefix + "(" + token_to_text(otherPart)+")" + step.action
        //actionsCall back(`${token_to_text(varPart)} = ${token_to_text(otherPart)} | ${step.action}`)
        childNode.innerHTML += `<span class="historyBlock">${token_to_text(varPart)} = ${token_to_text(otherPart)} | ${step.action}</span>`
        try {
          otherPart = parse(newOtherPartText)
          console.log("newOtherPartText",newOtherPartText)
          otherPart = reduce_completely(otherPart, "simplify", document.createElement("div"))
          varPart = step.equation
          console.log("at end", clone_entirely({ varPart, otherPart }))
          break;
        } catch (err) {
          if (err.constructor == NegativeRootError) {
            console.log(err, "in", newOtherPartText)
            return [varPart, otherPart]
          }
        }
      }
    }
  }
}
function isolate_var_step(equation, searched) {
  console.log("step equation got", clone_entirely(arguments))
  equation = reduce_completely(equation)
  //alert("to isolate: " + token_to_text(equation))
  if (equation.type == "word" && equation.text == searched) {
    return { state: "finished" }
  } else if (equation.type == "opChain") {
    let { content, name } = equation
    for (let i = 0; i < content.length; i++) {
      let subnode = content[i]
      if (!subnode.variables.includes(searched)) {
        content.splice(i, 1)
        if (content.length == 1) {
          equation = content[0]
        }
        switch (name) {
          case "punkt": {
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
      case "div": {
        if(val0.variables.includes(searched) && !val1.variables.includes(searched)){
        return {
          state: "isolating",
          action: "*" + token_to_text(val1),
          equation,
          prefix: ""
        }
        break;
      }else{

      }
      }
    }
  }
  else if (equation.type == "group") {
    return isolate_var_step(equation.content, searched)
  }
  else {
    return { state: "finished" }
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
function groupWother(a, b, params/*{operandText,operandObj}*/, level = 0) {
  let { operandObj, operandText, reduce_mode } = params
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
    return null
  }
  let gContent = group.content
  /*if(gContent.name=="punkt"&&operandObj.name=="div"){
    return null
  }*/
  let otherText = token_to_text(other)
  if (gContent.level >= operandObj.level) {
    let newText
    if (gFirst) {
      newText = token_to_text(gContent) + operandText + otherText
    } else {
      newText = otherText + operandText + token_to_text(gContent)
    }
    let newToken = parse(newText)
    newToken = reduce_token(newToken, reduce_mode, level + 1)
    return newToken
  } else if (!(other.name == "pow" && gContent.level == 0)) {
    let newTexts = []
    let content = []//subnodes of content in group
    if (gContent.type == "op") {
      return null
    } else if (gContent.type == "opChain") {
      content = gContent.content
    }
    for (let subnode of content) {
      let text = token_to_text(subnode) + operandText + otherText
      newTexts.push(text)
    }
    let newText = newTexts.join(gContent.operand)
    let newToken = parse(newText)
    newToken = reduce_token(newToken, reduce_mode, level + 1)
    return newToken
  }
  return null
}
function doAction(newVal, mode) {
  //deside if reducer should do action if newVal is the resulting number and mode is the active mode
  return true
  if(mode!="simplify"){
    return true
  }
  let ptIndex = newVal.indexOf(".")
  if (ptIndex == -1) {
    return true
  } else {
    let nAfterComma = newVal.length - ptIndex
    if (nAfterComma >= 4) {
      return false
    }
  }
  return true
}
function reduce_token(token, mode = "simplify", level = 0) {
  //poss_modes:
  // - "expand":
  //    (a+3)^2 => a^2+6*a+9
  // - "simplyfy"
  //    2+2=4
  //    but NOT:
  //    (a+3)^2 => a^2+6*a+9 || a^2+6*a+9 => (a+3)^2
  // - "linearfactor"
  //    a^2+6*a+9 => (a+3)^2 //not implemented jet
  //alert("reducing... " + token_to_text(token))
  if (level > 30) {
    console.warn("stuck in infinite recursive loop, returning")
    return token
  }
  if (token.type == "op") {
    let val0 = token.val0 = reduce_token(token.val0, mode, level + 1)
    let val1 = token.val1 = reduce_token(token.val1, mode, level + 1)
    if (token.name == "pow") {
      if (val0.name == "pow") {
        let newBaseExpText = "(" + token_to_text(val0.val1) + "*" + token_to_text(val1) + ")"
        val0.val1 = reduce_token(parse(newBaseExpText), mode, level + 1)
        return val0
      } else if (val1.type == "number") {
        if (val0.type == "number") {
          if (val1.val % 1 != 0 && val0.val < 0) {
            throw new NegativeRootError("negative root, solution might be to implement i", val0.val, val1.val)
          }
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
            testToken = reduce_token(testToken, mode, level + 1)
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
          let newText = `(1/${token_to_text(val0)}^${Math.abs(val1.val)})`
          let newToken = parse(newText)
          newToken = reduce_token(newToken, mode, level + 1)
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
      if (mode == "expand") {
        let gwotherResult = groupWother(val0, val1, { operandText: token.operand, operandObj: token, reduce_mode: mode }, level)
        if (gwotherResult) {
          return gwotherResult
        }
      }
      if (val0.type == "number" && val1.type == "number") {
        let newVal = val0.val / val1.val
        if (doAction(newVal, mode)) {
          val0.val = newVal
          val0.text = String(newVal)
          return val0
        }
        else return token
      }
      else if (val1.name == "div") {
        let testText = `(${token_to_text(val0)}/${token_to_text(val1.val0)}*${token_to_text(val1.val1)})`
        let testToken = parse(testText)
        testToken = reduce_token(testToken, mode, level + 1)
        if (token_to_text(testToken) != testText) {
          return testToken
        }
      }
      if (val0.type == "group" && val1.type == "group") {
        let gInfo0 = getInfo(val0.content)
        let gInfo1 = getInfo(val1.content)
        if (gInfo0.kind == gInfo1.kind) {
          let newVal = gInfo0.factor / gInfo1.factor
          if (doAction(newVal, mode))
            return parse(String(newVal))
        }
      }
      if (val0.type == "group") {
        let gInfo = getInfo(val0.content)
        let info1 = getInfo(val1)
        if (gInfo.kind == info1.kind) {
          let newVal = gInfo.factor / info1.factor
          if (doAction(newVal, mode))
            return parse(String(newVal))
          else return token
        }
      }
      if (val1.type == "group") {
        let info0 = getInfo(val0)
        let gInfo = getInfo(val1.content)
        if (gInfo.kind == info0.kind) {
          let newVal = String(info0.factor / gInfo.factor)
          if (doAction(newVal, mode))
            return parse(String(newVal))
          else return token
        }
      }
      else {
        let info0 = getInfo(val0)
        let info1 = getInfo(val1)
        if (info0.kind == info1.kind) {
          let newVal = info0.factor / info1.factor
          if (doAction(newVal, mode))
            return parse(String(newVal))
          else return token
        }
      }
      return token
    }
  } else if (token.type == "number") {
    if (token.val == 0) {
      return parse("0")
    }
    return token
  } else if (token.type == "opChain") {
    token.content = token.content.map(elt => reduce_token(elt, mode, level + 1))
    if (mode == "expand") {
      token.content.eachWeach(function (elt1, elt2, loop_info) {
        let { i1, i2, list, restart_loop } = loop_info
        let result = groupWother(elt1, elt2, { operandText: token.operand, operandObj: token, reduce_mode: mode }, level)
        if (result) {
          list[i1] = result
          list.splice(i2, 1)
          return restart_loop()
        }
      })
    }
    if (token.content.length == 1) {
      return token.content[0]
    }
    if (token.name == "plus") {
      token.content.eachWeach(function (elt1, elt2, loop_info) {
        let info1 = getInfo(elt1)
        let info2 = getInfo(elt2)
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
            newExp = reduce_token(newExp, mode, level + 1)
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
              list[i1] = reduce_token(parse(newText), mode, level + 1)
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
            list[i1] = reduce_token(parse(newText), mode, level + 1)
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
          testToken = reduce_token(testToken, mode, level + 1)
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
          testToken = reduce_token(testToken, mode, level + 1)
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
    token.content = reduce_token(token.content, mode, level + 1)
    let { content } = token
    if (["number", "word", "group"].includes(content.type)) {
      return content
    }
  } else if (token.type == "sign") {
    token.val = reduce_token(token.val, mode, level + 1)
    if (token.text == "-") {
      let testText = "-1*" + token_to_text(token.val)
      let testToken = reduce_token(parse(testText), mode, level + 1)
      if (token_to_text(testToken) != testText) {
        return testToken
      } else {
      }
      return token
    } else if (token.val.val == 0) {
      return token.val
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
  } else if (token.type == "sign") {
    return { factor: -1, kind: token_to_text(token.val) }
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
    super(message);
    this.name = "NegativeRootError";
    this.rootContent = rootContent
    this.exponent = exponent
  }
}
class InformationError extends Error {
  constructor(message) {
    super(message)
  }
}
function reduce_completely(token, mode = "simplify", historyNode = null) {
  let before = []
  let beforeText = token_to_text(token)
  let result = reduce_token(token, mode)
  let resultText = token_to_text(result)
  while (!before.includes(resultText)) {
    before.push(resultText)
    result = reduce_token(parse(resultText), mode)
    if (result.type == "group") {
      result = result.content
    }
    resultText = token_to_text(result)
  }
  if (beforeText != resultText) {
    let title
    let thisNode = document.createElement("div")
    switch (mode) {
      case "simplify": { title = "Simplifying expression:"; break; }
      case "expand": { title = "Simplifying expression by expansion"; break; }
    }
    thisNode.innerHTML = `<h3>${title}</h3><br/>
      <span class="historyBlock">${beforeText}</span>
      <span>↓</span>
      <span class="historyBlock">${resultText}</span>`
    historyNode.appendChild(thisNode)
  }
  return result
}
function reduce_equation(part1, part2, mode = "simplify", historyNode = null) {
  let part1TextBefore = token_to_text(part1)
  let part2TextBefore = token_to_text(part2)
  let nullElt = document.createElement("div")
  part1 = reduce_completely(part1, mode, nullElt)
  part2 = reduce_completely(part2, mode, nullElt)
  if (token_to_text(part1) != part1TextBefore || token_to_text(part2) != part2TextBefore) {
    let title
    switch (mode) {
      case "simplify": title = "Simplifying equation: "; break;
      case "expand": title = "Simplifying equation by expansion: "; break;
    }
    let thisNode = document.createElement("div")
    thisNode.innerHTML = `
    <h3>${title}</h3>
    <span class="historyBlock">${part1TextBefore} = ${part2TextBefore}</span>
    <span>↓</span>
      <span class="historyBlock">${token_to_text(part1)} = ${token_to_text(part2)}</span>
    `
    historyNode.appendChild(thisNode)
  }
  /*if ((token_to_text(part1) != part1TextBefore || token_to_text(part2) != part2TextBefore) && (historyCall back || actionsCallba ck)) {
    let title = ""
    switch (mode) {
      case "simplify": title = "Simplifying equation:"; break;
      case "expand": title = "Simplifying equation by expansion"; break;
    }
    if (historyCall back) {
      historyCall back({
        title,
        actions: [`${part1TextBefore} = ${part2TextBefore}`,
        `${token_to_text(part1)} = ${token_to_text(part2)}`],
        delimiter: "↓"
      })
    } else {
      actionsCallb ack(`<h3>${title}</h3><br/>
      <span class="historyBlock">${part1TextBefore} = ${part2TextBefore}</span>
      <span>↓</span>
      <span class="historyBlock">${token_to_text(part1)} = ${token_to_text(part2)}</span>`)
    }
  }*/
  console.log("endTest", { part1, part2 })
  return [part1, part2]
}