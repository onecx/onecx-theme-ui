import { of, throwError } from 'rxjs'
import { RefType } from './generated'
import { Utils } from './utils'

describe('util functions', () => {
  describe('http error status', () => {
    it('should map known status', () => {
      const status = Utils.mapping_error_status(404)

      expect(status).toEqual(404)
    })
    it('should map unknown status', () => {
      const status = Utils.mapping_error_status(405)

      expect(status).toEqual(0)
    })
  })

  describe('limitText', () => {
    it('should truncate text that exceeds the specified limit', () => {
      const result = Utils.limitText('hello', 4)

      expect(result).toEqual('hell...')
    })

    it('should return the original text if it does not exceed the limit', () => {
      const result = Utils.limitText('hello', 6)

      expect(result).toEqual('hello')
    })

    it('should return an empty string for undefined input', () => {
      const str: any = undefined
      const result = Utils.limitText(str, 5)

      expect(result).toEqual('')
    })

    it('should handle zero length text', () => {
      const result = Utils.limitText(null, 4)
      expect(result).toEqual('')
    })
  })

  it('should exclude props', () => {
    const obj = {
      name: 'John',
      surname: 'Doe',
      isVisible: true
    }
    const result = Utils.filterObject(obj, ['surname'])
    expect(result).toEqual({
      name: 'John',
      isVisible: true
    })
  })

  describe('sortByLocale', () => {
    it('should return 0 when both strings are identical', () => {
      const result = Utils.sortByLocale('apple', 'apple')
      expect(result).toBe(0)
    })

    it('should correctly sort strings ignoring case', () => {
      expect(Utils.sortByLocale('apple', 'Banana')).toBeLessThan(0)
      expect(Utils.sortByLocale('Banana', 'apple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with different cases', () => {
      expect(Utils.sortByLocale('Apple', 'apple')).toBe(0)
      expect(Utils.sortByLocale('apple', 'Apple')).toBe(0)
    })

    it('should correctly sort strings with special characters', () => {
      expect(Utils.sortByLocale('café', 'Cafe')).toBeGreaterThan(0)
      expect(Utils.sortByLocale('Cafe', 'café')).toBeLessThan(0)
    })

    it('should correctly sort strings with different alphabets', () => {
      expect(Utils.sortByLocale('äpple', 'banana')).toBeLessThan(0)
      expect(Utils.sortByLocale('banana', 'äpple')).toBeGreaterThan(0)
    })

    it('should correctly sort strings with numbers', () => {
      expect(Utils.sortByLocale('apple1', 'apple2')).toBeLessThan(0)
      expect(Utils.sortByLocale('apple2', 'apple1')).toBeGreaterThan(0)
    })
  })

  describe('sortByDisplayName', () => {
    it('should return negative value when first product name comes before second alphabetically', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'Admin' }
      const itemB = { id: 'b', name: 'name', displayName: 'User' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeLessThan(0)
    })

    it('should return positive value when first product name comes after second alphabetically', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'User' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeGreaterThan(0)
    })

    it('should return zero when product names are the same', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'Admin' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBe(0)
    })

    it('should be case-insensitive', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'admin' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBe(0)
    })

    it('should handle undefined names', () => {
      const itemA = { id: 'a', name: 'name', displayName: undefined }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeLessThan(0)
    })

    it('should handle empty string names', () => {
      const itemA = { id: 'a', name: 'name', displayName: '' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeLessThan(0)
    })

    it('should handle both names being undefined', () => {
      const itemA = { id: 'a', name: 'name', displayName: undefined }
      const itemB = { id: 'b', name: 'name', displayName: undefined }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBe(0)
    })
  })

  describe('prepareUrlPath', () => {
    it('should build a url with a path and insert a /', () => {
      const url = 'test url'
      const path = 'test path'

      const preparedUrl = Utils.prepareUrlPath(url, path)

      expect(preparedUrl).toBe('test url/test path')
    })

    it('should build a url', () => {
      const url = 'http://test url'

      const preparedUrl = Utils.prepareUrlPath(url)

      expect(preparedUrl).toBe(url)
    })

    it('should return empty string if there is no input', () => {
      const preparedUrl = Utils.prepareUrlPath()

      expect(preparedUrl).toBe('')
    })
  })

  describe('bffImageUrl', () => {
    it('should return a correct image path', () => {
      const basePath = 'base'
      const name = 'name'

      const preparedUrl = Utils.bffImageUrl(basePath, name, RefType.Logo)

      expect(preparedUrl).toBe('base/images/name/logo')
    })

    it('should return a path without base', () => {
      const basePath = undefined
      const name = 'name'

      const preparedUrl = Utils.bffImageUrl(basePath, name, RefType.Logo)

      expect(preparedUrl).toBe('/images/name/logo')
    })

    it('should return empty string if no name is provided', () => {
      const basePath = 'base'
      const name = undefined

      const preparedUrl = Utils.bffImageUrl(basePath, name, RefType.Favicon)

      expect(preparedUrl).toBeUndefined()
    })
  })

  describe('getCurrentDateTime', () => {
    beforeAll(() => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2025-06-30T14:05:09'))
    })

    afterAll(() => {
      jasmine.clock().uninstall()
    })

    it('should return formatted current date and time', () => {
      const result = Utils.getCurrentDateTime()
      expect(result).toBe('2025-06-30_140509')
    })
  })

  describe('getEndpointUrl', () => {
    let workspaceServiceMock: any
    let msgServiceMock: any
    const productName = 'testProduct'
    const appId = 'testApp'
    const endpointName = 'testEndpoint'

    beforeEach(() => {
      workspaceServiceMock = {
        doesUrlExistFor: jasmine.createSpy('doesUrlExistFor')
      }
      msgServiceMock = { error: jasmine.createSpy('error') }
      spyOn(console, 'error')
    })

    it('should endpoint exist', () => {
      workspaceServiceMock.doesUrlExistFor.and.returnValue(of(true))

      const exist = Utils.doesEndpointExist(workspaceServiceMock, msgServiceMock, productName, appId, endpointName)

      expect(exist).toBeTrue()
    })

    it('should endpoint NOT exist', () => {
      workspaceServiceMock.doesUrlExistFor.and.returnValue(of(false))

      const exist = Utils.doesEndpointExist(workspaceServiceMock, msgServiceMock, productName, appId, endpointName)

      expect(exist).toBeFalse()
      expect(console.error).toHaveBeenCalled()
      expect(msgServiceMock.error).toHaveBeenCalled()
    })

    it('should get endpoint failed', () => {
      const errorResponse = { status: 403, statusText: 'No permissions' }
      workspaceServiceMock.doesUrlExistFor.and.returnValue(throwError(() => errorResponse))

      const exist = Utils.doesEndpointExist(workspaceServiceMock, msgServiceMock, productName, appId, endpointName)

      expect(exist).toBeFalse()
      expect(console.error).toHaveBeenCalledWith('doesUrlExistFor', errorResponse)
    })
  })
})
