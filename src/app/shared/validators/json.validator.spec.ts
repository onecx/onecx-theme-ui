import { FormControl } from '@angular/forms'
import { jsonValidator } from './json.validator'

describe('jsonValidator', () => {
  const validator = jsonValidator()

  const validate = (value: string | null | undefined) => validator(new FormControl(value))

  it('should return null for null', () => {
    expect(validate(null)).toBeNull()
  })

  it('should return null for an empty string', () => {
    expect(validate('')).toBeNull()
  })

  it('should return null for a whitespace-only string', () => {
    expect(validate('   ')).toBeNull()
  })

  it('should return null for a valid JSON object', () => {
    expect(validate('{ "a": 1 }')).toBeNull()
  })

  it('should return an error for invalid JSON', () => {
    expect(validate('{ a: 1 ')).toEqual({ invalidJson: { value: '{ a: 1 ' } })
  })
})
