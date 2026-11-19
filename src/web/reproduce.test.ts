import { describe, expect, it } from 'vitest'
import { CLI_PACKAGE, reproduceCommand } from './reproduce'

describe('reproduceCommand', () => {
  it('runs the check command from the GitHub repository', () => {
    expect(CLI_PACKAGE).toBe('agentcanuse')
  })

  it('passes the site, the engine and every expected phrase, quoting what the shell would split', () => {
    expect(reproduceCommand({ url: 'https://www.zillow.com/', expect: ['Zillow', 'Buy now'] }, 'lightpanda')).toBe(
      "npx agentcanuse check https://www.zillow.com/ --engine lightpanda --expect=Zillow --expect='Buy now'",
    )
  })

  it('keeps a phrase that starts with a dash attached to its flag', () => {
    expect(reproduceCommand({ url: 'https://example.com/', expect: ['-5%'] })).toBe("npx agentcanuse check https://example.com/ --expect='-5%'")
  })

  it('escapes single quotes inside a phrase', () => {
    expect(reproduceCommand({ url: 'https://example.com/?a=1&b=2', expect: ["Today's outlook"] })).toBe(
      "npx agentcanuse check 'https://example.com/?a=1&b=2' --expect='Today'\\''s outlook'",
    )
  })
})
