// This module encapsulates the browser enviromnent
import Axe from 'axe-core'

// Expect axe to be set up.
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
