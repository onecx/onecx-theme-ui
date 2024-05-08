import { SelectItem } from 'primeng/api'
import { dropDownSortItemsByLabel, filterObject, limitText, prepareUrlPath, bffImageUrl } from './utils'
import { RefType } from './generated'

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

  describe('dropDownSortItemsByLabel', () => {
    it('should correctly sort items by label', () => {
      const items: SelectItem[] = [
        { label: 'label2', value: 2 },
        { label: 'label1', value: 1 }
      ]

      const sortedItems = items.sort(dropDownSortItemsByLabel)

      expect(sortedItems[0].label).toEqual('label1')
    })

    it("should treat falsy values for SelectItem.label as ''", () => {
      const items: SelectItem[] = [
        { label: undefined, value: 1 },
        { label: undefined, value: 2 },
        { label: 'label1', value: 2 }
      ]

      const sortedItems = items.sort(dropDownSortItemsByLabel)

      expect(sortedItems[0].label).toEqual(undefined)
    })
  })

  // describe('prepareUrl', () => {
  //   it('should build a url with env api prefix if url does not start with http(s)', () => {
  //     const url = 'http://test url'

  //     const preparedUrl = prepareUrl(url)

  //     expect(preparedUrl).toBe(url)
  //   })

  //   it('should build a url with env api prefix if url does not start with http(s)', () => {
  //     const url = 'test url'

  //     const preparedUrl = prepareUrl(url)

  //     expect(preparedUrl).toBe('bff/test url')
  //   })
  // })

  describe('prepareUrlPath', () => {
    it('should build a url with a path and insert a /', () => {
      const url = 'test url'
      const path = 'test path'

      const preparedUrl = prepareUrlPath(url, path)

      expect(preparedUrl).toBe('test url/test path')
    })

    it('should build a url', () => {
      const url = 'http://test url'

      const preparedUrl = prepareUrlPath(url)

      expect(preparedUrl).toBe(url)
    })

    it('should return empty string if there is no input', () => {
      const preparedUrl = prepareUrlPath()

      expect(preparedUrl).toBe('')
    })
  })

  describe('bffImageUrl', () => {
    it('should return empty string if no name is provided', () => {
      const basePath = 'base'
      const name = undefined

      const preparedUrl = bffImageUrl(basePath, name, RefType.Favicon)

      expect(preparedUrl).toBe('')
    })
  })
})
