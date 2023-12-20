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
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional } from '@angular/core'
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
  HttpEvent,
  HttpParameterCodec,
  HttpContext,
} from '@angular/common/http'
import { CustomHttpParameterCodec } from '../encoder'
import { Observable } from 'rxjs'

// @ts-ignore
import { AccountSettingsDTO } from '../model/accountSettingsDTO'
// @ts-ignore
import { RestException } from '../model/restException'
// @ts-ignore
import { RestExceptionDTO } from '../model/restExceptionDTO'
// @ts-ignore
import { UserPersonDTO } from '../model/userPersonDTO'
// @ts-ignore
import { UserProfileDTO } from '../model/userProfileDTO'

// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS } from '../variables'
import { Configuration } from '../configuration'

export interface AdminUpdateUserSettingsRequestParams {
  userId: string
  accountSettingsDTO?: AccountSettingsDTO
}

export interface DeleteUserByIdRequestParams {
  userId: string
}

export interface GetUserProfileByIdRequestParams {
  userId: string
}

export interface GetUserProfilesRequestParams {
  email?: string
  firstName?: string
  lastName?: string
  userId?: string
}

export interface UpdateUserPersonalInfoRequestParams {
  userId: string
  userPersonDTO?: UserPersonDTO
}

@Injectable({
  providedIn: 'any',
})
export class AdminUserInternalAPIService {
  protected basePath = 'http://localhost'
  public defaultHeaders = new HttpHeaders()
  public configuration = new Configuration()
  public encoder: HttpParameterCodec

  constructor(
    protected httpClient: HttpClient,
    @Optional() @Inject(BASE_PATH) basePath: string,
    @Optional() configuration: Configuration
  ) {
    if (configuration) {
      this.configuration = configuration
    }
    if (typeof this.configuration.basePath !== 'string') {
      if (typeof basePath !== 'string') {
        basePath = this.basePath
      }
      this.configuration.basePath = basePath
    }
    this.encoder = this.configuration.encoder || new CustomHttpParameterCodec()
  }

  // @ts-ignore
  private addToHttpParams(httpParams: HttpParams, value: any, key?: string): HttpParams {
    if (typeof value === 'object' && value instanceof Date === false) {
      httpParams = this.addToHttpParamsRecursive(httpParams, value)
    } else {
      httpParams = this.addToHttpParamsRecursive(httpParams, value, key)
    }
    return httpParams
  }

  private addToHttpParamsRecursive(httpParams: HttpParams, value?: any, key?: string): HttpParams {
    if (value == null) {
      return httpParams
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        ;(value as any[]).forEach((elem) => (httpParams = this.addToHttpParamsRecursive(httpParams, elem, key)))
      } else if (value instanceof Date) {
        if (key != null) {
          httpParams = httpParams.append(key, (value as Date).toISOString().substr(0, 10))
        } else {
          throw Error('key may not be null if value is Date')
        }
      } else {
        Object.keys(value).forEach(
          (k) => (httpParams = this.addToHttpParamsRecursive(httpParams, value[k], key != null ? `${key}.${k}` : k))
        )
      }
    } else if (key != null) {
      httpParams = httpParams.append(key, value)
    } else {
      throw Error('key may not be null if value is not object or array')
    }
    return httpParams
  }

  /**
   * Update Admin User Settings
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public adminUpdateUserSettings(
    requestParameters: AdminUpdateUserSettingsRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<AccountSettingsDTO>
  public adminUpdateUserSettings(
    requestParameters: AdminUpdateUserSettingsRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<AccountSettingsDTO>>
  public adminUpdateUserSettings(
    requestParameters: AdminUpdateUserSettingsRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<AccountSettingsDTO>>
  public adminUpdateUserSettings(
    requestParameters: AdminUpdateUserSettingsRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const userId = requestParameters.userId
    if (userId === null || userId === undefined) {
      throw new Error('Required parameter userId was null or undefined when calling adminUpdateUserSettings.')
    }
    const accountSettingsDTO = requestParameters.accountSettingsDTO

    let localVarHeaders = this.defaultHeaders

    let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept
    if (localVarHttpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = ['application/json']
      localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts)
    }
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected)
    }

    let localVarHttpContext: HttpContext | undefined = options && options.context
    if (localVarHttpContext === undefined) {
      localVarHttpContext = new HttpContext()
    }

    // to determine the Content-Type header
    const consumes: string[] = ['application/json']
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes)
    if (httpContentTypeSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected)
    }

    let responseType_: 'text' | 'json' | 'blob' = 'json'
    if (localVarHttpHeaderAcceptSelected) {
      if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
        responseType_ = 'text'
      } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
        responseType_ = 'json'
      } else {
        responseType_ = 'blob'
      }
    }

    return this.httpClient.patch<AccountSettingsDTO>(
      `${this.configuration.basePath}/internal/userProfiles/settings/${encodeURIComponent(String(userId))}`,
      accountSettingsDTO,
      {
        context: localVarHttpContext,
        responseType: <any>responseType_,
        withCredentials: this.configuration.withCredentials,
        headers: localVarHeaders,
        observe: observe,
        reportProgress: reportProgress,
      }
    )
  }

  /**
   * Delete user by given Id
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public deleteUserById(
    requestParameters: DeleteUserByIdRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any>
  public deleteUserById(
    requestParameters: DeleteUserByIdRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<any>>
  public deleteUserById(
    requestParameters: DeleteUserByIdRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<any>>
  public deleteUserById(
    requestParameters: DeleteUserByIdRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const userId = requestParameters.userId
    if (userId === null || userId === undefined) {
      throw new Error('Required parameter userId was null or undefined when calling deleteUserById.')
    }

    let localVarHeaders = this.defaultHeaders

    let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept
    if (localVarHttpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = ['application/json']
      localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts)
    }
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected)
    }

    let localVarHttpContext: HttpContext | undefined = options && options.context
    if (localVarHttpContext === undefined) {
      localVarHttpContext = new HttpContext()
    }

    let responseType_: 'text' | 'json' | 'blob' = 'json'
    if (localVarHttpHeaderAcceptSelected) {
      if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
        responseType_ = 'text'
      } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
        responseType_ = 'json'
      } else {
        responseType_ = 'blob'
      }
    }

    return this.httpClient.delete<any>(
      `${this.configuration.basePath}/internal/userProfiles/${encodeURIComponent(String(userId))}`,
      {
        context: localVarHttpContext,
        responseType: <any>responseType_,
        withCredentials: this.configuration.withCredentials,
        headers: localVarHeaders,
        observe: observe,
        reportProgress: reportProgress,
      }
    )
  }

  /**
   * Get User Profile by Id
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public getUserProfileById(
    requestParameters: GetUserProfileByIdRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<UserProfileDTO>
  public getUserProfileById(
    requestParameters: GetUserProfileByIdRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<UserProfileDTO>>
  public getUserProfileById(
    requestParameters: GetUserProfileByIdRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<UserProfileDTO>>
  public getUserProfileById(
    requestParameters: GetUserProfileByIdRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const userId = requestParameters.userId
    if (userId === null || userId === undefined) {
      throw new Error('Required parameter userId was null or undefined when calling getUserProfileById.')
    }

    let localVarHeaders = this.defaultHeaders

    let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept
    if (localVarHttpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = ['application/json']
      localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts)
    }
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected)
    }

    let localVarHttpContext: HttpContext | undefined = options && options.context
    if (localVarHttpContext === undefined) {
      localVarHttpContext = new HttpContext()
    }

    let responseType_: 'text' | 'json' | 'blob' = 'json'
    if (localVarHttpHeaderAcceptSelected) {
      if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
        responseType_ = 'text'
      } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
        responseType_ = 'json'
      } else {
        responseType_ = 'blob'
      }
    }

    return this.httpClient.get<UserProfileDTO>(
      `${this.configuration.basePath}/internal/userProfiles/${encodeURIComponent(String(userId))}`,
      {
        context: localVarHttpContext,
        responseType: <any>responseType_,
        withCredentials: this.configuration.withCredentials,
        headers: localVarHeaders,
        observe: observe,
        reportProgress: reportProgress,
      }
    )
  }

  /**
   * Get User Profiles by given criteria
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public getUserProfiles(
    requestParameters: GetUserProfilesRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<Array<UserProfileDTO>>
  public getUserProfiles(
    requestParameters: GetUserProfilesRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<Array<UserProfileDTO>>>
  public getUserProfiles(
    requestParameters: GetUserProfilesRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<Array<UserProfileDTO>>>
  public getUserProfiles(
    requestParameters: GetUserProfilesRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const email = requestParameters.email
    const firstName = requestParameters.firstName
    const lastName = requestParameters.lastName
    const userId = requestParameters.userId

    let localVarQueryParameters = new HttpParams({ encoder: this.encoder })
    if (email !== undefined && email !== null) {
      localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>email, 'email')
    }
    if (firstName !== undefined && firstName !== null) {
      localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>firstName, 'firstName')
    }
    if (lastName !== undefined && lastName !== null) {
      localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>lastName, 'lastName')
    }
    if (userId !== undefined && userId !== null) {
      localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>userId, 'userId')
    }

    let localVarHeaders = this.defaultHeaders

    let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept
    if (localVarHttpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = ['application/json']
      localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts)
    }
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected)
    }

    let localVarHttpContext: HttpContext | undefined = options && options.context
    if (localVarHttpContext === undefined) {
      localVarHttpContext = new HttpContext()
    }

    let responseType_: 'text' | 'json' | 'blob' = 'json'
    if (localVarHttpHeaderAcceptSelected) {
      if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
        responseType_ = 'text'
      } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
        responseType_ = 'json'
      } else {
        responseType_ = 'blob'
      }
    }

    return this.httpClient.get<Array<UserProfileDTO>>(`${this.configuration.basePath}/internal/userProfiles`, {
      context: localVarHttpContext,
      params: localVarQueryParameters,
      responseType: <any>responseType_,
      withCredentials: this.configuration.withCredentials,
      headers: localVarHeaders,
      observe: observe,
      reportProgress: reportProgress,
    })
  }

  /**
   * Update Personal User Info By Admin
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public updateUserPersonalInfo(
    requestParameters: UpdateUserPersonalInfoRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<Array<UserPersonDTO>>
  public updateUserPersonalInfo(
    requestParameters: UpdateUserPersonalInfoRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<Array<UserPersonDTO>>>
  public updateUserPersonalInfo(
    requestParameters: UpdateUserPersonalInfoRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<Array<UserPersonDTO>>>
  public updateUserPersonalInfo(
    requestParameters: UpdateUserPersonalInfoRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const userId = requestParameters.userId
    if (userId === null || userId === undefined) {
      throw new Error('Required parameter userId was null or undefined when calling updateUserPersonalInfo.')
    }
    const userPersonDTO = requestParameters.userPersonDTO

    let localVarHeaders = this.defaultHeaders

    let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept
    if (localVarHttpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = ['application/json']
      localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts)
    }
    if (localVarHttpHeaderAcceptSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected)
    }

    let localVarHttpContext: HttpContext | undefined = options && options.context
    if (localVarHttpContext === undefined) {
      localVarHttpContext = new HttpContext()
    }

    // to determine the Content-Type header
    const consumes: string[] = ['application/json']
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes)
    if (httpContentTypeSelected !== undefined) {
      localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected)
    }

    let responseType_: 'text' | 'json' | 'blob' = 'json'
    if (localVarHttpHeaderAcceptSelected) {
      if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
        responseType_ = 'text'
      } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
        responseType_ = 'json'
      } else {
        responseType_ = 'blob'
      }
    }

    return this.httpClient.put<Array<UserPersonDTO>>(
      `${this.configuration.basePath}/internal/userProfiles/${encodeURIComponent(String(userId))}`,
      userPersonDTO,
      {
        context: localVarHttpContext,
        responseType: <any>responseType_,
        withCredentials: this.configuration.withCredentials,
        headers: localVarHeaders,
        observe: observe,
        reportProgress: reportProgress,
      }
    )
  }
}
