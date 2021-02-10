function start() {
  try {
    /*
    let Tree = tokenize("(a/3)*(3/a)")
    console.log("tokenized: ",clone_entirely(Tree))
    Tree = createSyntaxTree(Tree)[0]
    console.log("Tree: ",clone_entirely({Tree}))
    console.log(token_to_text(Tree))
    Tree=reduce_completely(Tree)
    console.log("reduced:",clone_entirely(Tree))
    console.log("result:",token_to_text(Tree))//*/
    
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
    console.log("Solution(s):\n",equationsText)//*/
  } catch (e) {
    console.log(e.stack, e, e.message)
  }
}
function reduce_completely(token,mode="simplify"){
  let before=[]
  let result=reduce_token(token,mode)
  let resultText=token_to_text(result)
  while(!before.includes(resultText)){
    //console.log("new loop",token_to_text(result))
    before.push(resultText)
    result=reduce_token(parse(resultText),mode)
    if(result.type=="group"){
      result=result.content
    }
    resultText=token_to_text(result)
    //console.log("result after reducing again:",{result,resultText})
  }
  //console.log("finished loop",{before,resultText,result})
  return result
}