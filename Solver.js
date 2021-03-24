function solve_equation(part1, part2, searched, otherEquations, historyNode = null, subst_info = {}, level = 1) {
  let { doSubst } = getPropertys(subst_info, ["doSubst"], [true])
  let history = []
  let thisNode = document.createElement("div")
  thisNode.id = "solve_equation" + Math.random()
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  thisNode.appendChild(childNode)
  childNode.id = ("solve_equation_child_node" + Math.random())
  let result = reduce_equation(part1, part2, { simplify: true }, childNode)
  part1 = result[0]
  part2 = result[1]
  let reduce_result = reduce_equation(part1, part2, { simplify: true }, childNode)
  part1 = reduce_result[0]
  part2 = reduce_result[1]
  if (!(part1.variables.includes(searched) || part2.variables.includes(searched))) {
    throw new InformationError(`there wasn't enough information given to find variable ${searched}`)
  }
  let solutions = trySolvingTactics(part1, part2, searched, childNode)
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
    let solutionNode = document.createElement("div")
    solutionNode.className = "historyBlock"
    childNode.appendChild(solutionNode)
    try {
      let token = parse(solution)
      token = reduce_completely(token, { simplify: true, expand: true, calc_completely: calcCompletelyBox.checked && level == 0 }, solutionNode)
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
  solutions = finalSolutions
  if (doSubst) {
    let variables = part1.variables.concat(part2.variables)
    let eqvars = variables.filter(v => v != searched)
    let subst_result = getSubstitutions(eqvars, otherEquations, subst_info)
    substitutions = subst_result.substitutions
    subst_info.substitutions = substitutions
    if (Object.keys(substitutions).length > 0) {
      if (solutions.length > 0) {
        solutions = subst_comp(solutions, searched, childNode, subst_info)
      } else {
        result = subst_incomp(part1, part2, childNode, subst_info)
        part1 = result.part1
        part2 = result.part2
      }
    }
  }
  return solutions
}
function subst_incomp(part1, part2, historyNode, subst_info) {
  //substitutes an equation that hasn't been fully solved
  let { substitutions, already_tried, already_solved } = getPropertys(subst_info, [
    "substitutions",
    "already_tried",
    "already_solved"
  ], [
      {},
      [],
      {}
    ])
  if (Object.keys(substitutions).length == 0) {
    return { part1, part2 }
  }
  let thisNode = document.createElement("div")
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  let part1Text = token_to_text(part1)
  let part2Text = token_to_text(part2)
  let part1Tried = []
  let part2Tried = []
  let vars_to_replace = clone_entirely(substitutions)
  while ((!part1Tried.includes(part1Text)) || !part2Tried.includes(part2Text)) {
    part1Tried.push(part1Text)
    part2Tried.push(part2Text)
    for (let var_name in vars_to_replace) {
      let subst = vars_to_replace[var_name]
      let solution
      if (!already_solved[var_name]) {
        childNode.innerHTML += "<br/>"
        let childSubNode = document.createElement("div")
        childSubNode.className = "historyBlock"
        childNode.appendChild(childSubNode)
        already_tried.push(token_to_text(subst.part1) + token_to_text(subst.part2))
        solution = solve_equation(subst.part1, subst.part2, var_name, [], childSubNode, { doSubst: false })[0]
        already_solved[var_name] = solution
      } else {
        solution = already_solved[var_name]
      }
      if (part1Text.includes(var_name) || part2Text.includes(var_name)) {
        delete vars_to_replace[var_name]
      }
      part1Text = replaceVar(part1Text, var_name, solution)
      part2Text = replaceVar(part2Text, var_name, solution)
      childNode.innerHTML += "<br/>"
    }
  }
  thisNode.appendChild(childNode)
  return { part1: parse(part1Text), part2: parse(part2Text) }
}
function subst_comp(solutions, searched, historyNode, subst_info) {
  //substitutes a solution
  let { substitutions, already_tried, already_solved } = getPropertys(subst_info, [
    "substitutions",
    "already_tried",
    "already_solved"
  ], [
      {},
      [],
      {}
    ])
  let thisNode = document.createElement("div")
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  thisNode.appendChild(childNode)
  let subst_solutions_list = []
  for (let var_name in substitutions) {
    let subst = substitutions[var_name]
    childNode.innerHTML += "<br/>"
    let childSubNode = document.createElement("div")
    childSubNode.className = "historyBlock"
    childNode.appendChild(childSubNode)
    already_tried.push(token_to_text(subst.part1) + token_to_text(subst.part2))
    let subst_solutions = solve_equation(subst.part1, subst.part2, var_name, [], childSubNode, { doSubst: false })
    subst_solutions_list.push({
      var_name,
      subst_solutions
    })
  }
  let solution_paths = []
  let subst_solutions = []
  for (let sol_i = 0; sol_i < solutions.length; sol_i++) {
    let solution = solutions[sol_i]
    let subst_tree = substitute_recursively(clone_entirely(subst_solutions_list), subst_solutions_list, solution)
    let tree_arrs = subst_tree_arr(subst_tree, searched)
    solution_paths = solution_paths.concat(tree_arrs.solution_paths)
    subst_solutions = subst_solutions.concat(tree_arrs.solutions)
  }
  let pathsNode = document.createElement("div")
  pathsNode.className = "historyBlock"
  for (let solution_path of solution_paths) {
    let pathSpan = document.createElement("span")
    pathSpan.innerHTML = solution_path
    MQ.StaticMath(pathSpan)
    pathsNode.appendChild(pathSpan)
  }
  childNode.innerHTML += "<br/>"
  childNode.appendChild(pathsNode)
  return subst_solutions
}
function substitute_recursively(_subst_solutions_list, subst_solutions_list, solution, replaced_something = false) {
  if (_subst_solutions_list.length == 0) {
    if (replaced_something) {
      return substitute_recursively(clone_entirely(subst_solutions_list), subst_solutions_list, solution, false)
    } else {
      let finalSolution = parse(solution)
      finalSolution = reduce_completely(finalSolution, { calc_completely: calcCompletelyBox.checked, expand: true })
      finalSolution = token_to_text(finalSolution)
      if (finalSolution != solution) {
        return { val: solution, subnodes: [{ val: finalSolution, subnodes: [] }] }
      } else {
        return { val: solution, subnodes: [] }
      }
    }
  }
  let { subst_solutions, var_name } = _subst_solutions_list.shift()
  if (solution.includes(var_name)) {
    let subnodes = []
    for (let subst_solution of subst_solutions) {
      let solutionText = replaceVar(solution, var_name, subst_solution)
      replaced_something = solutionText != solution || replaced_something
      solutionToken = parse(solutionText)
      solutionText = token_to_text(remove_unnessesary_brackets(solutionToken))
      solutionToken = parse(solutionText)
      try {
        solutionToken = reduce_completely(solutionToken, { expand: true }, document.createElement("div"))
      } catch (err) {
        if (err.constructor == NegativeRootError) {
          subnodes.push({ val: solutionText, subnodes: [], isError: true })
          console.log("negative root error, continuing")
          continue
        }
      }
      if (token_to_text(solutionToken) == solutionText) {
        subnodes.push(substitute_recursively(_subst_solutions_list, subst_solutions_list, solutionText, replaced_something))
      } else {
        let result = substitute_recursively(_subst_solutions_list, subst_solutions_list, token_to_text(solutionToken), replaced_something)
        subnodes.push({
          val: solutionText, subnodes: [result]
        })
      }
    }
    return { val: solution, subnodes }
  } else {
    return substitute_recursively(_subst_solutions_list, subst_solutions_list, solution, replaced_something)
  }
}
function subst_tree_arr(subst_tree, solution_path = "") {
  let solution = subst_tree.val
  if (solution) {
    solution_path += " = " + token_to_latex(parse(solution))
  }
  if (subst_tree.subnodes.length == 0) {
    if (subst_tree.isError) {
      let result = {
        solutions: [],
        solution_paths: [solution_path + " = !Error"]
      }
      return result
    } else {
      let result = {
        solutions: [solution],
        solution_paths: [solution_path]
      }
      return result
    }
  }
  let solutions = []
  let solution_paths = []
  for (let node of subst_tree.subnodes) {
    let result = subst_tree_arr(node, solution_path)
    solutions = solutions.concat(result.solutions)
    solution_paths = solution_paths.concat(result.solution_paths)
  }
  return { solutions, solution_paths }
}
function getSubstitutions(variables, otherEquations, subst_info) {
  let { substitutions, already_tried } = getPropertys(subst_info, [
    "substitutions",
    "already_tried"
  ], [
      {},
      []
    ])
  if (variables.length == 0) {
    return { substitutions, allFound: true, vars_unknown: [] }
  }
  let unknown = []
  for (let i = 0; i < variables.length; i++) {
    let v = variables[i]
    if (substitutions[v]) {
      continue;
    }
    let solutionFound = false
    let missing = []
    for (let eq of otherEquations) {
      if (already_tried.includes(token_to_text(eq.part1) + token_to_text(eq.part2))) {
        continue;
      }
      let eqvars = eq.part1.variables.concat(eq.part2.variables)
      if (eqvars.includes(v)) {
        let solution = trySolvingTactics(eq.part1, eq.part2, v, document.createElement("div"))[0]
        if (solution) {
          let _eqvars = eqvars.filter(_v => _v != v)
          subst_info = { substitutions, already_tried }
          let _already_tried = clone_entirely(already_tried)
          let triedText = token_to_text(eq.part1) + token_to_text(eq.part2)
          _already_tried.push(triedText)
          let result = getSubstitutions(_eqvars, otherEquations, { already_tried: _already_tried, substitutions })
          if (result.allFound) {
            already_tried.push(triedText)
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
      let solutionFound = false
      for (let elt of missing) {
        subst_info = { substitutions, already_tried }
        let result = getSubstitutions(vars_unknown, otherEquations, subst_info)
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
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  childNode.id = "trySolvingTactics_child_node" + Math.random()
  thisNode.appendChild(childNode)
  let result
  result = reduce_equation(part1, part2, { simplify: true }, childNode)
  part1 = result[0]
  part2 = result[1]
  let newPart1, newPart2 //newParts, so that the original part1 and part2 are not changed
  let isolate_actions = []
  if (part1.variables.includes(searched) && !part2.variables.includes(searched)) {
    result = isolate_stepwise_completely(clone_entirely(part1), clone_entirely(part2), searched, childNode)
    newPart1 = result[0]
    newPart2 = result[1]
  } else if (part2.variables.includes(searched) && !part1.variables.includes(searched)) {
    result = isolate_stepwise_completely(clone_entirely(part2), clone_entirely(part1), searched, childNode)
    newPart1 = result[0]
    newPart2 = result[1]
  } else if (part1.variables.includes(searched) && part2.variables.includes(searched)) {
    [newPart1, newPart2] = varOneSide(clone_entirely(part1), clone_entirely(part2), searched, childNode)
  }
  if (newPart1.text == searched) {
    if (!newPart2.variables.includes(searched)) {
      return [token_to_text(newPart2)]
    }
  }
  childNode.innerHTML = ""//deleting isolation history if isolation isn't used
  result = satz_v_Nullp(part1, part2, searched, childNode)
  if (result.length > 0) {
    return result
  }
  result = mitternachtsformel(part1, part2, searched, childNode)
  if (result.length > 0) {
    return result
  }
  childNode.innerHTML = ""
  return []
}
function getTokenFactors(token) {
  let factors = []
  if (token.type == "number") {
    let factors = Math.abs(token.val).factors().map(String)
    if (token.val < 0) {
      factors.push("-1")
    }
  } else if (token.name == "plus") {
    factors = getTokenFactors(token.content[0])
    for (let subnode of token.content.slice(1)) {
      factors = sharedElts(factors, getTokenFactors(subnode))
    }
    return factors
  } else if (token.name == "punkt") {
    for (let subnode of token.content) {
      factors = factors.concat(getTokenFactors(subnode))
    }
  } else if (token.name == "pow") {
    if (token.val1.type == "number" && token.val1.val >= 1) {
      for (let exp = Math.floor(token.val1.val); exp > 1; exp--) {
        factors.push(token_to_text(token.val0) + "^" + exp)
      }
      factors.push(token_to_text(remove_unnessesary_brackets(token.val0)))
      return factors
    } else {
      return [token_to_text(remove_unnessesary_brackets(token.val0)), token_to_text(token)]
    }
  }
  else {
    return [token_to_text(token)]
  }
  return factors
}
function removeEquationFactors(part1, part2, historyNode = null) {
  let factors = sharedElts(getTokenFactors(part1), getTokenFactors(part2))
  while (factors.length > 0) {
    let factor = factors[0]
    let part1Text = `(${token_to_text(part1)})/${factor}`
    let part2Text = `(${token_to_text(part2)})/${factor}`
    if (historyNode) {
      let equationNode = document.createElement("div")
      equationNode.className = "historyBlock"
      equationNode.innerHTML = `${token_to_latex(part1)}=${token_to_latex(part2)}|\\frac{\\dots}{${factor}}`
      MQ.StaticMath(equationNode)
      historyNode.appendChild(equationNode)
    }
    part1 = parse(part1Text)
    part1 = reduce_completely(part1, { simplify: true, expand: true })
    part2 = parse(part2Text)
    part2 = reduce_completely(part2, { simplify: true, expand: true })
    factors = sharedElts(getTokenFactors(part1), getTokenFactors(part2))
  }
  return [part1, part2]
}
function varOneSide(part1, part2, searched, historyNode) {
  let solutions = []
  let thisNode = document.createElement("div")
  historyNode.appendChild(thisNode)
  for (let first = 1; first < 3; first++) {
    let a, b
    if (first == 1) {
      a = clone_entirely(part1)
      b = clone_entirely(part2)
    } else {
      a = clone_entirely(part2)
      b = clone_entirely(part1)
    }
    let orderReversed = first == 2
    let aBefore, bBefore, result
    let isolationNode = document.createElement("div")
    while (aBefore != token_to_text(a) || bBefore != token_to_text(b)) {
      aBefore = token_to_text(a)
      bBefore = token_to_text(b)
      result = removeEquationFactors(a, b, isolationNode)
      a = result[0]
      b = result[1]
      result = isolate_stepwise_completely(a, b, searched, isolationNode, true, orderReversed)
      a = result[0]
      b = result[1]
      result = isolate_stepwise_completely(b, a, searched, isolationNode, false, !orderReversed)
      a = result[1]
      b = result[0]
    }
    if (orderReversed) {
      solutions.push({
        varPart: b,
        otherPart: a,
        history: isolationNode
      })
    } else {
      solutions.push({
        varPart: a,
        otherPart: b,
        history: isolationNode
      })
    }
  }
  //choosing best solution
  let bestSolution
  let minComplexity = Infinity
  for (let solution of solutions) {
    let { varPart, otherPart } = solution
    if (otherPart.variables.includes(searched) || varPart.type != "word") {
      continue
    }
    let complexity = getTokenComplexity(otherPart)
    if (complexity < minComplexity) {
      minComplexity = complexity
      bestSolution = solution
    }
  }
  if (bestSolution) {
    thisNode.appendChild(bestSolution.history)
    let finalEquationNode = document.createElement("div")
    finalEquationNode.className = "historyBlock"
    finalEquationNode.innerHTML = token_to_latex(bestSolution.varPart) + "=" + token_to_latex(bestSolution.otherPart)
    MQ.StaticMath(finalEquationNode)
    thisNode.appendChild(finalEquationNode)
    return [bestSolution.varPart, bestSolution.otherPart]
  } else {
    return [part1, part2]
  }
}
function satz_v_Nullp(part1, part2, searched, historyNode) {
  let expression = all_one_side(part1, part2).newPart1
  try {
    expression = reduce_completely(expression, { linearfactor: true, simplify: true })
  } catch (err) {
    if (err.constructor == NegativeRootError) {
      console.log("negative root error while expanding expression")
      return []
    } else {
      throw err
    }
  }
  if (expression.name == "punkt") {
    let solutions = []
    for (let subnode of expression.content) {
      solutions = solutions.concat(solve_equation(subnode, parse("0"), searched, [], historyNode))
    }
    return solutions
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
    expression = reduce_completely(expression, { expand: true }, childNode)
  } catch (err) {
    if (err.constructor == NegativeRootError) {
      console.log("negative root error while expanding expression")
      return []
    } else {
      throw err
    }
  }
  let parts = getCoefficients(expression, searched)
  console.log("parts", parts)
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
  if (a == 0 || b == 0) {
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
  solution = reduce_completely(solution, { simplify: true }, childNode)
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
  } else if (token.type == "sign") {
    let result = []
    for (let k of getCoefficients(token.val, searched)) {
      result.push({ k: token.text + k.k, exp: k.exp })
    }
    return result
  } else if (token.type == "word" && token.text == searched) {
    return [{ k: "1", exp: "1" }]
  } else if(token.type=="group"){
    return getCoefficients(token.content,searched)
  }/*else if (token.name == "div") {
    let result = getCoefficients(token.val0, searched)

    if (token.val1.variables.includes(searched)) {
      let divisors=[]
      for(let k of getCoefficients(token.val1,searched)){
        if(k.exp!="0"){
          result.push({k:k.k,exp:"-"+k.exp})
        }else{
          divisors.push(k.k)
        }
      }
      if(divisors.length!=0){
        let k=`1/(${divisors.join("+")})`
        result.push({k,exp:"0"})
      }
    }
    return result
  }*/
  else {
    return [{ k: token_to_text(token), exp: "0" }]
  }
}
function all_one_side(part1, part2, historyNode = null) {
  let newPart1Text = "(" + token_to_text(part1) + ")-(" + token_to_text(part2) + ")"
  console.log("newPart1Text", newPart1Text)
  let newPart1 = parse(newPart1Text)
  let newPart2 = parse("0")
  if (part2.val != 0 && historyNode) {
    let thisNode = document.createElement("div")
    thisNode.innerHTML = `
    <h3>Putting everything on one Side</h3><br/>
    <span>${token_to_text(part1)} = ${token_to_text(part2)} | -(${token_to_text(part2)})</span>`
    historyNode.appendChild(thisNode)
  }
  return { newPart1, newPart2 }
}
function isolate_stepwise_completely(varPart, otherPart, searched, historyNode, varSearched = true, varPartFirst = true) {
  let thisNode = document.createElement("div")
  historyNode.appendChild(thisNode)
  let childNode = document.createElement("div")
  thisNode.appendChild(childNode)
  let steps = []
  while (steps.length < 100) {
    let step = isolate_var_step(varPart, searched, varSearched)
    steps.push(step)
    switch (step.state) {
      case "finished": {
        let historyBlock = document.createElement("span")
        historyBlock.className = "historyBlock"
        return [varPart, otherPart]
      }
      case "isolating": {
        let newOtherPartText = step.prefix + "(" + token_to_text(otherPart) + ")" + step.action
        let historyBlock = document.createElement("span")
        historyBlock.className = "historyBlock"
        let currEqBlock = document.createElement("span")
        if (varPartFirst) {
          currEqBlock.innerHTML = `${token_to_latex(varPart)} = ${token_to_latex(otherPart)}  | ${step.actionLatex}`
        } else {
          currEqBlock.innerHTML = `${token_to_latex(otherPart)} = ${token_to_latex(varPart)}  | ${step.actionLatex}`
        }
        MQ.StaticMath(currEqBlock)
        historyBlock.appendChild(currEqBlock)
        childNode.appendChild(historyBlock)
        try {
          otherPart = parse(newOtherPartText)
          otherPart = reduce_completely(otherPart, { simplify: true, expand: true, dispand: true }, document.createElement("div"))
          varPart = step.equation
          break;
        } catch (err) {
          if (err.constructor == NegativeRootError) {
            return [varPart, otherPart]
          } else {
            throw err
          }
        }
      }
    }
  }
}
function isolate_var_step(equation, searched, varSearched = true) {
  equation = reduce_completely(equation, { simplify: true, expand: true })
  if (varSearched) {
    if (equation.type == "word" && equation.text == searched) {
      return { state: "finished" }
    }
  } else {
    if (!equation.variables.includes(searched)) {
      return { state: "finished" }
    }
  }
  if (equation.type == "opChain") {
    let { content, name } = equation
    for (let i = 0; i < content.length; i++) {
      let subnode = content[i]
      let isSearched = subnode.variables.includes(searched)
      if (!varSearched) {
        isSearched = (!isSearched)
      }
      //^ = xor
      if (!isSearched) {
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
              prefix: "",
              actionLatex: "\\frac{...}{" + token_to_latex(subnode) + "}"
            }
            break;
          }
          case "plus": {
            return {
              state: "isolating",
              action: "-" + token_to_text(subnode),
              actionLatex: "-" + token_to_latex(subnode),
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
    let isolate0
    if (val0.variables.includes(searched)) {
      if (!val1.variables.includes(searched)) {
        isolate0 = true
      } else {
        return { state: "finished" }
      }
    } else if (val1.variables.includes(searched)) {
      isolate0 = false
    } else {
      return { state: "finished" }
    }
    isolate0 = isolate0 ^ (!varSearched)
    switch (equation.name) {
      case "pow": {
        if (isolate0) {
          let sign = ""
          if (val1.val % 2 == 0) {
            sign = "±"
          }
          return {
            state: "isolating",
            action: "}",
            equation: val0,
            prefix: sign + "\\sqrt[" + token_to_text(val1) + "]{",
            actionLatex: "\\sqrt[" + token_to_latex(val1) + "]{...}"
          }
        }
        else {
          console.warn("reminder: add logarithm")
          return { state: "finished" }
        }
        break;
      }
      case "div": {
        if (isolate0) {
          return {
            state: "isolating",
            action: "*" + token_to_text(val1),
            actionLatex: "\\cdot" + token_to_latex(val1),
            equation: val0,
            prefix: ""
          }
          break;
        } else {
          equation = parse(token_to_text(val1) + "/" + token_to_text(val0))
          return {
            state: "isolating",
            action: "^-1",
            actionLatex: "\\dots^{-1}",
            equation,
            prefix: ""
          }
        }
      }
    }
  }
  else if (equation.type == "group") {
    return isolate_var_step(equation.content, searched, varSearched)
  } else if (equation.type == "sign") {
    if (equation.text == "-") {
      let isolate0 = !varSearched
      if (isolate0) {
        return {
          state: "isolating",
          action: "/" + token_to_text(equation.val),
          actionLatex: "\\frac{\\dots}{" + token_to_latex(equation.val) + "}",
          equation: parse("-1"),
          prefix: ""
        }
      } else {
        return {
          state: "isolating",
          action: "*-1",
          actionLatex: "\\cdot-1",
          equation: equation.val,
          prefix: ""
        }
      }
    }
  }
  else {
    return { state: "finished" }
  }
  return { state: "finished" }
}