function start() {
  try {
    /*
    let Tree = tokenize("±2+3")
    console.log("tokenized: ",clone_entirely(Tree))
    Tree = createSyntaxTree(Tree)[0]
    console.log("Tree: ",clone_entirely({Tree}))
    console.log(token_to_text(Tree))
    Tree=reduce_completely(Tree)
    console.log("reduced:",clone_entirely(Tree))
    console.log("result:",token_to_text(Tree))*/
    let part1=reduce_token(parse("(a+2)^2"))
    let part2=reduce_token(parse("4"))
    console.log(token_to_text(part1)+"="+token_to_text(part2))
    let result=solve_equation(part1,part2,"a")
    part1=result.part1
    part2=result.part2
    //console.log("result: ",{part1,part2})
    console.log(token_to_text(part1)+"="+token_to_text(part2))
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
    if(result.type=="group"){
      result=result.content
    }
    resultText=token_to_text(result)
    console.log("result after reducing again:",{result,resultText})
  }
  console.log("finished loop",{before,resultText,result})
  return result
}