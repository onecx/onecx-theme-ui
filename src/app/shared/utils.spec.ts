import { SelectItem } from 'primeng/api'
import { dropDownSortItemsByLabel, filterObject, limitText, prepareUrlPath, bffImageUrl, sortByLocale } from './utils'
import { RefType } from './generated'

describe('util functions', () => {
  describe('limitText', () => {
    it('should truncate text that exceeds the specified limit', () => {
      const result = limitText('hello', 4)

      expect(result).toEqual('hell...')
    })

    it('should return the original text if it does not exceed the limit', () => {
      const result = limitText('hello', 6)

      expect(result).toEqual('hello')
    })

    it('should return an empty string for undefined input', () => {
      const str: any = undefined
      const result = limitText(str, 5)

      expect(result).toEqual('')
    })

    it('should handle zero length text', () => {
      const result = limitText(null, 4)
      expect(result).toEqual('')
    })
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

  describe('sortByLocale', () => {
    it('should return 0 when both strings are identical', () => {
      const result = sortByLocale('apple', 'apple')
      expect(result).toBe(0)
    })

    it('should correctly sort strings ignoring case', () => {
      expect(sortByLocale('apple', 'Banana')).toBeLessThan(0)
      expect(sortByLocale('Banana', 'apple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with different cases', () => {
      expect(sortByLocale('Apple', 'apple')).toBe(0)
      expect(sortByLocale('apple', 'Apple')).toBe(0)
    })

    it('should correctly sort strings with special characters', () => {
      expect(sortByLocale('café', 'Cafe')).toBeGreaterThan(0)
      expect(sortByLocale('Cafe', 'café')).toBeLessThan(0)
    })

    it('should correctly sort strings with different alphabets', () => {
      expect(sortByLocale('äpple', 'banana')).toBeLessThan(0)
      expect(sortByLocale('banana', 'äpple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with numbers', () => {
      expect(sortByLocale('apple1', 'apple2')).toBeLessThan(0)
      expect(sortByLocale('apple2', 'apple1')).toBeGreaterThan(0)
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
    it('should return a correct image path', () => {
      const basePath = 'base'
      const name = 'name'

      const preparedUrl = bffImageUrl(basePath, name, RefType.Logo)

      expect(preparedUrl).toBe('base/images/name/logo')
    })

    it('should return a path without base', () => {
      const basePath = undefined
      const name = 'name'

      const preparedUrl = bffImageUrl(basePath, name)

      expect(preparedUrl).toBe('/images/name/logo')
    })

    it('should return empty string if no name is provided', () => {
      const basePath = 'base'
      const name = undefined

      const preparedUrl = bffImageUrl(basePath, name, RefType.Favicon)

      expect(preparedUrl).toBe('')
    })
  })
})
