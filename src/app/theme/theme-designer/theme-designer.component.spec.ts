import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'

import { ConfigurationService, PortalMessageService, ThemeService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { ThemeDesignerComponent } from './theme-designer.component'
import { ConfirmationService } from 'primeng/api'
import { ThemesAPIService } from 'src/app/generated'
import { ActivatedRoute, Router } from '@angular/router'
import { themeVariables } from '../theme-variables'
import { of, throwError } from 'rxjs'
import { environment } from 'src/environments/environment'
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { By } from '@angular/platform-browser'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { InputSwitchModule } from 'primeng/inputswitch'
import { DialogModule } from 'primeng/dialog'
import { DropdownModule } from 'primeng/dropdown'
import { OverlayPanelModule } from 'primeng/overlaypanel'

describe('ThemeDesignerComponent', () => {
  let component: ThemeDesignerComponent
  let fixture: ComponentFixture<ThemeDesignerComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const configServiceSpy = {
    getProperty: jasmine.createSpy('getProperty').and.returnValue('123'),
    getPortal: jasmine.createSpy('getPortal').and.returnValue({
      themeId: '1234',
      portalName: 'test',
      baseUrl: '/',
      microfrontendRegistrations: []
    })
  }
  const themeServiceSpy = jasmine.createSpyObj<ThemeService>('ThemeService', ['apply'])
  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemes',
    'updateTheme',
    'createTheme',
    'getThemeById'
  ])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDesignerComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        }),
        ConfirmDialogModule,
        DialogModule,
        DropdownModule,
        OverlayPanelModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        InputSwitchModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: ThemesAPIService, useValue: themeApiSpy },
        ConfirmationService
      ]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    themeApiSpy.getThemeById.calls.reset()
    themeApiSpy.updateTheme.calls.reset()
    themeApiSpy.createTheme.calls.reset()
    themeApiSpy.getThemes.calls.reset()
    themeServiceSpy.apply.calls.reset()

    themeApiSpy.getThemes.and.returnValue(of({}) as any)
    themeApiSpy.updateTheme.and.returnValue(of({}) as any)
    themeApiSpy.createTheme.and.returnValue(of({}) as any)
    themeApiSpy.getThemeById.and.returnValue(of({}) as any)
  }))

  describe('when constructing', () => {
    beforeEach(() => {})

    it('should have edit mode when id present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(true)

      fixture = TestBed.createComponent(ThemeDesignerComponent)
      component = fixture.componentInstance
      fixture.detectChanges()

      expect(component.mode).toBe('EDIT')
    })

    it('should have create mode when id not present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(false)

      fixture = TestBed.createComponent(ThemeDesignerComponent)
      component = fixture.componentInstance
      fixture.detectChanges()

      expect(component.mode).toBe('NEW')
    })

    it('should populate state and create forms', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('themeId')

      fixture = TestBed.createComponent(ThemeDesignerComponent)
      component = fixture.componentInstance
      fixture.detectChanges()

      expect(component.themeId).toBe('themeId')
      expect(component.themeIsCurrentUsedTheme).toBeFalse()
      expect(Object.keys(component.fontForm.controls).length).toBe(themeVariables.font.length)
      expect(Object.keys(component.generalForm.controls).length).toBe(themeVariables.general.length)
      expect(Object.keys(component.topbarForm.controls).length).toBe(themeVariables.topbar.length)
      expect(Object.keys(component.sidebarForm.controls).length).toBe(themeVariables.sidebar.length)
    })

    it('should load translations', () => {
      const translateService = TestBed.inject(TranslateService)
      const actionsTranslations = {
        'ACTIONS.CANCEL': 'actionCancel',
        'ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE': 'actionTooltipsCancelAndClose',
        'ACTIONS.SAVE': 'actionsSave',
        'ACTIONS.TOOLTIPS.SAVE': 'actionsTooltipsSave',
        'ACTIONS.SAVE_AS': 'actionSaveAs',
        'ACTIONS.TOOLTIPS.SAVE_AS': 'actionTooltipsSaveAs'
      }
      spyOn(translateService, 'get').and.returnValue(of(actionsTranslations))

      fixture = TestBed.createComponent(ThemeDesignerComponent)
      component = fixture.componentInstance
      fixture.detectChanges()

      expect(component.actions.length).toBe(3)
      const cancelAction = component.actions.filter(
        (a) => a.label === 'actionCancel' && a.title === 'actionTooltipsCancelAndClose'
      )[0]
      spyOn<any>(component, 'close')
      cancelAction.actionCallback()
      expect(component['close']).toHaveBeenCalledTimes(1)

      const saveAction = component.actions.filter(
        (a) => a.label === 'actionsSave' && a.title === 'actionsTooltipsSave'
      )[0]
      spyOn<any>(component, 'updateTheme')
      saveAction.actionCallback()
      expect(component['updateTheme']).toHaveBeenCalledTimes(1)

      const saveAsAction = component.actions.filter(
        (a) => a.label === 'actionSaveAs' && a.title === 'actionTooltipsSaveAs'
      )[0]
      spyOn(component, 'saveAsNewPopup')
      saveAsAction.actionCallback()
      expect(component.saveAsNewPopup).toHaveBeenCalledTimes(1)
    })

    it('should update document style on form changes', fakeAsync(() => {
      fixture = TestBed.createComponent(ThemeDesignerComponent)
      component = fixture.componentInstance
      fixture.detectChanges()

      component.autoApply = true

      const fontFormControlEl = fixture.debugElement.query(By.css('#font-family'))
      expect(fontFormControlEl).toBeDefined()
      fontFormControlEl.nativeElement.value = 'newFamily'
      fontFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const generalFormControlEl = fixture.debugElement.query(By.css('#color-primary-color'))
      expect(generalFormControlEl).toBeDefined()
      generalFormControlEl.nativeElement.value = 'rgba(0, 0, 0, 0.87)'
      generalFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const topbarFormControlEl = fixture.debugElement.query(By.css('#color-topbar-bg-color'))
      expect(topbarFormControlEl).toBeDefined()
      topbarFormControlEl.nativeElement.value = '#000000'
      topbarFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const sidebarFormControlEl = fixture.debugElement.query(By.css('#color-menu-text-color'))
      expect(sidebarFormControlEl).toBeDefined()
      sidebarFormControlEl.nativeElement.value = '#102030'
      sidebarFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      fixture.detectChanges()
      tick(300)

      expect(document.documentElement.style.getPropertyValue(`--primary-color`)).toBe('rgba(0, 0, 0, 0.87)')
      expect(document.documentElement.style.getPropertyValue(`--topbar-bg-color`)).toBe('#000000')
      expect(document.documentElement.style.getPropertyValue(`--topbar-bg-color-rgb`)).toBe('0,0,0')
      expect(document.documentElement.style.getPropertyValue(`--menu-text-color`)).toBe('#102030')
      expect(document.documentElement.style.getPropertyValue(`--menu-text-color-rgb`)).toBe('16,32,48')
    }))
  })

  describe('after creation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ThemeDesignerComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })

    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should populate form with theme data in edit mode', () => {
      const themeData = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'themeName',
        properties: {
          font: {
            'font-family': 'myFont'
          },
          general: {
            'primary-color': 'rgb(0,0,0)'
          }
        }
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)
      component.mode = 'EDIT'
      component.themeId = 'themeId'

      component.ngOnInit()

      expect(component.theme).toBe(themeData)
      expect(themeApiSpy.getThemeById).toHaveBeenCalledOnceWith({ id: 'themeId' })
      expect(component.basicForm.controls['name'].value).toBe(themeData.name)
      expect(component.basicForm.controls['description'].value).toBe(themeData.description)
      expect(component.basicForm.controls['logoUrl'].value).toBe(themeData.logoUrl)
      expect(component.basicForm.controls['faviconUrl'].value).toBe(themeData.faviconUrl)
      expect(component.fontForm.controls['font-family'].value).toBe('myFont')
      expect(component.generalForm.controls['primary-color'].value).toBe('rgb(0,0,0)')
    })

    it('should fetch logo and favicon from backend on edit mode when no http[s] present', () => {
      const themeData = {
        name: 'themeName',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url'
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)
      component.mode = 'EDIT'
      component.themeId = 'themeId'

      component.ngOnInit()

      expect(component.fetchingLogoUrl).toBe(environment.apiPrefix + themeData.logoUrl)
      expect(component.fetchingFaviconUrl).toBe(environment.apiPrefix + themeData.faviconUrl)
    })

    it('should fetch logo and favicon from external source on edit mode when http[s] present', () => {
      const themeData = {
        logoUrl: 'http://myWeb.com/logo_url',
        faviconUrl: 'https://otherWeb.de/fav_url'
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)
      component.mode = 'EDIT'
      component.themeId = 'themeId'

      component.ngOnInit()

      expect(component.fetchingLogoUrl).toBe(themeData.logoUrl)
      expect(component.fetchingFaviconUrl).toBe(themeData.faviconUrl)
    })

    it('should populate forms with default values if not in edit mode', () => {
      const documentStyle = getComputedStyle(document.documentElement).getPropertyValue('--font-family')

      component.ngOnInit()

      expect(component.fontForm.controls['font-family'].value).toBe(documentStyle)
    })

    it('should load all templates basic data on initialization', () => {
      const themeArr = [
        {
          id: 'id1',
          name: 'theme1',
          description: 'desc1'
        },
        {
          id: 'id2',
          name: 'myTheme',
          description: 'desc2'
        }
      ]
      themeApiSpy.getThemes.and.returnValue(
        of({
          stream: themeArr
        }) as any
      )

      component.ngOnInit()
      expect(component.themeTemplates).toEqual([
        {
          label: 'myTheme',
          value: 'id2'
        },
        {
          label: 'theme1',
          value: 'id1'
        }
      ])
    })

    it('should navigate back on close', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')

      component.actions[0].actionCallback()

      expect(router.navigate).toHaveBeenCalledOnceWith(['./..'], jasmine.any(Object))
    })

    it('should display error when updating theme with invalid form', () => {
      spyOnProperty(component.propertiesForm, 'invalid').and.returnValue(true)

      component.actions[1].actionCallback()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })
    })

    it('should display error when updating theme call fails', () => {
      const themeData = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'themeName',
        properties: {
          font: {
            'font-family': 'myFont'
          },
          general: {
            'primary-color': 'rgb(0,0,0)'
          }
        }
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)
      themeApiSpy.updateTheme.and.returnValue(throwError(() => new Error()))

      component.actions[1].actionCallback()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })
    })

    it('should only update properties and base theme data and show success when updating theme call is successful', () => {
      component.themeId = 'id'
      const themeData = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'themeName',
        properties: {
          font: {
            'font-family': 'myFont'
          },
          general: {
            'primary-color': 'rgb(0,0,0)'
          }
        }
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)

      component.fontForm.patchValue({
        'font-family': 'updatedFont'
      })
      component.generalForm.patchValue({
        'primary-color': 'rgb(255,255,255)'
      })
      const newBasicData = {
        name: 'updatedName',
        description: 'updatedDesc',
        logoUrl: 'updated_logo_url',
        faviconUrl: 'updated_favicon_url'
      }
      component.basicForm.patchValue(newBasicData)

      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.actions[1].actionCallback()
      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_OK' })
      expect(themeApiSpy.updateTheme).toHaveBeenCalledTimes(1)
      const updateArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(updateArgs.updateThemeRequest?.resource.name).toBe(newBasicData.name)
      expect(updateArgs.updateThemeRequest?.resource.description).toBe(newBasicData.description)
      expect(updateArgs.updateThemeRequest?.resource.logoUrl).toBe(newBasicData.logoUrl)
      expect(updateArgs.updateThemeRequest?.resource.faviconUrl).toBe(newBasicData.faviconUrl)
      expect(updateArgs.updateThemeRequest?.resource.properties).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({
            'font-family': 'updatedFont'
          }),
          general: jasmine.objectContaining({
            'primary-color': 'rgb(255,255,255)'
          })
        })
      )
    })

    it('should apply changes when updating current theme is successful', () => {
      component.themeId = 'id'
      const themeData = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'themeName',
        properties: {
          font: {
            'font-family': 'myFont'
          },
          general: {
            'primary-color': 'rgb(0,0,0)'
          }
        }
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)

      const updateThemeData = {
        resource: {
          id: 'updatedCallId'
        }
      }
      themeApiSpy.updateTheme.and.returnValue(of(updateThemeData) as any)

      component.themeIsCurrentUsedTheme = true

      component.actions[1].actionCallback()

      expect(themeServiceSpy.apply).toHaveBeenCalledOnceWith(updateThemeData as any)
    })

    it('should display theme already exists message on theme save failure', () => {
      themeApiSpy.createTheme.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              error: {
                key: 'PERSIST_ENTITY_FAILED'
              }
            })
        )
      )

      component.saveTheme('myTheme')

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_NOK',
        detailKey: 'ACTIONS.CREATE.MESSAGE.THEME_ALREADY_EXISTS'
      })
    })

    it('should display error message on theme save failure', () => {
      const responseError = 'Error message'
      themeApiSpy.createTheme.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              error: responseError
            })
        )
      )

      component.saveTheme('myTheme')

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_NOK',
        detailKey: responseError
      })
    })

    it('should display success message and route correctly in edit mode', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')

      const route = TestBed.inject(ActivatedRoute)

      const newBasicData = {
        name: 'newName',
        description: 'newDesc',
        logoUrl: 'new_logo_url',
        faviconUrl: 'new_favicon_url'
      }
      component.basicForm.patchValue(newBasicData)
      component.fontForm.patchValue({
        'font-family': 'newFont'
      })
      component.generalForm.patchValue({
        'primary-color': 'rgb(255,255,255)'
      })
      themeApiSpy.createTheme.and.returnValue(
        of({
          resource: {
            id: 'myThemeId'
          }
        }) as any
      )
      component.mode = 'EDIT'

      component.saveTheme('myTheme')

      const createArgs = themeApiSpy.createTheme.calls.mostRecent().args[0]
      expect(createArgs.createThemeRequest?.resource).toEqual(
        jasmine.objectContaining({
          name: 'myTheme',
          description: newBasicData.description,
          logoUrl: newBasicData.logoUrl,
          faviconUrl: newBasicData.faviconUrl,
          properties: jasmine.objectContaining({
            font: jasmine.objectContaining({
              'font-family': 'newFont'
            }),
            general: jasmine.objectContaining({
              'primary-color': 'rgb(255,255,255)'
            })
          })
        })
      )
      expect(router.navigate).toHaveBeenCalledOnceWith(
        [`../../myThemeId`],
        jasmine.objectContaining({ relativeTo: route })
      )
    })

    it('should display success message and route correctly in new mode', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')

      const route = TestBed.inject(ActivatedRoute)

      const newBasicData = {
        name: 'newName',
        description: 'newDesc',
        logoUrl: 'new_logo_url',
        faviconUrl: 'new_favicon_url'
      }
      component.basicForm.patchValue(newBasicData)
      component.fontForm.patchValue({
        'font-family': 'newFont'
      })
      component.generalForm.patchValue({
        'primary-color': 'rgb(255,255,255)'
      })
      themeApiSpy.createTheme.and.returnValue(
        of({
          resource: {
            id: 'myThemeId'
          }
        }) as any
      )
      component.mode = 'NEW'

      component.saveTheme('myTheme')

      expect(router.navigate).toHaveBeenCalledOnceWith(
        [`../myThemeId`],
        jasmine.objectContaining({ relativeTo: route })
      )
    })

    it('should display save as new popup on save as click', () => {
      component.saveAsNewPopupDisplay = false

      component.actions[2].actionCallback()

      expect(component.saveAsNewPopupDisplay).toBe(true)
    })

    it('should use form theme name in save as dialog while in NEW mode', () => {
      component.saveAsThemeName = jasmine.createSpyObj('ElementRef', [], {
        nativeElement: {
          value: ''
        }
      })

      component.basicForm.controls['name'].setValue('newThemeName')

      component.mode = 'NEW'

      component.onShowSaveAsDialog()

      expect(component.saveAsThemeName?.nativeElement.value).toBe('newThemeName')
    })

    it('should use COPY_OF + form theme name in save as dialog while in EDIT mode', () => {
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'instant').and.returnValue('copy_of: ')
      component.saveAsThemeName = jasmine.createSpyObj('ElementRef', [], {
        nativeElement: {
          value: ''
        }
      })

      component.basicForm.controls['name'].setValue('newThemeName')

      component.mode = 'EDIT'

      component.onShowSaveAsDialog()

      expect(component.saveAsThemeName?.nativeElement.value).toBe('copy_of: newThemeName')
    })

    // it('should display logo file type error if uploaded file is not an image', () => {
    //   const dataTransfer = new DataTransfer()
    //   dataTransfer.items.add(new File([''], 'my-file.pdf'))

    //   expect(component.selectedFileInputLogo).toBeDefined()
    //   component.selectedFileInputLogo!.nativeElement.files = dataTransfer.files

    //   component.selectedFileInputLogo!.nativeElement.dispatchEvent(new InputEvent('change'))

    //   fixture.detectChanges()

    //   expect(component.displayFileTypeErrorLogo).toBe(true)
    //   expect(component.displayFileTypeErrorFavicon).toBe(false)
    // })

    // it('should display favicon file type error if uploaded file is not an image', () => {
    //   const dataTransfer = new DataTransfer()
    //   dataTransfer.items.add(new File([''], 'my-file.pdf'))

    //   expect(component.selectedFileInputFavicon).toBeDefined()
    //   component.selectedFileInputFavicon!.nativeElement.files = dataTransfer.files

    //   component.selectedFileInputFavicon!.nativeElement.dispatchEvent(new InputEvent('change'))

    //   fixture.detectChanges()

    //   expect(component.displayFileTypeErrorLogo).toBe(false)
    //   expect(component.displayFileTypeErrorFavicon).toBe(true)
    // })

    // it('should upload logo image, update logo urls and display message on logo upload', () => {
    //   imageApiSpy.uploadImage.and.returnValue(
    //     of({
    //       imageUrl: 'uploadedLogoUrl'
    //     }) as any
    //   )

    //   const dataTransfer = new DataTransfer()
    //   dataTransfer.items.add(new File([''], 'my-logo.png'))

    //   expect(component.selectedFileInputLogo).toBeDefined()
    //   component.selectedFileInputLogo!.nativeElement.files = dataTransfer.files

    //   component.selectedFileInputLogo!.nativeElement.dispatchEvent(new InputEvent('change'))

    //   fixture.detectChanges()

    //   expect(imageApiSpy.uploadImage).toHaveBeenCalledOnceWith({
    //     image: dataTransfer.files[0]
    //   })
    //   expect(component.basicForm.controls['logoUrl'].value).toBe('uploadedLogoUrl')
    //   expect(component.fetchingLogoUrl).toBe(environment.apiPrefix + 'uploadedLogoUrl')
    //   expect(msgServiceSpy.info).toHaveBeenCalledOnceWith({ summaryKey: 'LOGO.UPLOADED' })
    // })

    // it('should upload favicon image, update favicon urls and display information on favicon upload', () => {
    //   imageApiSpy.uploadImage.and.returnValue(
    //     of({
    //       imageUrl: 'uploadedFaviconUrl'
    //     }) as any
    //   )

    //   const dataTransfer = new DataTransfer()
    //   dataTransfer.items.add(new File([''], 'my-favicon.png'))

    //   expect(component.selectedFileInputFavicon).toBeDefined()
    //   component.selectedFileInputFavicon!.nativeElement.files = dataTransfer.files

    //   component.selectedFileInputFavicon!.nativeElement.dispatchEvent(new InputEvent('change'))

    //   fixture.detectChanges()

    //   expect(imageApiSpy.uploadImage).toHaveBeenCalledOnceWith({
    //     image: dataTransfer.files[0]
    //   })
    //   expect(component.basicForm.controls['faviconUrl'].value).toBe('uploadedFaviconUrl')
    //   expect(component.fetchingFaviconUrl).toBe(environment.apiPrefix + 'uploadedFaviconUrl')
    //   expect(msgServiceSpy.info).toHaveBeenCalledOnceWith({ summaryKey: 'LOGO.UPLOADED' })
    // })

    it('should use translation data on theme template change', () => {
      component.themeTemplates = [
        {
          label: 'theme1',
          value: 'id1'
        },
        {
          label: 'myTheme',
          value: 'id2'
        }
      ]

      component.themeTemplateSelectedId = 'id2'

      const translationData = {
        'GENERAL.COPY_OF': 'generalCopyOf',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      let confirmdialog: ConfirmDialog
      confirmdialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance

      component.onThemeTemplateDropdownChange()
      fixture.detectChanges()

      expect(confirmdialog.confirmation).toEqual(
        jasmine.objectContaining({
          header: 'themeTemplateConfirmationHeader',
          message: 'myTheme themeTemplateConfirmationMessage',
          acceptLabel: 'actionsConfirmationYes',
          rejectLabel: 'actionsConfirmationNo'
        })
      )
    })

    it('should reset selected template on confirmation reject', () => {
      component.themeTemplates = [
        {
          label: 'theme1',
          value: 'id1'
        },
        {
          label: 'myTheme',
          value: 'id2'
        }
      ]

      component.themeTemplateSelectedId = 'id2'

      let confirmdialog: ConfirmDialog
      confirmdialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      let reject = spyOn(confirmdialog, 'reject').and.callThrough()

      component.onThemeTemplateDropdownChange()
      fixture.detectChanges()
      component = fixture.componentInstance

      let cancelBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-reject')
      cancelBtn.click()

      expect(reject).toHaveBeenCalled()
      expect(component.themeTemplateSelectedId).toBe('')
    })

    it('should populate only properties with template data on confirmation accept and EDIT mode', () => {
      component.themeTemplates = [
        {
          label: 'theme1',
          value: 'id1'
        },
        {
          label: 'myTheme',
          value: 'id2'
        }
      ]

      component.themeTemplateSelectedId = 'id2'

      const translationData = {
        'GENERAL.COPY_OF': 'generalCopyOf',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      component.mode = 'EDIT'
      const basicFormBeforeFetch = {
        name: 'n',
        description: 'd',
        faviconUrl: 'f',
        logoUrl: 'l'
      }
      component.basicForm.patchValue(basicFormBeforeFetch)

      const fetchedTheme = {
        name: 'fetchedName',
        description: 'fetchedDesc',
        faviconUrl: 'fetchedFavUrl',
        logoUrl: 'fetchedLogoUrl',
        properties: {
          font: {
            'font-family': 'fetchedFont'
          },
          general: {
            'primary-color': 'rgb(255,255,255)'
          }
        }
      }
      const fetchedThemeResponse = {
        resource: fetchedTheme
      }
      themeApiSpy.getThemeById.and.returnValue(of(fetchedThemeResponse) as any)

      component.fetchingFaviconUrl = 'ffu'
      component.fetchingLogoUrl = 'flu'

      let confirmdialog: ConfirmDialog
      confirmdialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      let accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onThemeTemplateDropdownChange()
      fixture.detectChanges()

      let acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component.basicForm.value).toEqual(basicFormBeforeFetch)
      expect(component.propertiesForm.value).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'fetchedFont' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
      expect(component.fetchingFaviconUrl).toBe('ffu')
      expect(component.fetchingLogoUrl).toBe('flu')
    })

    it('should populate properties and basic info with template data on confirmation accept and NEW mode', () => {
      component.themeTemplates = [
        {
          label: 'theme1',
          value: 'id1'
        },
        {
          label: 'myTheme',
          value: 'id2'
        }
      ]

      component.themeTemplateSelectedId = 'id2'

      const translationData = {
        'GENERAL.COPY_OF': 'generalCopyOf: ',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      component.mode = 'NEW'
      const basicFormBeforeFetch = {
        name: 'n',
        description: 'd',
        faviconUrl: 'f',
        logoUrl: 'l'
      }
      component.basicForm.patchValue(basicFormBeforeFetch)

      const fetchedTheme = {
        name: 'fetchedName',
        description: 'fetchedDesc',
        faviconUrl: 'fetchedFavUrl',
        logoUrl: 'fetchedLogoUrl',
        properties: {
          font: {
            'font-family': 'fetchedFont'
          },
          general: {
            'primary-color': 'rgb(255,255,255)'
          }
        }
      }
      const fetchedThemeResponse = {
        resource: fetchedTheme
      }
      themeApiSpy.getThemeById.and.returnValue(of(fetchedThemeResponse) as any)

      let confirmdialog: ConfirmDialog
      confirmdialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      let accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onThemeTemplateDropdownChange()
      fixture.detectChanges()

      let acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component.basicForm.value).toEqual({
        name: 'generalCopyOf: fetchedName',
        description: 'fetchedDesc',
        faviconUrl: 'fetchedFavUrl',
        logoUrl: 'fetchedLogoUrl'
      })
      expect(component.propertiesForm.value).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'fetchedFont' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
      expect(component.fetchingFaviconUrl).toBe(environment.apiPrefix + 'fetchedFavUrl')
      expect(component.fetchingLogoUrl).toBe(environment.apiPrefix + 'fetchedLogoUrl')
    })
  })
})
