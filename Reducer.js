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
function groupWother(a, b, params, already_reduced = [], level = 0) {
  level++
  let { operandObj, operandText, reduce_modes } = params
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
  let otherText = token_to_text(other)
  if ((gContent.level >= operandObj.level || (gContent.name == "punkt" && operandObj.name == "div")) && !(gContent.name == "div" && operandObj.name == "div")) {
    let newText
    if (gFirst) {
      newText = token_to_text(gContent) + operandText + otherText
    } else {
      if (operandObj.name == "div" && gContent.name == "punkt") {
        return null
      }
      newText = otherText + operandText + token_to_text(gContent)
    }
    let newToken = parse(newText)
    newToken = reduce_token(newToken, reduce_modes, already_reduced, level)
    return newToken
  } else if (!((other.name == "pow" && gContent.level == 0) || (gContent.name == "div" && operandObj.name == "div"))) {
    let newTexts = []
    let content = []//subnodes of content in group
    if (gContent.type == "op") {
      return null
    } else if (gContent.type == "opChain") {
      content = gContent.content
    } else {
      return null
    }
    for (let subnode of content) {
      let text = token_to_text(subnode) + operandText + otherText
      newTexts.push(text)
    }
    let newText = newTexts.join(gContent.operand)
    let newToken = parse(newText)
    try {
      newToken = reduce_token(newToken, reduce_modes, already_reduced, level)
    } catch (err) {
      throw err
    }
    return newToken
  }
  return null
}
function doAction(newVal, modes) {
  //deside if reducer should do action if newVal is the resulting number and mode is the active mode
  if (modes.calc_completely) {
    return true
  }
  newVal = String(newVal)
  let ptIndex = newVal.indexOf(".")
  if (ptIndex == -1) {
    return true
  } else {
    let nAfterComma = (newVal.length - ptIndex) - 1
    if (nAfterComma >= Number(calcCompletelyStop.value)) {
      return false
    }
  }
  return true
}
function tryForm(testText, modes, already_reduced, level) {
  let testToken = parse(testText)
  testToken = remove_unnessesary_brackets(testToken, level)
  testText = token_to_text(testToken)
  testToken = reduce_token(testToken, modes, already_reduced, level)
  if (token_to_text(testToken) != testText) {
    return testToken
  }
  return null
}
function replaceVar(text, var_name, content) {
  for (let i = 0; i < text.length; i++) {
    let upcoming = text.substr(i, var_name.length)
    if (upcoming == var_name && text[i - 1] != "[") {
      text = text.substr(0, i) + "(" + content + ")" + text.substr(i + var_name.length)
    }
  }
  return text
}
function getTokenComplexity(token) {
  let complexity = 0
  for (let subToken of getSubTokens(token)) {
    complexity++
    if (subToken.isRootForm) {
      complexity += 0.1
    } else if (subToken.type == "number") {
      complexity += String(subToken.val).length / 3
    }
  }
  return complexity
}
function getSubTokens(token) {
  let subTokens = [token]
  if (token.type == "op") {
    subTokens = subTokens.concat(getSubTokens(token.val0), getSubTokens(token.val1))
  } else if (token.type == "opChain") {
    for (let subNode of token.content) {
      subTokens = subTokens.concat(getSubTokens(subNode))
    }
  } else if (token.type == "group") {
    subTokens = subTokens.concat(getSubTokens(token.content))
  }
  return subTokens
}
function getSubTypes(token) {
  let types = []
  for (let subToken of getSubTokens(token)) {
    types.push(subToken)
  }
  return types
}
function reduce_token(token, modes = { simplify: "true" }, already_reduced = [], level = 0) {
  //modes:
  //simplify, expand, calc_completely, compact, disperse
  if (token_to_text(token).includes("Infinity")) {
    throw new Error("Infinity")
  }
  level++
  let simplified_text = token_to_text(token) + JSON.stringify(modes)
  if (already_reduced.includes(simplified_text)) {
    return token
  }
  if (level >= 20) {
    console.log(new Error("to deep"))
    return token
  }
  already_reduced = [...already_reduced, simplified_text]
  if (token.type == "op") {
    let val0 = token.val0 = reduce_token(token.val0, modes, already_reduced, level)
    let val1 = token.val1 = reduce_token(token.val1, modes, already_reduced, level)
    if (token.name == "pow") {
      if(val1.val==0){
        return parse("1")
      }
      if (token.isRootForm) {
        if (getTokenComplexity(token.val1) <= getTokenComplexity(token.rootExp) && token.val1.val != 2) {
          let newText = "(" + token_to_text(token.val0) + ")" + "^" + token_to_text(token.val1)
          newToken = parse(newText)
          newToken = reduce_token(newToken, modes, already_reduced, level)
          return newToken
        }
      } else {
        let rootExp = parse(`1/(${token_to_text(token.val1)})`)
        rootExp = reduce_token(rootExp, modes, already_reduced, level)
        if (getTokenComplexity(rootExp) < getTokenComplexity(token.val1)) {
          let newText = ``
        }
      }
      if (val0.name == "pow") {
        let newBaseExpText = "(" + token_to_text(val0.val1) + "*" + token_to_text(val1) + ")"
        val0.val1 = reduce_token(parse(newBaseExpText), modes, already_reduced, level)
        return val0
      } if (val0.type == "group" && modes.expand) {
        let gContent = val0.content
        if (gContent.name == "punkt") {
          let testText = "(" + gContent.content.map(t => "(" + token_to_text(t) + ")" + "^" + token_to_text(val1)).join("*") + ")"
          let testToken = tryForm(testText, modes, already_reduced, level)
          if (testToken) {
            return testToken
          }
        } else if (gContent.name == "div") {
          let testText = `((${token_to_text(gContent.val0)}^${token_to_text(val1)})/${token_to_text(gContent.val1)}^${token_to_text(val1)})`
          let testToken = parse(testText)
          testToken = reduce_token(testToken, modes, already_reduced, level)
          if (token_to_text(testToken) != testText) {
            return testToken
          }
        }
      }
      if (val1.type == "number") {
        if (val0.type == "number") {
          if (val1.val % 1 != 0 && val0.val < 0) {
            throw new NegativeRootError("negative root, solution might be to implement i", val0.val, val1.val)
          }
          let newVal = val0.val ** val1.val
          if (doAction(newVal, modes)) {
            return parse(String(newVal))
          }
        }
        if (["group"].includes(val0.type) && modes.expand && val1.val > 1) {
          let gText = token_to_text(val0)
          let testTexts = new Array(Math.floor(val1.val)).fill(gText)
          let rest = val1.val % 1
          if (rest != 0) {
            testTexts.push(gText + "^" + rest)
          }
          let testText = testTexts.join("*")
          let testToken = parse(testText)
          testToken = reduce_token(testToken, modes, already_reduced, level)
          if (testText != token_to_text(testToken)) {
            return testToken
          } else {
            return token
          }
        }
        else if (val1.val == 1) {
          return val0
        } else if (val1.val == 0) {
          return parse("1")
        } else if (val1.val < 0) {
          let newText = `(1/(${token_to_text(val0)})^${Math.abs(val1.val)})`
          let newToken = parse(newText)
          newToken = reduce_token(newToken, modes, already_reduced, level)
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
      if (val1.val == 0) {
        console.log("zerodivisionerror with:",clone_entirely({token,text:token_to_text(token)}))
        throw new ZeroDivisionError()
      }
      if (val0.val == 0) {
        return parse("0")
      }
      let info0 = getInfo(val0)
      let info1 = getInfo(val1)
      if (info0.kind == info1.kind) {
        let newVal = info0.factor / info1.factor
        if (doAction(newVal, modes))
          return parse(String(newVal))
        else return token
      }
      if (modes.expand) {
        let gwotherResult = groupWother(val0, val1, { operandText: token.operand, operandObj: token, reduce_modes: modes }, already_reduced)
        if (gwotherResult) {
          return gwotherResult
        }
      }
      if (val0.type == "number" && val1.type == "number") {
        let newVal = val0.val / val1.val
        if (doAction(newVal, modes)) {
          val0.val = newVal
          val0.text = String(newVal)
          return val0
        }
        else return token
      }
      if (val1.name == "div") {
        let testText = `(${token_to_text(val0)}*${token_to_text(val1.val1)})/${token_to_text(val1.val0)}`
        let testToken = parse(testText)
        testToken = reduce_token(testToken, modes, already_reduced, level)
        if (token_to_text(testToken) != testText) {
          return testToken
        } else {
          testText = `(${token_to_text(val0)}/${token_to_text(val1.val0)})*${token_to_text(val1.val1)}`
          testToken = parse(testText)
          testToken = reduce_token(testToken, modes, already_reduced, level)
          if (token_to_text(testToken) != testText) {
            return testToken
          }
        }
      }
      if (val0.type == "group" && val1.type == "group") {
        let gInfo0 = getInfo(val0.content)
        let gInfo1 = getInfo(val1.content)
        if (gInfo0.kind == gInfo1.kind) {
          let newVal = gInfo0.factor / gInfo1.factor
          if (doAction(newVal, modes))
            return parse(String(newVal))
        }
      }
      else if (val0.type == "group") {
        let gInfo = getInfo(val0.content)
        let info1 = getInfo(val1)
        if (gInfo.kind == info1.kind) {
          let newVal = gInfo.factor / info1.factor
          if (doAction(newVal, modes))
            return parse(String(newVal))
          else return token
        }
        if (val0.content.name == "div") {
          let gContent = val0.content
          let newText = `${token_to_text(gContent.val0)}/(${token_to_text(gContent.val1)}*${token_to_text(val1)})`
          let newToken = parse(newText)
          newToken = reduce_token(newToken, modes, already_reduced, level)
          return newToken
        }
      }
      else if (val1.type == "group") {
        let gInfo = getInfo(val1.content)
        info0 = getInfo(val0)
        if (gInfo.kind == info0.kind) {
          let newVal = String(info0.factor / gInfo.factor)
          if (doAction(newVal, modes))
            return parse(String(newVal))
          else return token
        } else if (val1.content.name == "punkt") {
          let val0Text = token_to_text(val0)
          let content = val1.content.content
          for (let sub_i = 0; sub_i < content.length; sub_i++) {
            let subnode = content[sub_i]
            let testText = token_to_text(val0) + "/" + token_to_text(subnode)
            let testToken = parse(testText)
            testToken = reduce_token(testToken)
            if (token_to_text(testToken) != testText) {
              content.splice(sub_i, 1)
              let newText = token_to_text(testToken) + "*1/" + token_to_text(val1)
              let newToken = parse(newText)
              newToken = reduce_token(newToken)
              return newToken
            }
          }
        } else if (val1.content.name == "div") {
          token.val1 = val1.content
          let newText = token_to_text(token)
          let newToken = parse(newText)
          newToken = reduce_token(newToken, modes, already_reduced, level)
          return newToken
        }
      }
      if (val0.name == "pow" && val1.name == "pow") {
        if (token_to_text(val0.val0) == token_to_text(val1.val0)) {
          let newExp = parse(`(${token_to_text(val0.val1)}-${token_to_text(val1.val1)})`)
          newExp = reduce_token(newExp, modes, already_reduced, level)
          val0.val1 = newExp
          return val0
        }
      } else if (val0.name == "pow") {
        if (token_to_text(val0.val0) == token_to_text(val1)) {
          let newExp = parse(`(${token_to_text(val0.val1)}-1)`)
          newExp = reduce_token(newExp, modes, already_reduced, level)
          val0.val1 = newExp
          return val0
        }
      } else if (val1.name == "pow") {
        if (token_to_text(val1.val0) == token_to_text(val0)) {
          let newExp = parse(`1-(${token_to_text(val1.val1)})`)
          newExp = reduce_token(newExp, modes, already_reduced, level)
          val1.val1 = newExp
          return val1
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
    token.content = token.content.map(elt => reduce_token(elt, modes, already_reduced, level))
    if (modes.expand) {
      token.content.eachWeach(function (elt1, elt2, loop_info) {
        let { i1, i2, list, restart_loop } = loop_info
        let result = groupWother(elt1, elt2, { operandText: token.operand, operandObj: token, reduce_modes: modes }, already_reduced)
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
      token.content = token.content.filter(elt => elt.val != 0)
      token.content.eachWeach(function (elt1, elt2, loop_info) {
        let info1 = getInfo(elt1)
        let info2 = getInfo(elt2)
        if (elt1.type == "group") {
          if (["number", "sign"].includes(elt1.content.type)) {
            info1 = getInfo(elt1.content)
          }
        }
        if (elt2.type == "group") {
          if (["number", "sign"].includes(elt2.content.type)) {
            info1 = getInfo(elt2.content)
          }
        }
        if (info1.kind == info2.kind) {
          let newVal = ((info1.factorText || info1.factor) + ((info1.factorText || info2.factorText) ? "+" : 0) + (info2.factorText || info2.factor))
          let newText = "(" + newVal + ")" + (info1.kind ? ("*" + info1.kind) : "")
          let { list, i1, i2, restart_loop } = loop_info
          list.splice(i2, 1)
          restart_loop()
          list[i1] = parse(newText)
        }
      })
      if (token.content.length == 1) {
        return token.content[0]
      }
      return token
    } else if (token.name == "punkt") {
      if (token.content.some(elt => elt.val == 0)) {
        return parse("0")
      }
      if (token.content.length > 1) {
        token.content = token.content.filter(elt => elt.val != 1)
      }
      if (token.content.length == 0) {
        return parse("1")
      }
      let isNegative = false
      for (let subIndex in token.content) {
        let subnode = token.content[subIndex]
        if (subnode.type == "number") {
          if (subnode.val < 0) {
            subnode.val = Math.abs(subnode.val)
            isNegative = !isNegative
          }
        } else if (subnode.type == "sign") {
          if (subnode.text == "-") {
            token.content[subIndex] = subnode.val
            isNegative = !isNegative
          }
        }
      }
      if (isNegative) {
        token.content[0] = parse("-" + token_to_text(token.content[0]))
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
            newExp = reduce_token(newExp, modes, already_reduced, level)
            elt1.val1 = newExp
            if (elt1.isRootForm) {
              let rootExp = parse("1/" + newExpText)
              rootExp = reduce_token(rootExp, modes, already_reduced, level)
              elt1.rootExp = rootExp
            }
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
              list[i1] = reduce_token(parse(newText), modes, already_reduced, level)
              list.splice(i2, 1)
              return restart_loop()
            }
          }
        }
        if (info1.kind == info2.kind) {
          if (info1.kind == "") {
            let newVal = info1.factor * info2.factor
            list[i1] = parse(String(newVal))
            list.splice(i2, 1)
            return restart_loop()
          } else {
            let newText = "(" + token_to_text(elt1) + ")" + "^2"
            list[i1] = reduce_token(parse(newText), modes, already_reduced, level)
            list.splice(i2, 1)
            return restart_loop
          }
        }
        if (elt1.val == 1) {
          list[i1] = elt2
          list.splice(i2, 1)
          restart_loop()
        }
        if (elt2.val == 1) {
          list.splice(i2, 1)
          restart_loop()
        }
        if (elt1.name == "div" && elt2.name == "div") {
          let testText = `(${token_to_text(elt1.val0)}*${token_to_text(elt2.val0)})/(${token_to_text(elt1.val1)}*${token_to_text(elt2.val1)})`
          let testToken = parse(testText)
          testToken = reduce_token(testToken, modes, already_reduced, level)
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
          testToken = reduce_token(testToken, modes, already_reduced, level)
          if (token_to_text(testToken) != testText) {
            list[i1] = div.val0
            list[i2] = testToken
            return restart_loop()
          } else {
            testText = "(" + token_to_text(other) + "*" + token_to_text(div.val0) + ")"
            let testToken = parse(testText)
            testToken = reduce_token(testToken, modes, already_reduced, level)
            if (token_to_text(testToken) != testText) {
              let newText = token_to_text(testToken) + "/" + token_to_text(div.val1)
              list[i1] = parse(newText)
              list.splice(i2, 1)
              return restart_loop()
            }
          }
        }
        if (elt1.type == "group" || elt2.type == "group" && !(elt1.type == "group" && elt2.type == "group")) {
          let group, other
          if (elt1.type == "group") {
            group = elt1
            other = elt2
          } else {
            group = elt2
            other = elt1
          }
          if (group.content.type == "number" && other.type == "number") {
            list[i1] = parse(String(group.content.val * other.val))
            list.splice(i2, 1)
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
    token.content = reduce_token(token.content, modes, already_reduced, level)
    let { content } = token
    return remove_unnessesary_brackets(token, level)
  } else if (token.type == "sign") {
    let val = token.val = reduce_token(token.val, modes, already_reduced, level)
    if (token.text == "-") {
      let testText = "-1*(" + token_to_text(val) + ")"
      let testToken = reduce_token(parse(testText), modes, already_reduced, level)
      if (token_to_text(testToken) != testText) {
        return testToken
      } else {
        if (val.type == "group") {
          val = val.content
        }
        if (val.type == "number") {
          return parse(String(val.val * -1))
        } else if (val.text == "-") {
          return val.val
        }
      }
      return token
    } else if (token.val.val == 0) {
      return token.val
    }
  } else if (token.type == "action") {
    if (token.name == "deriv") {
      return deriviate(token.val,token.searched)
    }
    return token
  }
  return token
}
function deriviate(token, searched, modes={}, already_reduced = [], level = 0) {
  token = reduce_token(token, modes, already_reduced, level)
  let ks = getCoefficients(token,searched)
  console.log("ks",ks)
  let newTexts=[]
  for(let k of ks){
    let newText=k.k+"*("+k.exp+")*"+searched+"^("+k.exp+"-1)"
    newTexts.push(newText)
  }
  let newText = newTexts.join("+")
  console.log("newText",newText)
  let newToken=parse(newText)
  newToken=reduce_token(newToken,modes,already_reduced,level)
  return newToken
}
function remove_unnessesary_brackets(token, level = 0) {
  let f = (token, level) => {
    if (token.type == "group") {
      let content = token.content
      if (level == 0) {
        return remove_unnessesary_brackets(content, level + 1)
      }
      if (["group", "unit", "word"].includes(content.type)) {
        return remove_unnessesary_brackets(content, level + 1)
      } else if (content.type == "number") {
        if (content.val >= 0) {
          return remove_unnessesary_brackets(content, level + 1)
        }
      } else {
        token.content = remove_unnessesary_brackets(content, level + 1)
      }
      return token
    } else if (token.type == "op") {
      token.val0 = remove_unnessesary_brackets(token.val0, level + 1)
      token.val1 = remove_unnessesary_brackets(token.val1, level + 1)
      return token
    } else if (token.type == "opChain") {
      token.content = token.content.map(elt => remove_unnessesary_brackets(elt, level + 1))
    } else if (token.type == "sign") {
      token.val = remove_unnessesary_brackets(token.val, level + 1)
    }
    return token
  }
  let result = f(token, level)
  return result
}
function getInfo(token) {
  let info = {}
  if (token.type == "opChain") {
    let content = [...token.content]
    if (token.name == "punkt") {
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
    if (token.text == "-") {
      let valInfo = getInfo(token.val)
      let info = { factor: -1 * valInfo.factor, kind: valInfo.kind }
      if (valInfo.factorText) {
        info.factorText = "-" + valInfo.factorText
      }
      return info
    }
  } else if (token.type == "op") {
    let val0 = token.val0
    let val1 = token.val1
    if (token.name == "div") {
      if (["number"].includes(val0.type)) {
        return { factor: val0.val, kind: "1/" + getInfo(val1).kind }
      } else if (val1.type == "number") {
        let factor = 1 / val1.val
        let info = { factor: factor, kind: getInfo(val0).kind }
        if (!doAction(factor, {})) {
          let factorText = "1/" + val1.val
          if (factorText.length < String(factor).length) {
            info.factorText = factorText
          }
        }
        return info
      }
    }
  }
  return { factor: 1, kindObj: token, kind: token_to_text(token) }
}
function token_to_text(token) {
  try {
    if (token.type.isOf(["number", "word"])) {
      return token.text
    } else if (token.type == "op") {
      let val0 = token_to_text(token.val0)
      let val1 = token_to_text(token.val1)
      if (token.name == "pow" && token.isRootForm) {
        let rootExp = token_to_text(token.rootExp)
        let result
        if (rootExp == "2") {
          result = String.fromCharCode(92) + `sqrt{${val0}}`
        } else {
          result = String.fromCharCode(92) + `sqrt[${rootExp}]{${val0}}`
        }
        return result
      }
      let result = val0 + token.operand + val1
      return result
    } else if (token.type == "opChain") {
      let text = token.content.map(elt => token_to_text(elt))
      text = text.join(token.operand)
      return text
    } else if (token.type == "group") {
      return "(" + token_to_text(token.content) + ")"
    } else if (token.type == "sign") {
      return token.text + token_to_text(token.val)
    } else if (token.type == "action") {
      if (token.name == "deriv") {
        return `dy/dx(` + token_to_text(token.val) + ")"
      }
    } else {
      return token.text
    }
  } catch (err) {
    console.log("token_to_text error", token)
    throw err
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
class ZeroDivisionError extends Error {
  constructor() {
    super("ZeroDivisionError")
  }
}
function reduce_completely(token, modes = { simplify: true }, historyNode = null) {
  let before = []
  let beforeText = token_to_text(token)
  let result = reduce_token(token, modes)
  let resultAfter = clone_entirely(result)
  let resultText
  resultText = token_to_text(result)
  while (!before.includes(resultText)) {
    before.push(resultText)
    result = reduce_token(parse(resultText), modes)
    if (result.type == "group") {
      result = result.content
    }
    resultText = token_to_text(result)
  }
  if (beforeText != resultText && historyNode) {
    let title = "Simplifying expression"
    let thisNode = document.createElement("div")
    thisNode.innerHTML = `
      <span class="historyBlock">${beforeText}</span>
      <span>↓</span>
      <span class="historyBlock">${resultText}</span>`
    historyNode.appendChild(thisNode)
  }
  return result
}
function reduce_equation(part1, part2, modes = { simplify: true }, historyNode = null) {
  let part1TextBefore = token_to_text(part1)
  let part2TextBefore = token_to_text(part2)
  let nullElt = document.createElement("div")
  part1 = reduce_completely(part1, modes, nullElt)
  part2 = reduce_completely(part2, modes, nullElt)
  if (token_to_text(part1) != part1TextBefore || token_to_text(part2) != part2TextBefore) {
    let title = "Simplifying equation"
    let thisNode = document.createElement("div")
    thisNode.innerHTML = `
    <h3>${title}</h3>
    <span class="historyBlock">${part1TextBefore} = ${part2TextBefore}</span>
    <span>↓</span>
      <span class="historyBlock">${token_to_text(part1)} = ${token_to_text(part2)}</span>
    `
    historyNode.appendChild(thisNode)
  }
  return [part1, part2]
}