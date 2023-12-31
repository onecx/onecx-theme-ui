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
import { CreateMicrofrontendDTOv1 } from '../model/createMicrofrontendDTOv1'
// @ts-ignore
import { MicrofrontendDTOv1 } from '../model/microfrontendDTOv1'
// @ts-ignore
import { RestExceptionDTO } from '../model/restExceptionDTO'
// @ts-ignore
import { UpdateMicrofrontend200Response } from '../model/updateMicrofrontend200Response'
// @ts-ignore
import { UpdateMicrofrontendDTOv1 } from '../model/updateMicrofrontendDTOv1'

// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS } from '../variables'
import { Configuration } from '../configuration'

export interface CreateNewMicroFrontendRequestParams {
  createMicrofrontendDTOv1?: CreateMicrofrontendDTOv1
}

export interface DeleteMicrofrontendRequestParams {
  id: string
}

export interface GetMicrofrontendByIdRequestParams {
  id: string
}

export interface UpdateMicrofrontendRequestParams {
  id: string
  updateMicrofrontendDTOv1?: UpdateMicrofrontendDTOv1
}

@Injectable({
  providedIn: 'any',
})
export class MicrofrontendV1APIService {
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
   * Create microfrontend.
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public createNewMicroFrontend(
    requestParameters: CreateNewMicroFrontendRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<MicrofrontendDTOv1>
  public createNewMicroFrontend(
    requestParameters: CreateNewMicroFrontendRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<MicrofrontendDTOv1>>
  public createNewMicroFrontend(
    requestParameters: CreateNewMicroFrontendRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<MicrofrontendDTOv1>>
  public createNewMicroFrontend(
    requestParameters: CreateNewMicroFrontendRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const createMicrofrontendDTOv1 = requestParameters.createMicrofrontendDTOv1

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
    const consumes: string[] = ['application/json', 'text/plain']
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

    return this.httpClient.post<MicrofrontendDTOv1>(
      `${this.configuration.basePath}/v1/microfrontends`,
      createMicrofrontendDTOv1,
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
   * Delete microfrontend by ID when no portals are attached.
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public deleteMicrofrontend(
    requestParameters: DeleteMicrofrontendRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<Array<MicrofrontendDTOv1>>
  public deleteMicrofrontend(
    requestParameters: DeleteMicrofrontendRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<Array<MicrofrontendDTOv1>>>
  public deleteMicrofrontend(
    requestParameters: DeleteMicrofrontendRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<Array<MicrofrontendDTOv1>>>
  public deleteMicrofrontend(
    requestParameters: DeleteMicrofrontendRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const id = requestParameters.id
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling deleteMicrofrontend.')
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

    return this.httpClient.delete<Array<MicrofrontendDTOv1>>(
      `${this.configuration.basePath}/v1/microfrontends/${encodeURIComponent(String(id))}`,
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
   * Returns a microfrontend by ID.
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public getMicrofrontendById(
    requestParameters: GetMicrofrontendByIdRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<Array<MicrofrontendDTOv1>>
  public getMicrofrontendById(
    requestParameters: GetMicrofrontendByIdRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<Array<MicrofrontendDTOv1>>>
  public getMicrofrontendById(
    requestParameters: GetMicrofrontendByIdRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<Array<MicrofrontendDTOv1>>>
  public getMicrofrontendById(
    requestParameters: GetMicrofrontendByIdRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const id = requestParameters.id
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getMicrofrontendById.')
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

    return this.httpClient.get<Array<MicrofrontendDTOv1>>(
      `${this.configuration.basePath}/v1/microfrontends/${encodeURIComponent(String(id))}`,
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
   * Returns a list of all microfrontends.
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public getMicrofrontends(
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<Array<MicrofrontendDTOv1>>
  public getMicrofrontends(
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<Array<MicrofrontendDTOv1>>>
  public getMicrofrontends(
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<Array<MicrofrontendDTOv1>>>
  public getMicrofrontends(
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
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

    return this.httpClient.get<Array<MicrofrontendDTOv1>>(`${this.configuration.basePath}/v1/microfrontends`, {
      context: localVarHttpContext,
      responseType: <any>responseType_,
      withCredentials: this.configuration.withCredentials,
      headers: localVarHeaders,
      observe: observe,
      reportProgress: reportProgress,
    })
  }

  /**
   * Creates or updates a microfrontend.
   * @param requestParameters
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   */
  public updateMicrofrontend(
    requestParameters: UpdateMicrofrontendRequestParams,
    observe?: 'body',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<UpdateMicrofrontend200Response>
  public updateMicrofrontend(
    requestParameters: UpdateMicrofrontendRequestParams,
    observe?: 'response',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpResponse<UpdateMicrofrontend200Response>>
  public updateMicrofrontend(
    requestParameters: UpdateMicrofrontendRequestParams,
    observe?: 'events',
    reportProgress?: boolean,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<HttpEvent<UpdateMicrofrontend200Response>>
  public updateMicrofrontend(
    requestParameters: UpdateMicrofrontendRequestParams,
    observe: any = 'body',
    reportProgress: boolean = false,
    options?: { httpHeaderAccept?: 'application/json'; context?: HttpContext }
  ): Observable<any> {
    const id = requestParameters.id
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling updateMicrofrontend.')
    }
    const updateMicrofrontendDTOv1 = requestParameters.updateMicrofrontendDTOv1

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
    const consumes: string[] = ['application/json', 'text/plain']
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

    return this.httpClient.put<UpdateMicrofrontend200Response>(
      `${this.configuration.basePath}/v1/microfrontends/${encodeURIComponent(String(id))}`,
      updateMicrofrontendDTOv1,
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
