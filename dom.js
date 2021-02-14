let equationForm = document.getElementById("equationForm")
let equationInput = document.getElementById("equationInput")
let solutionsContainer = document.getElementById("solutionsContainer")
let historyContainer = document.getElementById("historyContainer")
let searchVarInput = document.getElementById("searchVarInput")
let mainContent = document.getElementById("mainContent")
let settingsContent = document.getElementById("settingsContent")
let settingsButton = document.getElementById("settingsButton")
let mainContentButton = document.getElementById("mainContentButton")
let enteredEquations = document.getElementById("enteredEquations")
let addEquationsInput = document.getElementById("addEquationsInput")
settingsButton.addEventListener("click", () => {
  mainContent.style.display = "none"
  settingsContent.style.display = "block"
})
mainContentButton.addEventListener("click", () => {
  mainContent.style.display = "block"
  settingsContent.style.display = "none"
})
document.getElementById("mainContentAddEquationForm").addEventListener("submit", event => {
  event.preventDefault()
  let newEquation = document.createElement("input")
  newEquation.className = "addedEquation"
  newEquation.value = addEquationsInput.value
  addEquationsInput.value = ""
  enteredEquations.appendChild(newEquation)
  try {
    parse_equation(newEquation.value)
  } catch (error) {
    newEquation.className += " error"
    newEquation.title = "invalid equation"
  }
  newEquation.addEventListener("blur", evt => {
    if (newEquation.value == "") {
      newEquation.remove()
    }
    try {
      parse_equation(newEquation.value)
      newEquation.className="addedEquation"
      newEquation.title=""
    } catch (error) {
      newEquation.className += " error"
      newEquation.title = "invalid equation"
    }
  })
})
function getEquations() {
  let equations = []
  for (let equationNode of enteredEquations.childNodes) {
    if (equationNode.className.includes("error")) {
      continue;
    }
    let equation = parse_equation(equationNode.value)
    equations.push(equation)
  }
  return equations
}