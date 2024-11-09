import { SelectItem } from 'primeng/api'
import { Location } from '@angular/common'
import { RefType } from 'src/app/shared/generated'

export function limitText(text: string | null, limit: number): string {
  if (text) {
    return text.length < limit ? text : text.substring(0, limit) + '...'
  } else {
    return ''
  }
}

export function dropDownSortItemsByLabel(a: SelectItem, b: SelectItem): number {
  return (a.label ? a.label.toUpperCase() : '').localeCompare(b.label ? b.label.toUpperCase() : '')
}
export function dropDownGetLabelByValue(ddArray: SelectItem[], val: string): string {
  const a: any = ddArray.find((item: SelectItem) => {
    return item?.value == val
  })
  return a.label
}
export function sortByLocale(a: any, b: any): number {
  return a.toUpperCase().localeCompare(b.toUpperCase())
}

/**
 * Filter objects => exclude given properties
 */
export function filterObject(obj: any, exProps: string[]): any {
  const pickedObj: any = {}
  for (const prop in obj) {
    if (!exProps.includes(prop)) {
      pickedObj[prop] = obj[prop]
    }
  }
  return pickedObj
}

/**
 * URLs
 */
export function prepareUrlPath(url?: string, path?: string): string {
  if (url && path) return Location.joinWithSlash(url, path)
  else if (url) return url
  else return ''
}
export function bffImageUrl(basePath: string | undefined, name: string | undefined, refType?: RefType): string {
  return !name ? '' : (basePath ?? '') + '/images/' + name + '/' + (refType ?? RefType.Logo)
}

/**
 * Date & time
 */
export function getCurrentDateTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`
}
