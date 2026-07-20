import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { scheduled, queueScheduler } from 'rxjs'

import { LabelResolver } from './label.resolver' // Pfad anpassen

describe('LabelResolver', () => {
  let resolver: LabelResolver
  let translateServiceSpy: jasmine.SpyObj<TranslateService>

  beforeEach(() => {
    const translateSpy = jasmine.createSpyObj('TranslateService', ['get'])

    TestBed.configureTestingModule({
      providers: [LabelResolver, { provide: TranslateService, useValue: translateSpy }]
    })

    resolver = TestBed.inject(LabelResolver)
    translateServiceSpy = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>
  })

  const dummyState = {} as RouterStateSnapshot // used in LabelResolver

  it('creates the resolver', () => {
    expect(resolver).toBeTruthy()
  })

  it('should return the translated breadcrumb string if data.breadcrumb exists', (done) => {
    translateServiceSpy.get.and.returnValue(scheduled(['start page'], queueScheduler))

    const routeMock = {
      data: { breadcrumb: 'NAV.HOME' }
    } as unknown as ActivatedRouteSnapshot

    const result = resolver.resolve(routeMock, dummyState)

    if (result instanceof scheduled || typeof (result as any).subscribe === 'function') {
      ;(result as any).subscribe((label: string) => {
        expect(label).toBe('start page')
        expect(translateServiceSpy.get).toHaveBeenCalledWith('NAV.HOME')
        done()
      })
    } else {
      fail('Resolver should have returned an Observable')
    }
  })

  it('should return the path from the routeConfig if no breadcrumb exists', () => {
    const path = 'users/:id'
    const routeMock = {
      data: {},
      routeConfig: { path: path }
    } as unknown as ActivatedRouteSnapshot

    const result = resolver.resolve(routeMock, dummyState)

    expect(result).toBe(path)
    expect(translateServiceSpy.get).not.toHaveBeenCalled()
  })

  it('should return an empty string if neither breadcrumb nor path exist', () => {
    const routeMock = {
      data: {},
      routeConfig: undefined
    } as unknown as ActivatedRouteSnapshot

    const result = resolver.resolve(routeMock, dummyState)

    expect(result).toBe('')
    expect(translateServiceSpy.get).not.toHaveBeenCalled()
  })
})
