import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing'
import { HttpResponse, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { By } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { ConfirmationService } from 'primeng/api'
import { InputSwitchModule } from 'primeng/inputswitch'
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog'

import { PortalMessageService, ThemeService } from '@onecx/portal-integration-angular'
import { CurrentThemeTopic } from '@onecx/integration-interface'

import { MimeType, RefType, ThemesAPIService, ImagesInternalAPIService } from 'src/app/shared/generated'
import { ThemeDesignerComponent } from './theme-designer.component'
import { themeVariables } from './theme-variables'

const validTheme = {
  id: 'id',
  name: 'themeName',
  displayName: 'themeDisplayName',
  description: 'desc',
  logoUrl: 'logo_url',
  faviconUrl: 'fav_url',
  properties: {
    font: { 'font-family': 'myFont' },
    general: { 'primary-color': 'rgb(0,0,0)' }
  }
}

describe('ThemeDesignerComponent', () => {
  let component: ThemeDesignerComponent
  let fixture: ComponentFixture<ThemeDesignerComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const themeServiceSpy = jasmine.createSpyObj<ThemeService>('ThemeService', ['apply'], {
    currentTheme$: of({
      isInitializedPromise: Promise.resolve(true),
      data: {},
      isInit: true,
      resolveInitPromise: () => {}
    }) as unknown as CurrentThemeTopic
  })
  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemes',
    'updateTheme',
    'createTheme',
    'getThemeById',
    'getThemeByName'
  ])
  const imgServiceSpy = {
    getImage: jasmine.createSpy('getImage').and.returnValue(of({})),
    deleteImage: jasmine.createSpy('deleteImage').and.returnValue(of({})),
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(of({})),
    configuration: { basePath: 'basePath' }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDesignerComponent],
      imports: [
        BrowserAnimationsModule,
        ConfirmDialogModule,
        FormsModule,
        InputSwitchModule,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeDesignerComponent }]),
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
    // reset data services
    themeApiSpy.getThemeById.calls.reset()
    themeApiSpy.getThemeByName.calls.reset()
    themeApiSpy.updateTheme.calls.reset()
    themeApiSpy.createTheme.calls.reset()
    themeApiSpy.getThemes.calls.reset()
    themeServiceSpy.apply.calls.reset()
    // to spy data: refill with neutral data
    themeApiSpy.getThemes.and.returnValue(of({}) as any)
    themeApiSpy.updateTheme.and.returnValue(of({}) as any)
    themeApiSpy.createTheme.and.returnValue(of({}) as any)
    themeApiSpy.getThemeById.and.returnValue(of({}) as any)
    imgServiceSpy.deleteImage.and.returnValue(of({}))
    imgServiceSpy.getImage.and.returnValue(of({}))
    imgServiceSpy.uploadImage.and.returnValue(of({}))
  }))

  function initializeComponent(): void {
    fixture = TestBed.createComponent(ThemeDesignerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  describe('construction', () => {
    beforeEach(() => {})

    it('should have edit changeMode when id present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(true)

      initializeComponent()

      expect(component.changeMode).toBe('EDIT')
    })

    it('should have create changeMode when id not present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(false)

      initializeComponent()

      expect(component.changeMode).toBe('CREATE')
    })

    it('should populate state and create forms', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('themeName')

      initializeComponent()

      expect(component.themeName).toBe('themeName')
      expect(component.autoApply).toBeFalse()
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
        spyOn<any>(component, 'onClose')
        cancelAction.actionCallback()
        expect(component['onClose']).toHaveBeenCalledTimes(1)

        const saveAction = actions.filter((a) => a.label === 'actionsSave' && a.title === 'actionsTooltipsSave')[0]
        spyOn<any>(component, 'onSaveTheme')
        saveAction.actionCallback()
        expect(component['onSaveTheme']).toHaveBeenCalledTimes(1)

        const saveAsAction = actions.filter((a) => a.label === 'actionSaveAs' && a.title === 'actionTooltipsSaveAs')[0]
        spyOn(component, 'onDisplaySaveAsDialog')
        saveAsAction.actionCallback()
        expect(component.onDisplaySaveAsDialog).toHaveBeenCalledTimes(1)

        done()
      })
    })

    it('should update document style on form changes', fakeAsync(() => {
      initializeComponent()

      component.autoApply = true

      const fontFormControlEl = fixture.debugElement.query(By.css('#th_designer_font-family'))
      expect(fontFormControlEl).toBeDefined()
      fontFormControlEl.nativeElement.value = 'newFamily'
      fontFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const generalFormControlEl = fixture.debugElement.query(By.css('#th_designer_item_color_primary-color'))
      expect(generalFormControlEl).toBeDefined()
      generalFormControlEl.nativeElement.value = 'rgba(0, 0, 0, 0.87)'
      generalFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const topbarFormControlEl = fixture.debugElement.query(By.css('#th_designer_item_color_topbar-bg-color'))
      expect(topbarFormControlEl).toBeDefined()
      topbarFormControlEl.nativeElement.value = '#000000'
      topbarFormControlEl.nativeElement.dispatchEvent(new Event('input'))

      const sidebarFormControlEl = fixture.debugElement.query(By.css('#th_designer_item_color_menu-text-color'))
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

  describe('after component initialization', () => {
    beforeEach(() => {
      initializeComponent()
    })

    it('should initialize component', () => {
      expect(component).toBeTruthy()
    })

    it('should populate form with theme data in edit changeMode', () => {
      const themeResponse = { resource: validTheme }
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
      component.changeMode = 'EDIT'
      component.themeName = 'themeName'

      component.ngOnInit()

      expect(component.theme).toBe(validTheme)
      expect(themeApiSpy.getThemeByName).toHaveBeenCalledOnceWith({ name: 'themeName' })
      expect(component.basicForm.controls['name'].value).toBe(validTheme.name)
      expect(component.basicForm.controls['description'].value).toBe(validTheme.description)
      expect(component.basicForm.controls['logoUrl'].value).toBe(validTheme.logoUrl)
      expect(component.basicForm.controls['faviconUrl'].value).toBe(validTheme.faviconUrl)
      expect(component.fontForm.controls['font-family'].value).toBe('myFont')
      expect(component.generalForm.controls['primary-color'].value).toBe('rgb(0,0,0)')
      expect(component.themeId).toBe('id')
    })

    it('should fetch logo and favicon from external source on edit changeMode when http[s] present', () => {
      const themeData = {
        logoUrl: 'http://myWeb.com/logo_url',
        faviconUrl: 'https://otherWeb.de/fav_url'
      }
      const themeResponse = {
        resource: themeData
      }
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
      component.changeMode = 'EDIT'
      component.themeName = 'themeName'

      component.ngOnInit()

      expect(component.fetchingLogoUrl).toBe(themeData.logoUrl)
      expect(component.fetchingFaviconUrl).toBe(themeData.faviconUrl)
    })

    it('should populate forms with default values if not in edit changeMode', () => {
      const documentStyle = getComputedStyle(document.documentElement).getPropertyValue('--font-family')

      component.ngOnInit()

      expect(component.fontForm.controls['font-family'].value).toBe(documentStyle)
    })

    it('should load all templates basic data on initialization', () => {
      const themeArr = [
        {
          id: 'id1',
          name: 'theme1',
          displayName: 'themeDisplay1',
          description: 'desc1'
        },
        {
          id: 'id2',
          name: 'myTheme',
          displayName: 'themeDisplay2',
          description: 'desc2'
        }
      ]
      themeApiSpy.getThemes.and.returnValue(of({ stream: themeArr }) as any)

      component.ngOnInit()
      expect(component.themeTemplates).toEqual([
        { label: 'themeDisplay1', value: 'id1' },
        { label: 'themeDisplay2', value: 'id2' }
      ])
    })

    it('should navigate back on close', (done: DoneFn) => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true))

      component.actions$?.subscribe((actions) => {
        const closeAction = actions[0]
        closeAction.actionCallback()
        setTimeout(() => {
          expect(router.navigate).toHaveBeenCalledOnceWith(['./..'], jasmine.any(Object))
          done()
        }, 0)
      })
    })

    it('should display error when updating theme with invalid basic form', () => {
      spyOnProperty(component.basicForm, 'invalid').and.returnValue(true)

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should display error when updating theme with invalid property form', () => {
      spyOnProperty(component.propertiesForm, 'invalid').and.returnValue(true)

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should display error when theme data are not ready', (done: DoneFn) => {
      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.propertiesForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      // display name is missing
      const newBasicData = {
        name: 'updatedName',
        description: 'updatedDesc',
        logoUrl: 'updated_logo_url',
        faviconUrl: 'updated_favicon_url'
      }
      component.basicForm.patchValue(newBasicData)

      component.actions$?.subscribe((actions) => {
        const updateThemeAction = actions[1]
        updateThemeAction.actionCallback()
        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
        done()
      })
    })

    // on save
    it('should only update properties and base theme data and show success when updating theme call is successful', () => {
      component.themeId = 'id'
      const themeResponse = { resource: validTheme }
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

      // updating forms with different data
      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const newBasicData = {
        name: 'updatedName',
        displayName: 'updatedDisplayName',
        description: 'updatedDesc',
        logoUrl: 'updated_logo_url',
        faviconUrl: 'updated_favicon_url'
      }
      component.basicForm.patchValue(newBasicData)
      component.imageFaviconUrlExists = true
      component.imageLogoUrlExists = true

      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.changeMode = 'EDIT'
      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_OK' })
      expect(themeApiSpy.updateTheme).toHaveBeenCalledTimes(1)
      const updateArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(updateArgs.updateThemeRequest?.resource.name).toBe(newBasicData.name)
      expect(updateArgs.updateThemeRequest?.resource.description).toBe(newBasicData.description)
      expect(updateArgs.updateThemeRequest?.resource.logoUrl).toBe(newBasicData.logoUrl)
      expect(updateArgs.updateThemeRequest?.resource.faviconUrl).toBe(newBasicData.faviconUrl)
      expect(updateArgs.updateThemeRequest?.resource.properties).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'updatedFont' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
    })

    it('should apply changes when updating current theme is successful', (done: DoneFn) => {
      component.themeId = 'id'
      const themeResponse = { resource: validTheme }
      themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const newBasicData = {
        name: 'updatedName',
        displayName: 'updatedDisplayName',
        description: 'updatedDesc',
        logoUrl: 'updated_logo_url',
        faviconUrl: 'updated_favicon_url'
      }
      component.basicForm.patchValue(newBasicData)

      const updateThemeData = { resource: validTheme }
      themeApiSpy.updateTheme.and.returnValue(of(updateThemeData) as any)

      component.autoApply = true
      component.changeMode = 'EDIT'

      component.actions$?.subscribe((actions) => {
        const saveThemeAction = actions[1]
        saveThemeAction.actionCallback()
        expect(themeServiceSpy.apply).toHaveBeenCalledOnceWith(updateThemeData as any)
        done()
      })
    })

    describe('save as errors', () => {
      it('should display theme already exists message', () => {
        const errorResponse = {
          error: { message: 'Theme already exists', errorCode: 'PERSIST_ENTITY_FAILED' },
          statusText: 'Bad Request',
          status: 400
        }
        themeApiSpy.createTheme.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.onSaveAsTheme()

        expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
          summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_NOK',
          detailKey: 'ACTIONS.CREATE.MESSAGE.THEME_ALREADY_EXISTS'
        })
      })

      it('should display error message on theme save failure on creation', () => {
        const errorResponse = { error: 'Cannot create', statusText: 'Bad Request', status: 400 }
        themeApiSpy.createTheme.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.onSaveAsTheme()

        expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
          summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_NOK',
          detailKey: errorResponse.error
        })
      })

      it('should display error message on theme updating', () => {
        const errorResponse = { error: 'Cannot update', statusText: 'Bad Request', status: 400 }
        component.themeId = validTheme.id
        component.themeName = validTheme.name
        const themeResponse = { resource: validTheme }
        themeApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
        themeApiSpy.updateTheme.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.changeMode = 'EDIT'
        component.basicForm.patchValue(validTheme)
        component.fontForm.patchValue(validTheme.properties.font)
        component.generalForm.patchValue(validTheme.properties.general)

        component.onSaveTheme()

        expect(component.basicForm.valid).toBeTrue()
        expect(component.propertiesForm.valid).toBeTrue()
        expect(console.error).toHaveBeenCalledWith('updateTheme', errorResponse)
        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })
      })
    })

    it('should display success message and route correctly on update', () => {
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
      component.fontForm.patchValue({ 'font-family': 'newFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      themeApiSpy.createTheme.and.returnValue(of({ resource: { name: 'myTheme' } }) as any)

      component.changeMode = 'EDIT'
      component.saveAsForm.patchValue({ themeName: 'myTheme', displayName: 'myDisplayName' })
      component.onSaveAsTheme()

      const createArgs = themeApiSpy.createTheme.calls.mostRecent().args[0]
      expect(createArgs.createThemeRequest?.resource).toEqual(
        jasmine.objectContaining({
          name: 'myTheme',
          displayName: 'myDisplayName',
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

    it('should display success message in create changeMode', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')

      component.basicForm.patchValue(validTheme)
      component.fontForm.patchValue(validTheme.properties.font)
      component.generalForm.patchValue(validTheme.properties.general)
      themeApiSpy.createTheme.and.returnValue(of({ resource: { name: 'myTheme' } }) as any)

      component.changeMode = 'CREATE'
      component.onSaveTheme()

      const createArgs = themeApiSpy.createTheme.calls.mostRecent().args[0]
      expect(createArgs.createThemeRequest?.resource).toEqual(
        jasmine.objectContaining({
          name: validTheme.name,
          displayName: validTheme.displayName,
          description: validTheme.description,
          logoUrl: validTheme.logoUrl,
          faviconUrl: validTheme.faviconUrl,
          properties: jasmine.objectContaining({
            font: jasmine.objectContaining(validTheme.properties.font),
            general: jasmine.objectContaining(validTheme.properties.general)
          })
        })
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
      component.changeMode = 'EDIT'
      component.imageFaviconUrlExists = true
      component.imageLogoUrlExists = true

      component.saveAsForm.patchValue({ themeName: 'myTheme', displayName: 'myDisplayName' })
      component.onSaveAsTheme()

      const createArgs = themeApiSpy.createTheme.calls.mostRecent().args[0]
      expect(createArgs.createThemeRequest?.resource).toEqual(
        jasmine.objectContaining({
          name: 'myTheme',
          displayName: 'myDisplayName',
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

    it('should display success message and route correctly in create changeMode', () => {
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
      component.fontForm.patchValue({ 'font-family': 'newFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      themeApiSpy.createTheme.and.returnValue(of({ resource: { name: 'myTheme' } }) as any)
      component.changeMode = 'CREATE'

      component.saveAsForm.patchValue({ themeName: 'myTheme', displayName: 'myDisplayName' })
      component.onSaveAsTheme()

      expect(router.navigate).toHaveBeenCalledOnceWith([`../myTheme`], jasmine.objectContaining({ relativeTo: route }))
    })

    it('should display save as new popup on save as click', (done: DoneFn) => {
      component.displaySaveAsDialog = false

      component.actions$?.subscribe((actions) => {
        const saveAction = actions[2]
        saveAction.actionCallback()
        expect(component.displaySaveAsDialog).toBe(true)

        done()
      })
    })

    it('should use form theme name in save as dialog while in create changeMode', () => {
      component.basicForm.controls['name'].setValue('themeName')
      component.basicForm.controls['displayName'].setValue('themeDisplayName')
      component.changeMode = 'CREATE'

      component.onDisplaySaveAsDialog()

      expect(component.saveAsForm.controls['themeName'].value).toBe(component.copyOfPrefix + 'themeName')
      expect(component.saveAsForm.controls['displayName'].value).toBe(component.copyOfPrefix + 'themeDisplayName')
    })

    it('should use form theme name in save as dialog while in create changeMode', () => {
      component.basicForm.controls['name'].setValue('themeName')
      component.basicForm.controls['displayName'].setValue('themeDisplayName')
      component.changeMode = 'EDIT'

      component.onDisplaySaveAsDialog()

      expect(component.saveAsForm.controls['themeName'].value).toBe(component.copyOfPrefix + 'themeName')
      expect(component.saveAsForm.controls['displayName'].value).toBe(component.copyOfPrefix + 'themeDisplayName')
    })

    describe('file upload', () => {
      describe('checks before upload', () => {
        it('should not upload a file if currThemeName is empty', () => {
          const event = { target: { files: ['file'] } }
          component.basicForm.controls['name'].setValue('')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_NAME'
          })
        })

        it('should not upload a file that is too large', () => {
          const largeBlob = new Blob(['a'.repeat(120000)], { type: MimeType.Png })
          const largeFile = new File([largeBlob], 'test.png', { type: MimeType.Png })
          const event = { target: { files: [largeFile] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_SIZE'
          })
        })

        it('should not upload a file without correct extension', () => {
          imgServiceSpy.getImage.and.returnValue(throwError(() => new Error()))
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.Png })
          const file = new File([blob], 'test.wrong', { type: MimeType.Png })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)

          expect(component.displayFileTypeErrorLogo).toBeTrue()
        })

        it('should display error if there are no files on upload image', () => {
          const event = { target: { files: undefined } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_FILE_MISSING'
          })
        })
      })

      describe('upload if file not exist', () => {
        it('should upload logo', () => {
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: MimeType.Png }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.Png })
          const file = new File([blob], 'test.png', { type: MimeType.Png })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOADED' })
        })

        it('should upload favicon', () => {
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: MimeType.XIcon }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.XIcon })
          const file = new File([blob], 'test.ico', { type: MimeType.XIcon })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Favicon)

          expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOADED' })
        })
      })

      it('should manage upload error', () => {
        const errorResponse = { status: 400, statusText: 'error on uploading' }
        imgServiceSpy.uploadImage.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        const blob = new Blob(['a'.repeat(10)], { type: MimeType.XIcon })
        const file = new File([blob], 'test.ico', { type: MimeType.XIcon })
        const event = { target: { files: [file] } }
        component.basicForm.controls['name'].setValue('name')

        component.onFileUpload(event as any, RefType.Favicon)

        expect(console.error).toHaveBeenCalledWith('uploadImage', errorResponse)
      })
    })

    describe('image loading result', () => {
      it('should load logo - failed', () => {
        component.theme = {
          id: 'id',
          name: 'themeName',
          logoUrl: 'path to logo',
          faviconUrl: 'path to favicon'
        }
        component.onImageLoadResult(RefType.Logo, false)

        expect(component.imageLogoExists).toBeFalse()
        expect(component.fetchingLogoUrl).toBeUndefined()
      })

      it('should load logo - success', () => {
        component.theme = {
          id: 'id',
          name: 'themeName',
          logoUrl: 'path to logo',
          faviconUrl: 'path to favicon'
        }
        component.onImageLoadResult(RefType.Logo, true)

        expect(component.imageLogoExists).toBeTrue()
        expect(component.fetchingLogoUrl).toEqual(component.theme.logoUrl)
      })

      it('should load favicon - failed', () => {
        component.theme = {
          id: 'id',
          name: 'themeName',
          logoUrl: 'path to logo',
          faviconUrl: 'path to favicon'
        }
        component.onImageLoadResult(RefType.Favicon, false)

        expect(component.imageFaviconExists).toBeFalse()
        expect(component.fetchingFaviconUrl).toBeUndefined()
      })

      it('should load favicon - success', () => {
        component.theme = {
          id: 'id',
          name: 'themeName',
          logoUrl: 'path to logo',
          faviconUrl: 'path to favicon'
        }
        component.onImageLoadResult(RefType.Favicon, true)

        expect(component.imageFaviconExists).toBeTrue()
        expect(component.fetchingFaviconUrl).toEqual(component.theme.faviconUrl)
      })
    })

    describe('remove image', () => {
      it('should abort deletion if theme name is missing', () => {
        component.basicForm.controls['name'].setValue('')

        component.onRemoveImage(RefType.Logo)

        expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
          summaryKey: 'IMAGE.CONSTRAINT_FAILED',
          detailKey: 'IMAGE.CONSTRAINT_NAME'
        })
      })

      it('should delete logo - successful', () => {
        component.basicForm.controls['name'].setValue('theme')
        component.imageLogoExists = true
        imgServiceSpy.deleteImage.and.returnValue(of({}))

        component.onRemoveImage(RefType.Logo)

        expect(component.fetchingLogoUrl).toBeUndefined()
        expect(component.imageLogoExists).toBeFalse()
      })

      it('should delete favicon - successful', () => {
        component.basicForm.controls['name'].setValue('theme')
        component.imageFaviconExists = true
        imgServiceSpy.deleteImage.and.returnValue(of({}))

        component.onRemoveImage(RefType.Favicon)

        expect(component.fetchingFaviconUrl).toBeUndefined()
        expect(component.imageFaviconExists).toBeFalse()
      })

      it('should delete favicon - failed', () => {
        component.basicForm.controls['name'].setValue('theme')
        component.imageFaviconExists = true
        const errorResponse = { status: 400, statusText: 'error on uploading' }
        imgServiceSpy.deleteImage.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.onRemoveImage(RefType.Favicon)

        expect(component.imageFaviconExists).toBeTrue()
        expect(console.error).toHaveBeenCalledWith('deleteImage', errorResponse)
      })
    })

    describe('image url', () => {
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
    })

    it('should behave correctly onInputChange: logo url exists', fakeAsync(() => {
      component.theme = {
        id: 'id',
        description: 'desc',
        logoUrl: 'logo_url',
        faviconUrl: 'fav_url',
        name: 'name'
      }
      component.basicForm.controls['logoUrl'].setValue('http://icon/path')

      component.onInputChange(RefType.Logo)

      tick(1000)
      expect(component.fetchingLogoUrl).toBe('http://icon/path')
    }))

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
      component.imageLogoUrlExists = true

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
          font: { 'font-family': 'myFont' },
          general: { 'primary-color': 'rgb(0,0,0)' }
        }
      }
      component.basicForm.controls['faviconUrl'].setValue('')
      component.imageFaviconUrlExists = true

      component.onInputChange(RefType.Favicon)

      tick(1000)
      expect(component.fetchingFaviconUrl).toBe('basePath/images/themeName/favicon')
    }))

    it('should use translation data on theme template change', () => {
      component.themeTemplates = [
        { label: 'theme1', value: 'id1' },
        { label: 'myTheme', value: 'id2' }
      ]
      const translationData = {
        'GENERAL.COPY_OF': 'Copy of ',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))
      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance

      component.onThemeTemplateDropdownChange({ value: 'id2' })
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
        { label: 'theme1', value: 'id1' },
        { label: 'myTheme', value: 'id2' }
      ]
      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const reject = spyOn(confirmdialog, 'reject').and.callThrough()
      component.onThemeTemplateDropdownChange({ value: 'id2' })
      fixture.detectChanges()
      component = fixture.componentInstance

      const cancelBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-reject')
      cancelBtn.click()

      expect(reject).toHaveBeenCalled()
    })

    it('should populate only properties with template data on confirmation accept and EDIT changeMode', () => {
      component.themeTemplates = [
        { label: 'theme1', value: 'id1' },
        { label: 'myTheme', value: 'id2' }
      ]

      component.onThemeTemplateDropdownChange({ value: 'id2' })

      const translationData = {
        'GENERAL.COPY_OF': 'Copy of ',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      component.changeMode = 'EDIT'
      const basicFormBeforeFetch = {
        name: 'n',
        displayName: 'ndisplay',
        description: 'd',
        faviconUrl: 'f',
        logoUrl: 'l'
      }
      component.basicForm.patchValue(basicFormBeforeFetch)

      const fetchedTheme = {
        name: 'fetchedName',
        displayName: 'fetchedNamedisplay',
        description: 'fetchedDesc',
        faviconUrl: 'fetchedFavUrl',
        logoUrl: 'fetchedLogoUrl',
        properties: {
          font: { 'font-family': 'fetchedFont' },
          general: { 'primary-color': 'rgb(255,255,255)' }
        }
      }
      const fetchedThemeResponse = { resource: fetchedTheme }
      themeApiSpy.getThemeById.and.returnValue(of(fetchedThemeResponse) as any)

      component.fetchingFaviconUrl = 'ffu'
      component.fetchingLogoUrl = 'flu'

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onThemeTemplateDropdownChange({ value: 'id2' })
      fixture.detectChanges()

      const acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
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

    it('should populate properties and basic info with template data on confirmation accept and NEW changeMode', () => {
      component.themeTemplates = [
        { label: 'theme1', value: 'id1' },
        { label: 'myTheme', value: 'id2' }
      ]

      const translationData = {
        'GENERAL.COPY_OF': 'Copy of ',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      component.changeMode = 'CREATE'
      const basicFormBeforeFetch = {
        name: 'n',
        displayName: 'n',
        description: 'd',
        faviconUrl: 'f',
        logoUrl: 'l'
      }
      component.basicForm.patchValue(basicFormBeforeFetch)

      const fetchedTheme = {
        name: 'fetchedName',
        displayName: 'fetchedNamedisplay',
        description: 'fetchedDesc',
        faviconUrl: 'fetchedFavUrl',
        logoUrl: 'fetchedLogoUrl',
        properties: {
          font: { 'font-family': 'fetchedFont' },
          general: { 'primary-color': 'rgb(255,255,255)' }
        }
      }
      const fetchedThemeResponse = {
        resource: fetchedTheme
      }
      themeApiSpy.getThemeById.and.returnValue(of(fetchedThemeResponse) as any)

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onThemeTemplateDropdownChange({ value: 'id2' })
      fixture.detectChanges()

      const acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component.basicForm.value).toEqual({
        name: 'Copy of fetchedName',
        displayName: 'fetchedNamedisplay',
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
