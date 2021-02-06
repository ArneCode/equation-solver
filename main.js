function start() {
  try {
    let Tree = tokenize("2*a*b+1*a*b+100")
    Tree = createSyntaxTree(Tree)[0]
    console.log({Tree})
    console.log(token_to_text(Tree))
    console.log("result:",token_to_text(reduce_token(Tree)))
  } catch (e) {
    console.log(e.stack, e, e.message)
  }
}