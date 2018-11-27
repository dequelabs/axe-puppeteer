// This module encapsulates the browser enviromnent
import * as Axe from 'axe-core'

// Expect axe to be set up.
// Tell Typescript that there should be a variable called `axe` that follows
// the shape given by the `axe-core` typings (the `run` and `configure` functions).
declare var axe: typeof Axe
// Defined at top-level to clarify that it can't capture variables from outer scope.
export function runAxe(
  config: Axe.Spec | null,
  context: Axe.ElementContext | null,
  options: Axe.RunOptions | null
) {
  if (config !== null) {
    axe.configure(config)
  }
  return axe.run(context || document, options || {})
}

export function pageIsLoaded() {
  return document.readyState === 'complete'
}
