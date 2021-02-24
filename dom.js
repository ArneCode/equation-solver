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
let addedEquationsWarn = document.getElementById("addedEquationsWarn")
let knownEquationsDiv = document.getElementById("knownEquationsDiv")
let addedKnownEquationsDiv = document.getElementById("addedKnownEquationsDiv")
let knownEquationsInput = document.getElementById("knownEquationsInput")
let addUnitForm=document.getElementById("addUnitForm")
let equationMathField
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
  if (addEquationsInput.value == "") {
    addedEquationsWarn.innerHTML = "cannot add empty equation"
    return
  }
  for (let otherEq of enteredEquations.childNodes) {
    if (otherEq.value == addEquationsInput.value) {
      addedEquationsWarn.innerHTML = "equation does already exist"
      return
    }
  }
  addedEquationsWarn.innerHTML = ""
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
      newEquation.className = "addedEquation"
      newEquation.title = ""
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
window.onload = () => {
  let sections = document.getElementsByClassName("section")
  document.querySelector(`a[href*=${sections[0].id}]`).classList.add("active")
  window.addEventListener("scroll", () => {
    for (let elt of sections) {
      let a = document.querySelector(`a[href*=${elt.id}]`)
      if (isElementInViewport(elt)) {
        if (!a.className.includes("active")) {
          a.classList.add("active")
        }
      } else {
        if (a.className.includes("active")) {
          a.classList.remove("active")
        }
      }
    }
  })
  equationMathField=MQ.MathField(equationInput,{})
}
function isElementInViewport(el) {
  //idea from https://stackoverflow.com/a/7557433, changed a lot
  if (typeof jQuery === "function" && el instanceof jQuery) {
    el = el[0];
  }

  var rect = el.getBoundingClientRect();
  let windowHeight = (window.innerHeight || document.documentElement.clientHeight)
  let windowWidth = (window.innerWidth || document.documentElement.clientWidth)
  return (
    ((rect.top >= 0 && rect.top <= windowHeight) ||
      (rect.bottom >= 0 && rect.bottom <= windowHeight) ||
      (rect.top < 0 && rect.bottom > windowHeight))
    &&
    ((rect.left >= 0 && rect.left <= windowWidth) ||
      (rect.right >= 0 && rect.rigt <= windowWidth) ||
      (rect.left < 0 && rect.right > windowWidth))
  )
}
function setKnownEquations(eqs) {
  for (let eq of eqs) {
    let eqNode = document.createElement("input")
    eqNode.className = "knownEquation"
    eqNode.value = eq
    try {
      parse_equation(eq)
    } catch (err) {
      eqNode.classList.add("error")
    }
    eqNode.addEventListener("blur", () => {
      if (eqNode.value == "") {
        eqNode.remove()
      }
      try {
        parse_equation(eqNode.value)
        eqNode.classList.remove("error")
      } catch (err) {
        eqNode.classList.add("error")
      }
    })
    knownEquationsDiv.appendChild(eqNode)
  }
}
function getKnownEquations() {
  let eqs = []
  let addedKnownEqs=Array.prototype.slice.call(addedKnownEquationsDiv.childNodes)
  let knownEqs=Array.prototype.slice.call(knownEquationsDiv.childNodes)
  for (let eqNode of addedKnownEqs.concat(knownEqs)) {
    if (eqNode.nodeName != "INPUT") {
      continue
    }
    if (!eqNode.className.includes("error")) {
      eqs.push(parse_equation(eqNode.value))
    }
  }
  return eqs
}
document.getElementById("settingsKnownEquationsForm").addEventListener("submit", evt => {
  evt.preventDefault()
  let eqNode = document.createElement("input")
  eqNode.className = "knownEquation"
  let eq = knownEquationsInput.value
  if(eq==""){
    return
  }
  knownEquationsInput.value = ""
  addedKnownEquationsDiv.appendChild(eqNode)
  eqNode.value=eq
  try {
    parse_equation(eq)
  } catch (err) {
    eqNode.classList.add("error")
  }
    save_added_known_equations()
  eqNode.addEventListener("blur", () => {
    if (eqNode.value == "") {
      eqNode.remove()
    }
    try {
      parse_equation(eqNode.value)
      eqNode.classList.remove("error")
    } catch (err) {
      eqNode.classList.add("error")
    }
    save_added_known_equations()
  })
})
function save_added_known_equations(){
  let eqs=[]
  for(let eqNode of addedKnownEquationsDiv.childNodes){
    if(eqNode.nodeName=="INPUT"&&!eqNode.className.includes("error")){
      eqs.push(eqNode.value)
    }
  }
  localStorage.setItem("added_known_equations",eqs.join("|||"))
}
function load_added_known_equations(){
  let eqs=localStorage.getItem("added_known_equations")
  if(!eqs){
    return
  }
  eqs=eqs.split("|||")
  for(let eq of eqs){
    let eqNode=document.createElement("input")
    eqNode.value=eq
    addedKnownEquationsDiv.appendChild(eqNode)
    eqNode.className="knownEquation"
      eqNode.addEventListener("blur", () => {
    if (eqNode.value == "") {
      eqNode.remove()
    }
    try {
      parse_equation(eqNode.value)
      eqNode.classList.remove("error")
    } catch (err) {
      eqNode.classList.add("error")
    }
    save_added_known_equations()
  })
  }
}
window.addEventListener("load",load_added_known_equations)
addUnitForm.addEventListener("submit",evt=>{
  evt.preventDefault()
  
})