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
import { UserPersonDTOv1 } from './userPersonDTOv1'
import { UserProfileDTOv1AccountSettings } from './userProfileDTOv1AccountSettings'
import { UserProfileDTOv1Avatar } from './userProfileDTOv1Avatar'
import { MembershipDTO } from './membershipDTO'

export interface UserProfileDTOv1 {
  version?: number
  creationDate?: string
  creationUser?: string
  modificationDate?: string
  modificationUser?: string
  id?: string
  /**
   *
   */
  userId?: string
  identityProvider?: string
  /**
   * user id in external identity provider, e.g. in keycloak
   */
  identityProviderId?: string
  /**
   *
   */
  organization?: string
  person?: UserPersonDTOv1
  accountSettings?: UserProfileDTOv1AccountSettings
  roles?: Set<string>
  avatar?: UserProfileDTOv1Avatar
  memberships?: Array<MembershipDTO>
}
