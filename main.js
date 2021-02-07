function start() {
  try {
    let Tree = tokenize("2*2")//a*b*2+b*a*3
    console.log(clone_entirely(Tree))
    Tree = createSyntaxTree(Tree)[0]
    console.log({Tree})
    console.log(token_to_text(Tree))
    Tree=reduce_completely(Tree)
    console.log("reduced:",clone_entirely(Tree))
    console.log("result:",token_to_text(Tree))
  } catch (e) {
    console.log(e.stack, e, e.message)
  }
}
function reduce_completely(token){
  let before=[]
  let result=reduce_token(token)
  let resultText=token_to_text(result)
  while(!before.includes(resultText)){
    console.log("new loop")
    before.push(resultText)
    result=reduce_token(result)
    resultText=token_to_text(result)
  }
  console.log("finished loop",{before,resultText,result})
  return result
}