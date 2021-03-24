// Macht expandieren und verstecken von Teilen der Seite möglich
class hideable {
  static init() {
    let hideables=document.getElementsByClassName("hideable")
    for (let i =0;i<hideables.length;i++) {
      let e=hideables[i]
      let html = e.innerHTML
      let hidename = "<button>-</button>"
      let expandname = "<button>+</button>"
      let title = ""
      let titleparam
      try{
      titleparam = e.getAttribute("desc")
      }
      catch(err) {
      throw err
      }
      if (titleparam) {
        title = titleparam
      }
      let hideparam = e.getAttribute("hidename")
      if (hideparam) {
        hidename = hideparam
      }
      let expandparam = e.getAttribute("expandname")
      if (expandparam) {
        expandname = expandparam
      }
      let buttons = `<span class="hideablebuttons${i}"><a class="hideablehide${i}">${hidename}</a><a class="hideableexpand${i}">${expandname}</a></span>`
      e.innerHTML = `<span class='hidedesc${i}'>${title}</span>${buttons}<div class="offset hcontent${i}">${html}</div>`
      let hide = document.getElementsByClassName("hideablehide"+i)[0]
      let expand = document.getElementsByClassName("hideableexpand"+i)[0]
      let content = e.getElementsByClassName("hcontent"+i)[0]
      let onhide = e.getAttribute("onhide")
      let onexpand = e.getAttribute("onexpand")
      let info = {
        hide,
        expand,
        e,
        content,
        onhide,
        onexpand
      }
      hide.onclick = function() {
        this.hide.style.display = "none"
        this.expand.style.display = "inline"
        this.content.style.display = "none"
        if (this.onhide) {
          eval(this.onhide)
        }
      }.bind(info)
      expand.onclick = function() {
        this.hide.style.display = "inline"
        this.expand.style.display = "none"
        this.content.style.display = "block"
        if (this.onexpand) {
          eval(this.onexpand)
        }
      }.bind(info)
      expand.style.display = "none"
      hide.click()
    }
  }
}