export interface TreeNode {
  role: string
  name: string
  ignored: boolean
}

export interface TreeSummary {
  nodes: number
  controls: number
  namedControls: number
  headings: number
  landmarks: number
}

export const CONTROL_ROLES: readonly string[] = ['link', 'button', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'slider', 'spinbutton']
export const LANDMARK_ROLES: readonly string[] = ['banner', 'navigation', 'main', 'contentinfo', 'search', 'complementary', 'form', 'region']
export const MIN_NAMED_CONTROLS = 0.9

export function summariseTree(nodes: TreeNode[]): TreeSummary {
  const exposed = nodes.filter((node) => !node.ignored)
  const controls = exposed.filter((node) => CONTROL_ROLES.includes(node.role))
  return {
    nodes: exposed.length,
    controls: controls.length,
    namedControls: controls.filter((node) => node.name.trim() !== '').length,
    headings: exposed.filter((node) => node.role === 'heading').length,
    landmarks: exposed.filter((node) => LANDMARK_ROLES.includes(node.role)).length,
  }
}

export function isTreeUsable(tree: TreeSummary): boolean {
  return tree.controls > 0 && tree.namedControls / tree.controls >= MIN_NAMED_CONTROLS && tree.headings + tree.landmarks > 0
}
