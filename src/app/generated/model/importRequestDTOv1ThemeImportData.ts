/**
 * tkit-portal-server API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 4.4.0-SNAPSHOT
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { ThemeDTOv1 } from './themeDTOv1'

export interface ImportRequestDTOv1ThemeImportData {
  id?: string
  version?: number
  name: string
  cssFile?: string
  description?: string
  assetsUrl?: string
  logoUrl?: string
  faviconUrl?: string
  previewImageUrl?: string
  assetsUpdateDate?: string
  properties?: object
}
