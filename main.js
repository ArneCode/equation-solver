function start() {
  try {
    let Tree = tokenize("1/(c)/(a)")
    console.log("tokenized: ", clone_entirely(Tree))
    Tree = createSyntaxTree(Tree)[0]
    console.log("Tree: ", clone_entirely(Tree))
    console.log(token_to_text(Tree))
    Tree = reduce_completely(Tree, "expand", document.createElement("div"))
    //Tree=remove_unnessesary_brackets(Tree,1)
    console.log("reduced:", clone_entirely(Tree))
    console.log("result:", token_to_text(Tree))
    /*
    let searched="x"
    let part1=reduce_completely(parse("a-a"))
    let part2=reduce_completely(parse("0"))
    console.log(token_to_text(part1)+"="+token_to_text(part2))
    let solutions=solve_equation(part1,part2,searched)
    let equationsTexts=[]
    let equationsText=""
    if(solutions.length>1){
    for(let i=0;i<solutions.length;i++){
      equationsTexts.push(searched+(i+1)+" = "+solutions[i])
    }
    equationsText=equationsTexts.join("\n")
    }else if(solutions.length==1)
    {
      equationsText=searched+" = "+solutions[0]
    }
    console.log("Solution(s):\n",equationsText)*/
  } catch (e) {
    console.log(e.stack, e, e.message)
  }
}//*/
//window.onload=start
//window.addEventListener("load",start)
setKnownEquations([
  "s=1/2*g*t^2"
])
function handleEquationSubmit(event = null) {
  if (event) { event.preventDefault(true) }
  let equationLatex = equationMathField.latex()
  let equationText = latex_to_text(equationLatex)
  console.log("equationsText", equationText, equationLatex)
  let [part1Text, part2Text] = equationText.replace(/ /g, "").split("=")
  let part1, part2
  try {
    part1 = parse(part1Text)
    part1 = remove_unnessesary_brackets(part1)
    part2 = parse(part2Text)
    part2 = remove_unnessesary_brackets(part2)
  } catch (err) {
    console.error("error while parsing equation. Err:\n", err)
    return
  }
  let searched = searchVarInput.value
  let otherEquations = getEquations().concat(getKnownEquations())
  //console.log("otherEquations",otherEquations)
  let solutionPathElt = document.createElement("div")
  solutionPathElt.innerHTML = "<h2>Lösungsweg:</h2><br/>"
  let childElement = document.createElement("div")
  solutionPathElt.appendChild(childElement)
  historyContainer.innerHTML = ""
  historyContainer.appendChild(solutionPathElt)
  let solutions = solve_equation(part1, part2, searched, otherEquations, childElement, {}, [])
  //let solutionsHTML=""
  solutionsContainer.innerHTML = ""
  for (let solution of solutions) {
    solution = token_to_latex(parse(solution))
    console.log("latex solution", solution)
    let solutionBlock = document.createElement("span")
    solutionBlock.classList.add("solutionBlock")
    solutionBlock.innerHTML = searched + " = " + solution
    MQ.StaticMath(solutionBlock)
    solutionsContainer.appendChild(solutionBlock)
    //solutionsHTML+=`<span class="solutionBlock">${searched} = ${solution}</span>`
  }
  if (solutions.length == 0) {
    //solutionsHTML+="<span class='solutionBlock'>no Solution found using the known methods</span>"
  }
  /*
  let historyHTML="<h3>Lösungsweg:</h3><br/>"
  for(let point of history){
    let {title,actions}=point
    historyHTML+=`
    <span class="historyTitleBlock">${title}</span>
    <br/>`
    historyHTML+=actions.map(elt=>`<span class="historyBlock">${elt}</span>`).join(`<span style="text-align:center;">${point.delimiter}</span>`)
  }*/
  console.log("solutions: ", solutions)
  //solutionsContainer.innerHTML=solutionsHTML
  //historyContainer.innerHTML=historyHTML
  //console.log({history,historyHTML})
  //console.log(historyContainer)
}
equationForm.addEventListener("submit", handleEquationSubmit)