import { describe, expect, it } from 'vitest'
import { isTreeUsable, judgedTree, summariseTree, type TreeNode } from './tree'

function node(role: string, name = '', ignored = false): TreeNode {
  return { role, name, ignored }
}

describe('summariseTree', () => {
  it('counts exposed controls, named controls, headings and landmarks, skipping ignored nodes', () => {
    const nodes = [node('main'), node('heading', 'Prices'), node('link', 'Home'), node('button', ''), node('link', 'Hidden', true), node('StaticText', 'hello')]
    expect(summariseTree(nodes)).toEqual({ nodes: 5, controls: 2, namedControls: 1, headings: 1, landmarks: 1 })
  })
})

describe('isTreeUsable', () => {
  const base = { nodes: 100, controls: 20, namedControls: 20, headings: 3, landmarks: 2 }

  it('accepts a tree whose controls are named and that has something to orient by', () => {
    expect(isTreeUsable(base)).toBe(true)
  })

  it('rejects a tree with no controls to act on', () => {
    expect(isTreeUsable({ ...base, controls: 0, namedControls: 0 })).toBe(false)
  })

  it('rejects a tree where too many controls have no name', () => {
    expect(isTreeUsable({ ...base, namedControls: 17 })).toBe(false)
    expect(isTreeUsable({ ...base, namedControls: 18 })).toBe(true)
  })

  it('rejects a tree with no headings or landmarks', () => {
    expect(isTreeUsable({ ...base, headings: 0, landmarks: 0 })).toBe(false)
  })
})

describe('judgedTree', () => {
  const tree = { nodes: 10, controls: 2, namedControls: 2, headings: 1, landmarks: 0 }

  it('judges the tree of a page the engine passed', () => {
    expect(judgedTree({ outcome: 'passed', tree })).toBe(tree)
  })

  it('ignores the tree of a blocked or incomplete page, which describes a bot check or a partial page', () => {
    expect(judgedTree({ outcome: 'blocked', tree })).toBeNull()
    expect(judgedTree({ outcome: 'incomplete', tree })).toBeNull()
  })
})
