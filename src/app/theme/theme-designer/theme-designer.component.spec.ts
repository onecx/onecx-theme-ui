import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing'
import { HttpResponse, HttpErrorResponse } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { By } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { ConfirmationService } from 'primeng/api'
import { InputSwitchModule } from 'primeng/inputswitch'
import { DialogModule } from 'primeng/dialog'
import { DropdownModule } from 'primeng/dropdown'
import { OverlayPanelModule } from 'primeng/overlaypanel'
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog'

import { PortalMessageService, ThemeService } from '@onecx/portal-integration-angular'

import { RefType, ThemesAPIService, ImagesInternalAPIService } from 'src/app/shared/generated'
import { themeVariables } from './theme-variables'
import { ThemeDesignerComponent } from './theme-designer.component'

describe('ThemeDesignerComponent', () => {
  let component: ThemeDesignerComponent
  let fixture: ComponentFixture<ThemeDesignerComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const themeServiceSpy = jasmine.createSpyObj<ThemeService>('ThemeService', ['apply'])
  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemes',
    'updateTheme',
    'createTheme',
    'getThemeById',
    'getThemeByName'
  ])
  const imgServiceSpy = {
    getImage: jasmine.createSpy('getImage').and.returnValue(of({})),
    updateImage: jasmine.createSpy('updateImage').and.returnValue(of({})),
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(of({})),
    configuration: {
      basePath: 'basePath'
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDesignerComponent],
      imports: [
        BrowserAnimationsModule,
        ConfirmDialogModule,
        DialogModule,
        DropdownModule,
        FormsModule,
        InputSwitchModule,
        HttpClientTestingModule,
        OverlayPanelModule,
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: ThemesAPIService, useValue: themeApiSpy },
        { provide: ImagesInternalAPIService, useValue: imgServiceSpy },
        ConfirmationService
      ]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    themeApiSpy.getThemeById.calls.reset()
    themeApiSpy.getThemeByName.calls.reset()
    themeApiSpy.updateTheme.calls.reset()
    themeApiSpy.createTheme.calls.reset()
    themeApiSpy.getThemes.calls.reset()
    themeServiceSpy.apply.calls.reset()
    themeApiSpy.getThemes.and.returnValue(of({}) as any)
    themeApiSpy.updateTheme.and.returnValue(of({}) as any)
    themeApiSpy.createTheme.and.returnValue(of({}) as any)
    themeApiSpy.getThemeById.and.returnValue(of({}) as any)
    imgServiceSpy.getImage.and.returnValue(of({}))
    imgServiceSpy.updateImage.and.returnValue(of({}))
    imgServiceSpy.uploadImage.and.returnValue(of({}))
  }))

  function initializeComponent(): void {
    fixture = TestBed.createComponent(ThemeDesignerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  describe('when constructing', () => {
    beforeEach(() => {})

    it('should have edit mode when id present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(true)

      initializeComponent()

      expect(component.mode).toBe('EDIT')
    })

    it('should have create mode when id not present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(false)

      initializeComponent()

      expect(component.mode).toBe('NEW')
    })

    it('should populate state and create forms', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('themeName')

      initializeComponent()

      expect(component.themeName).toBe('themeName')
      expect(component.themeIsCurrentUsedTheme).toBeFalse()
      expect(Object.keys(component.fontForm.controls).length).toBe(themeVariables.font.length)
      expect(Object.keys(component.generalForm.controls).length).toBe(themeVariables.general.length)
      expect(Object.keys(component.topbarForm.controls).length).toBe(themeVariables.topbar.length)
      expect(Object.keys(component.sidebarForm.controls).length).toBe(themeVariables.sidebar.length)
    })

    it('should load translations', (done: DoneFn) => {
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

      initializeComponent()

      // simulate async pipe
      component.actions$?.subscribe((actions) => {
        expect(actions.length).toBe(3)
        const cancelAction = actions.filter(
          (a) => a.label === 'actionCancel' && a.title === 'actionTooltipsCancelAndClose'
        )[0]
        spyOn<any>(component, 'close')
        cancelAction.actionCallback()
        expect(component['close']).toHaveBeenCalledTimes(1)

        const saveAction = actions.filter((a) => a.label === 'actionsSave' && a.title === 'actionsTooltipsSave')[0]
        spyOn<any>(component, 'updateTheme')
        saveAction.actionCallback()
        expect(component['updateTheme']).toHaveBeenCalledTimes(1)

        const saveAsAction = actions.filter((a) => a.label === 'actionSaveAs' && a.title === 'actionTooltipsSaveAs')[0]
        spyOn(component, 'saveAsNewPopup')
        saveAsAction.actionCallback()
        expect(component.saveAsNewPopup).toHaveBeenCalledTimes(1)

        done()
      })
    })

    it('should update document style on form changes', fakeAsync(() => {
      initializeComponent()

      component.autoApply = true

      const fontFormControlEl = fixture.debugElement.query(By.css('#theme_detail_font-family'))
      expect(fontFormControlEl).toBeDefined()
      fontFormControlEl.nativeElement.value = 'newFamily'
      fontFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const generalFormControlEl = fixture.debugElement.query(By.css('#theme_detail_item_color_primary-color'))
      expect(generalFormControlEl).toBeDefined()
      generalFormControlEl.nativeElement.value = 'rgba(0, 0, 0, 0.87)'
      generalFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const topbarFormControlEl = fixture.debugElement.query(By.css('#theme_detail_item_color_topbar-bg-color'))
      expect(topbarFormControlEl).toBeDefined()
      topbarFormControlEl.nativeElement.value = '#000000'
      topbarFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const sidebarFormControlEl = fixture.debugElement.query(By.css('#theme_detail_item_color_menu-text-color'))
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

      sidebarFormControlEl.nativeElement.value = null
      sidebarFormControlEl.nativeElement.dispatchEvent(new Event('input'))
      fixture.detectChanges()
      tick(300)
      expect(document.documentElement.style.getPropertyValue(`--menu-text-color`)).toBe('')
    }))
  })

  describe('after creation', () => {
    beforeEach(() => {
      initializeComponent()
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
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
      component.mode = 'EDIT'
      component.themeName = 'themeName'

      component.ngOnInit()

      expect(component.theme).toBe(themeData)
      expect(themeApiSpy.getThemeByName).toHaveBeenCalledOnceWith({ name: 'themeName' })
      expect(component.basicForm.controls['name'].value).toBe(themeData.name)
      expect(component.basicForm.controls['description'].value).toBe(themeData.description)
      expect(component.basicForm.controls['logoUrl'].value).toBe(themeData.logoUrl)
      expect(component.basicForm.controls['faviconUrl'].value).toBe(themeData.faviconUrl)
      expect(component.fontForm.controls['font-family'].value).toBe('myFont')
      expect(component.generalForm.controls['primary-color'].value).toBe('rgb(0,0,0)')
      expect(component.themeId).toBe('id')
    })

    it('should fetch logo and favicon from external source on edit mode when http[s] present', () => {
      const themeData = {
        logoUrl: 'http://myWeb.com/logo_url',
        faviconUrl: 'https://otherWeb.de/fav_url'
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
      component.mode = 'EDIT'
      component.themeName = 'themeName'

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

    it('should navigate back on close', (done: DoneFn) => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')

      component.actions$?.subscribe((actions) => {
        const closeAction = actions[0]
        closeAction.actionCallback()
        expect(router.navigate).toHaveBeenCalledOnceWith(['./..'], jasmine.any(Object))

        done()
      })
    })

    it('should display error when updating theme with invalid form', (done: DoneFn) => {
      spyOnProperty(component.propertiesForm, 'invalid').and.returnValue(true)

      component.actions$?.subscribe((actions) => {
        const updateThemeAction = actions[1]
        updateThemeAction.actionCallback()
        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })

        done()
      })
    })

    it('should display error when updating theme call fails', (done: DoneFn) => {
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
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
      themeApiSpy.updateTheme.and.returnValue(throwError(() => new Error()))

      component.actions$?.subscribe((actions) => {
        const updateThemeAction = actions[1]
        updateThemeAction.actionCallback()
        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })

        done()
      })
    })

    it('should only update properties and base theme data and show success when updating theme call is successful', (done: DoneFn) => {
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
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

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
      component.imageFaviconExists = true
      component.imageLogoExists = true

      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.actions$?.subscribe((actions) => {
        const updateThemeAction = actions[1]
        updateThemeAction.actionCallback()
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

        done()
      })
    })

    it('should apply changes when updating current theme is successful', (done: DoneFn) => {
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
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

      const updateThemeData = {
        resource: {
          id: 'updatedCallId'
        }
      }
      themeApiSpy.updateTheme.and.returnValue(of(updateThemeData) as any)

      component.themeIsCurrentUsedTheme = true

      component.actions$?.subscribe((actions) => {
        const updateThemeAction = actions[1]
        updateThemeAction.actionCallback()
        expect(themeServiceSpy.apply).toHaveBeenCalledOnceWith(updateThemeData as any)

        done()
      })
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
            name: 'myTheme'
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
        [`../../myTheme`],
        jasmine.objectContaining({ relativeTo: route })
      )
    })

    it('should set faviconUrl and logoUrl to undefined if they already exist', () => {
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
            name: 'myTheme'
          }
        }) as any
      )
      component.mode = 'EDIT'
      component.imageFaviconExists = true
      component.imageLogoExists = true

      component.saveTheme('myTheme')

      const createArgs = themeApiSpy.createTheme.calls.mostRecent().args[0]
      expect(createArgs.createThemeRequest?.resource).toEqual(
        jasmine.objectContaining({
          name: 'myTheme',
          description: newBasicData.description,
          logoUrl: undefined,
          faviconUrl: undefined,
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
        [`../../myTheme`],
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
            name: 'myTheme'
          }
        }) as any
      )
      component.mode = 'NEW'

      component.saveTheme('myTheme')

      expect(router.navigate).toHaveBeenCalledOnceWith([`../myTheme`], jasmine.objectContaining({ relativeTo: route }))
    })

    it('should display save as new popup on save as click', (done: DoneFn) => {
      component.saveAsNewPopupDisplay = false

      component.actions$?.subscribe((actions) => {
        const saveAction = actions[2]
        saveAction.actionCallback()
        expect(component.saveAsNewPopupDisplay).toBe(true)

        done()
      })
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

    it('should not upload a file if currThemeName is empty', () => {
      const event = {
        target: {
          files: ['file']
        }
      }
      component.basicForm.controls['name'].setValue('')

      component.onFileUpload(event as any, RefType.Logo)

      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'IMAGE.CONSTRAINT_FAILED',
        detailKey: 'IMAGE.CONSTRAINT_NAME'
      })
    })

    it('should not upload a file that is too large', () => {
      const largeBlob = new Blob(['a'.repeat(120000)], { type: 'image/png' })
      const largeFile = new File([largeBlob], 'test.png', { type: 'image/png' })
      const event = {
        target: {
          files: [largeFile]
        }
      }
      component.basicForm.controls['name'].setValue('name')

      component.onFileUpload(event as any, RefType.Logo)

      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'IMAGE.CONSTRAINT_FAILED',
        detailKey: 'IMAGE.CONSTRAINT_SIZE'
      })
    })

    it('should not upload a file without correct extension', () => {
      imgServiceSpy.getImage.and.returnValue(throwError(() => new Error()))
      const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
      const file = new File([blob], 'test.wrong', { type: 'image/png' })
      const event = {
        target: {
          files: [file]
        }
      }
      component.basicForm.controls['name'].setValue('name')

      component.onFileUpload(event as any, RefType.Logo)

      expect(component.displayFileTypeErrorLogo).toBeTrue()
    })

    it('should upload a file - update img: field type logo', () => {
      const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
        body: new Blob([''], { type: 'image/png' }),
        status: 200
      })
      imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
      const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })
      const event = {
        target: {
          files: [file]
        }
      }
      component.basicForm.controls['name'].setValue('name')

      component.onFileUpload(event as any, RefType.Logo)

      expect(msgServiceSpy.info).toHaveBeenCalledWith({
        summaryKey: 'IMAGE.UPLOADED'
      })
    })

    it('should upload a file - update image : field type favicon', () => {
      const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
        body: new Blob([''], { type: 'image/png' }),
        status: 200
      })
      imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
      const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })
      const event = {
        target: {
          files: [file]
        }
      }
      component.basicForm.controls['name'].setValue('name')

      component.onFileUpload(event as any, RefType.Favicon)

      expect(msgServiceSpy.info).toHaveBeenCalledWith({
        summaryKey: 'IMAGE.UPLOADED'
      })
    })

    it('should upload a file - upload image : field type logo', () => {
      imgServiceSpy.getImage.and.returnValue(throwError(() => new Error()))
      const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })
      const event = {
        target: {
          files: [file]
        }
      }
      component.basicForm.controls['name'].setValue('name')

      component.onFileUpload(event as any, RefType.Logo)

      expect(msgServiceSpy.info).toHaveBeenCalledWith({
        summaryKey: 'IMAGE.UPLOADED'
      })
    })

    it('should upload a file - upload image : field type favicon', () => {
      imgServiceSpy.getImage.and.returnValue(throwError(() => new Error()))
      const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })
      const event = {
        target: {
          files: [file]
        }
      }
      component.basicForm.controls['name'].setValue('name')

      component.onFileUpload(event as any, RefType.Favicon)

      expect(msgServiceSpy.info).toHaveBeenCalledWith({
        summaryKey: 'IMAGE.UPLOADED'
      })
    })

    it('should get logo img url: base url on empty logo url', () => {
      const theme = {
        id: 'id',
        description: 'desc',
        logoUrl: '',
        faviconUrl: 'fav_url',
        name: 'themeName'
      }

      const result = component.getImageUrl(theme, RefType.Logo)

      expect(result).toBe('basePath/images/themeName/logo')
    })

    it('should get favicon img url: base url on empty favicon url', () => {
      const theme = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: '',
        name: 'name'
      }

      const result = component.getImageUrl(theme, RefType.Favicon)

      expect(result).toBe('basePath/images/name/favicon')
    })

    it('should behave correctly onInputChange: favicon url exists', fakeAsync(() => {
      component.theme = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'name'
      }
      component.basicForm.controls['faviconUrl'].setValue('http://icon/path')

      component.onInputChange(RefType.Favicon)

      tick(1000)

      expect(component.fetchingFaviconUrl).toBe('http://icon/path')
    }))

    it('should behave correctly on onInputChange: logo url empty', fakeAsync(() => {
      component.theme = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'themeName'
      }
      component.basicForm.controls['logoUrl'].setValue('')
      component.imageLogoExists = true

      component.onInputChange(RefType.Logo)

      tick(1000)

      expect(component.fetchingLogoUrl).toBe('basePath/images/themeName/logo')
    }))

    it('should behave correctly on onInputChange: favicon url empty', fakeAsync(() => {
      component.theme = {
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
      component.basicForm.controls['faviconUrl'].setValue('')
      component.imageFaviconExists = true

      component.onInputChange(RefType.Favicon)

      tick(1000)

      expect(component.fetchingFaviconUrl).toBe('basePath/images/themeName/favicon')
    }))

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
      expect(component.fetchingFaviconUrl).toBe('fetchedFavUrl')
      expect(component.fetchingLogoUrl).toBe('fetchedLogoUrl')
    })
  })

  it('should test utility functions', () => {
    expect(component.getImageUrl(undefined, RefType.Logo)).toBeUndefined()
    expect(component.getImageUrl(undefined, RefType.Favicon)).toBeUndefined()

    const theme = {
      id: 'id',
      logoUrl: 'logo_url',
      faviconUrl: 'fav_url',
      name: 'name'
    }
    expect(component.getImageUrl(theme, RefType.Logo)).toBe(theme.logoUrl)
    expect(component.getImageUrl(theme, RefType.Favicon)).toBe(theme.faviconUrl)
  })
})
