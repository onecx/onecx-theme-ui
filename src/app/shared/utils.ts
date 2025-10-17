import { Location } from '@angular/common'
import { WorkspaceService } from '@onecx/angular-integration-interface'
import { catchError, first, of, tap } from 'rxjs'
import { RefType } from 'src/app/shared/generated'

// This object encupsulated function because ...
//  ...Jasmine has problems to spying direct imported functions
const Utils = {
  mapping_error_status(status: number): number {
    return [0, 400, 401, 403, 404, 500].includes(status) ? status : 0
  },

  limitText(text: string | null, limit: number): string {
    if (text) {
      return text.length < limit ? text : text.substring(0, limit) + '...'
    } else {
      return ''
    }
  },

  sortByLocale(a: any, b: any): number {
    return a.toUpperCase().localeCompare(b.toUpperCase())
  },
  sortByDisplayName(a: any, b: any): number {
    return (a.displayName ? a.displayName.toUpperCase() : '').localeCompare(
      b.displayName ? b.displayName.toUpperCase() : ''
    )
  },

  /**
   * Filter objects => exclude given properties
   */
  filterObject(obj: any, exProps: string[]): any {
    const pickedObj: any = {}
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
  bffImageUrl(basePath: string | undefined, name: string | undefined, refType: RefType): string | undefined {
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
  }
}

export { Utils }
