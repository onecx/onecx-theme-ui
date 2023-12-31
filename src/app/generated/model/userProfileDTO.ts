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
import { UserPersonDTO } from './userPersonDTO'
import { MembershipDTO } from './membershipDTO'
import { UserProfileDTOAccountSettings } from './userProfileDTOAccountSettings'

export interface UserProfileDTO {
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
  person?: UserPersonDTO
  roles?: Set<string>
  memberships?: Array<MembershipDTO>
  accountSettings?: UserProfileDTOAccountSettings
}
