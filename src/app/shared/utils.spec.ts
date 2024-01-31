import { filterObject, limitText } from './utils'

describe('utils', () => {
  it('should limit text if text too long', () => {
    const result = limitText('textData', 4)
    expect(result).toBe('text...')
  })

  it('should exclude props', () => {
    const obj = {
      name: 'John',
      surname: 'Doe',
      isVisible: true
    }
    const result = filterObject(obj, ['surname'])
    expect(result).toEqual({
      name: 'John',
      isVisible: true
    })
  })
})
