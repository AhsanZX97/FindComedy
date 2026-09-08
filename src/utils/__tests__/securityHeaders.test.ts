import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const vercelConfig = readFileSync('vercel.json', 'utf8')

describe('deployment security headers', () => {
  it('sets a restrictive Content-Security-Policy for every route', () => {
    expect(vercelConfig).toContain('"key": "Content-Security-Policy"')
    expect(vercelConfig).toContain("default-src 'self'")
  })
})
