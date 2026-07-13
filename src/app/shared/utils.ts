import { Location } from '@angular/common'
import { catchError, first, of, tap } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'
import { DictionaryObject, ThemeProperties, ThemePropertyPath } from './models/theme.model'

export enum LogoRefType {
  Logo = 'logo',
  LogoSmall = 'logo-small',
  Favicon = 'favicon'
}

// This object encapsulated function because ...
//  ...Jasmine has problems to spying direct imported functions
export const Utils = {
  mapping_error_status(status: number): number {
    return [0, 400, 401, 403, 404, 500].includes(status) ? status : 0
  },

  limitText(text: string | null | undefined, limit: number): string {
    if (text) {
      return text.length < limit ? text : text.substring(0, limit) + '...'
    } else {
      return ''
    }
  },

  sortByLocale(a: string, b: string): number {
    return a.toUpperCase().localeCompare(b.toUpperCase())
  },
  sortByDisplayName(a: { displayName?: string }, b: { displayName?: string }): number {
    return (a.displayName ? a.displayName.toUpperCase() : '').localeCompare(
      b.displayName ? b.displayName.toUpperCase() : ''
    )
  },

  /**
   * Filter objects => exclude given properties
   */
  filterObject(obj: Record<string, unknown>, exProps: string[]): Record<string, unknown> {
    const pickedObj: Record<string, unknown> = {}
    for (const prop in obj) {
      if (!exProps.includes(prop)) {
        pickedObj[prop] = obj[prop]
      }
    }
    return pickedObj
  },

  /**
   * URLs
   */
  prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  },
  bffImageUrl(basePath: string | undefined, name: string | undefined, refType: LogoRefType): string | undefined {
    return name ? (basePath ?? '') + '/images/' + name + '/' + refType : undefined
  },

  /**
   * Date & time
   */
  getCurrentDateTime(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}_${hours}${minutes}${seconds}`
  },

  /**
   * Endpoints
   */
  doesEndpointExist(
    workspaceService: WorkspaceService,
    productName: string,
    appId: string,
    endpointName: string
  ): boolean {
    let exist = false
    workspaceService
      .doesUrlExistFor(productName, appId, endpointName)
      .pipe(
        first(),
        tap((exists) => {
          if (!exists) {
            console.error(`Routing not possible to workspace for endpoint: ${productName} ${appId} ${endpointName}`)
          }
        }),
        catchError((err) => {
          console.error('doesUrlExistFor', err)
          return of(false)
        })
      )
      .subscribe((ex) => (exist = ex))
    return exist
  },

  /**
   * Getting a property value from a ThemeProperties object using a dot-separated path.
   * @param obj The ThemeProperties object to retrieve the value from.
   * @param path The dot-separated path to the desired property (e.g., "general.text-color").
   * @returns The value of the property at the specified path, or undefined if not found.
   */
  getThemePropertyValue<T = string | DictionaryObject>(
    obj: ThemeProperties | undefined,
    path: ThemePropertyPath
  ): T | undefined {
    if (!obj) return undefined

    const parts = path.split('.')
    let current: unknown = obj

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current as T
  }
}
