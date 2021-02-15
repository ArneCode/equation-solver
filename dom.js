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
    //console.log("scrolling")
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
function getKnownEquations(){
  let eqs=[]
  console.log({knownEquationsDiv})
  for(let eqNode of knownEquationsDiv.childNodes){
    if(eqNode.nodeName!="INPUT"){
      console.log("skipping",eqNode,eqNode.nodeName)
      continue
    }
    console.log({eqNode})
    if(!eqNode.className.includes("error")){
      eqs.push(parse_equation(eqNode.value))
    }
  }
  return eqs
}