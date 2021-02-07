function start() {
  try {
    let Tree = tokenize("2/(-1)")
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
    console.log("new loop",token_to_text(result))
    before.push(resultText)
    result=reduce_token(parse(resultText))
    resultText=token_to_text(result)
    console.log("result after reducing again:",{result,resultText})
  }
  console.log("finished loop",{before,resultText,result})
  return result
}