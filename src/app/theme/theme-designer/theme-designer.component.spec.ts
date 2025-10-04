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

import { CurrentThemeTopic } from '@onecx/integration-interface'
import { PortalMessageService, ThemeService } from '@onecx/angular-integration-interface'

import { MimeType, RefType, ThemesAPIService, ImagesInternalAPIService, Theme } from 'src/app/shared/generated'
import { ThemeDesignerComponent } from './theme-designer.component'
import { themeVariables } from './theme-variables'

const validTheme = {
  id: 'id',
  name: 'themeName',
  displayName: 'themeDisplayName',
  mandatory: false,
  description: 'desc',
  logoUrl: 'https://host/path-to-logo',
  smallLogoUrl: 'https://host/path-to-small_logo',
  faviconUrl: 'https://host/path-to-favicon',
  properties: {
    font: { 'font-family': 'myFont' },
    general: { 'primary-color': 'rgb(0,0,0)' }
  }
}

describe('ThemeDesignerComponent', () => {
  let component: ThemeDesignerComponent
  let fixture: ComponentFixture<ThemeDesignerComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const themeServiceSpy = jasmine.createSpyObj<ThemeService>('ThemeService', ['apply'], {
    currentTheme$: of({
      isInitializedPromise: Promise.resolve(true),
      data: {},
      isInit: true,
      resolveInitPromise: () => {}
    }) as unknown as CurrentThemeTopic
  })
  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemeById',
    'getThemeByName',
    'createTheme',
    'updateTheme',
    'searchThemes'
  ])
  const imgServiceSpy = {
    getImage: jasmine.createSpy('getImage').and.returnValue(of({})),
    deleteImage: jasmine.createSpy('deleteImage').and.returnValue(of({})),
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(of({})),
    configuration: { basePath: 'basePath' }
  }

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeDesignerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
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
  }))

  beforeEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    // reset data services
    themeApiSpy.getThemeById.calls.reset()
    themeApiSpy.getThemeByName.calls.reset()
    themeApiSpy.updateTheme.calls.reset()
    themeApiSpy.createTheme.calls.reset()
    themeApiSpy.searchThemes.calls.reset()
    themeServiceSpy.apply.calls.reset()
    // to spy data: refill with neutral data
    themeApiSpy.searchThemes.and.returnValue(of({}) as any)
    themeApiSpy.updateTheme.and.returnValue(of({}) as any)
    themeApiSpy.createTheme.and.returnValue(of({}) as any)
    themeApiSpy.getThemeById.and.returnValue(of({}) as any)
    themeApiSpy.getThemeByName.and.returnValue(of({}) as any)
    imgServiceSpy.deleteImage.and.returnValue(of({}))
    imgServiceSpy.getImage.and.returnValue(of({}))
    imgServiceSpy.uploadImage.and.returnValue(of({}))
  })

  describe('construction', () => {
    beforeEach(() => {})

    it('should have edit changeMode when id present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(true)

      initTestComponent()

      expect(component.changeMode).toBe('EDIT')
    })

    it('should have create changeMode when id not present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'has').and.returnValue(false)

      initTestComponent()

      expect(component.changeMode).toBe('CREATE')
    })

    it('should populate state and create forms', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('themeName')

      initTestComponent()

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

      initTestComponent()

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
      initTestComponent()

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

  describe('initialization', () => {
    beforeEach(() => {
      initTestComponent()
    })

    it('should initialize component', () => {
      expect(component).toBeTruthy()
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
  })

  describe('form', () => {
    beforeEach(() => {
      initTestComponent()
    })

    it('should populate form with theme data in edit changeMode', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name

      component.ngOnInit()

      expect(component.theme).toBe(validTheme)
      expect(themeApiSpy.getThemeByName).toHaveBeenCalledOnceWith({ name: validTheme.name })
      expect(component.basicForm.controls['name'].value).toBe(validTheme.name)
      expect(component.basicForm.controls['description'].value).toBe(validTheme.description)
      expect(component.basicForm.controls['logoUrl'].value).toBe(validTheme.logoUrl)
      expect(component.basicForm.controls['faviconUrl'].value).toBe(validTheme.faviconUrl)
      expect(component.fontForm.controls['font-family'].value).toBe('myFont')
      expect(component.generalForm.controls['primary-color'].value).toBe('rgb(0,0,0)')
      expect(component.themeId).toBe('id')

      expect(component.imageUrl[RefType.Logo]).toBe(validTheme.logoUrl)
      expect(component.imageUrl[RefType.LogoSmall]).toBe(validTheme.smallLogoUrl)
      expect(component.imageUrl[RefType.Favicon]).toBe(validTheme.faviconUrl)
    })

    it('should populate forms with default values if not in edit changeMode', () => {
      const documentStyle = getComputedStyle(document.documentElement).getPropertyValue('--font-family')

      component.ngOnInit()

      expect(component.fontForm.controls['font-family'].value).toBe(documentStyle)
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
  })

  describe('save theme', () => {
    beforeEach(() => {
      initTestComponent()
    })

    it('should display error when updating theme with invalid basic form', () => {
      spyOnProperty(component.basicForm, 'invalid').and.returnValue(true)

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should display error when updating theme with invalid property form', () => {
      spyOnProperty(component.basicForm, 'valid').and.returnValue(true)
      spyOnProperty(component.propertiesForm, 'invalid').and.returnValue(true)

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should update theme base and property data with logo URLs - successful', () => {
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.ngOnInit()

      // updating forms with different data
      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const basicData = {
        displayName: 'new display name',
        description: 'new desc',
        logoUrl: 'https://newhost/path-to-logo'
      }
      component.basicForm.patchValue(basicData)

      expect(component.imageUrlExists[RefType.Logo]).toBeTrue()
      expect(component.basicForm.valid).toBeTrue()

      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
      expect(themeApiSpy.updateTheme).toHaveBeenCalledTimes(1)
      const updateArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(updateArgs.updateThemeRequest?.resource.description).toBe(basicData.description)
      expect(updateArgs.updateThemeRequest?.resource.logoUrl).toBe(basicData.logoUrl)
      expect(updateArgs.updateThemeRequest?.resource.properties).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'updatedFont' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
    })

    it('should update theme base and property data without logo URLs - successful', () => {
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name
      const theme: Theme = { ...validTheme, logoUrl: undefined, smallLogoUrl: undefined, faviconUrl: undefined }
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.ngOnInit()

      // updating forms with different data
      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const basicData = {
        displayName: 'new display name',
        description: 'new desc',
        logoUrl: 'https://newhost/path-to-logo'
      }
      component.basicForm.patchValue(basicData)

      expect(component.imageUrlExists[RefType.Logo]).toBeFalse()
      expect(component.basicForm.valid).toBeTrue()

      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
      expect(themeApiSpy.updateTheme).toHaveBeenCalledTimes(1)
      const updateArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(updateArgs.updateThemeRequest?.resource.description).toBe(basicData.description)
      expect(updateArgs.updateThemeRequest?.resource.logoUrl).toBe(basicData.logoUrl)
      expect(updateArgs.updateThemeRequest?.resource.properties).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'updatedFont' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
    })

    it('should apply changes when updating theme is successful', () => {
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)

      component.ngOnInit()
      component.autoApply = true

      expect(component.theme).toEqual(validTheme)

      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const newBasicData = {
        displayName: 'new display name',
        description: 'new description',
        logoUrl: 'https://new-host-name/path-to-logo'
      }
      component.basicForm.patchValue(newBasicData)

      const updateThemeData = { resource: { ...validTheme, ...newBasicData } }
      themeApiSpy.updateTheme.and.returnValue(of(updateThemeData) as any)

      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
      expect(themeServiceSpy.apply).toHaveBeenCalled()
    })

    it('should update theme failed', () => {
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      const errorResponse = { error: 'Cannot create', statusText: 'Bad Request', status: 400 }
      themeApiSpy.updateTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()

      component.fontForm.patchValue({ 'font-family': 'updatedFont' })

      expect(component.basicForm.valid).toBeTrue()

      component.onSaveTheme()

      expect(themeApiSpy.updateTheme).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith('updateTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
    })
  })

  describe('save as new theme', () => {
    beforeEach(() => {
      initTestComponent()
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
  })

  describe('CREATE theme', () => {
    beforeEach(() => {
      initTestComponent()
      component.autoApply = false
      component.ngOnInit()
    })

    it('should create theme and route to it via saveAs - CREATE mode', () => {
      component.changeMode = 'CREATE'
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      const route = TestBed.inject(ActivatedRoute)
      const basicData = { name: 'name', displayName: 'display name' }

      themeApiSpy.createTheme.and.returnValue(of({ resource: { name: basicData.name } }) as any)
      component.fontForm.patchValue({ 'font-family': 'newFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      component.saveAsForm.patchValue({ themeName: basicData.name, displayName: basicData.displayName })

      component.onSaveAsTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
      expect(router.navigate).toHaveBeenCalledOnceWith(
        [`../` + basicData.name],
        jasmine.objectContaining({ relativeTo: route })
      )
    })

    it('should create theme and route to it via save - CREATE mode', () => {
      component.changeMode = 'CREATE'
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      const route = TestBed.inject(ActivatedRoute)
      const basicData = {
        name: 'name',
        displayName: 'display name',
        description: 'desc'
      }
      themeApiSpy.createTheme.and.returnValue(of({ resource: { name: basicData.name } }) as any)
      component.basicForm.patchValue(basicData)
      component.fontForm.patchValue({ 'font-family': 'newFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })

      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
      expect(router.navigate).toHaveBeenCalledOnceWith(
        [`../` + basicData.name],
        jasmine.objectContaining({ relativeTo: route })
      )
    })

    it('should create theme and route to it via saveAs - EDIT mode', () => {
      component.changeMode = 'EDIT'
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      const route = TestBed.inject(ActivatedRoute)
      const basicData = { name: 'name', displayName: 'display name' }

      themeApiSpy.createTheme.and.returnValue(of({ resource: { name: basicData.name } }) as any)
      component.basicForm.patchValue(basicData)
      component.fontForm.patchValue({ 'font-family': 'newFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      component.saveAsForm.patchValue({ themeName: basicData.name, displayName: basicData.displayName })

      component.onSaveAsTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
      expect(router.navigate).toHaveBeenCalledOnceWith(
        [`../../` + basicData.name],
        jasmine.objectContaining({ relativeTo: route })
      )
    })

    it('should create theme failed with error message', () => {
      const errorResponse = { error: 'Cannot create', statusText: 'Bad Request', status: 400 }
      themeApiSpy.createTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onSaveAsTheme()

      expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
        detailKey: errorResponse.error
      })
    })

    it('should create theme failed with error message - CONSTRAINT', () => {
      const errorResponse = { error: { errorCode: 'PERSIST_ENTITY_FAILED' }, statusText: 'Bad Request', status: 400 }
      themeApiSpy.createTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onSaveAsTheme()

      expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
        detailKey: 'ACTIONS.CREATE.MESSAGE.THEME_ALREADY_EXISTS'
      })
    })
  })

  describe('templating', () => {
    const themes: Theme[] = [validTheme, { ...validTheme, id: 'id2', name: 'name2', displayName: 'display name 2' }]

    beforeEach(() => {
      themeApiSpy.searchThemes.and.returnValue(of({ totalElements: 1, stream: themes }) as any)
    })

    describe('themes', () => {
      it('should get themes - success', (done: DoneFn) => {
        themeApiSpy.searchThemes.and.returnValue(of({ totalElements: 1, stream: themes }) as any)

        initTestComponent()
        component.changeMode === 'CREATE'
        component.ngOnInit()

        component.themes$?.subscribe((data) => {
          expect(data).toEqual(themes)
          done()
        })
      })

      it('should get themes - failed', (done: DoneFn) => {
        const errorResponse = { statusText: 'Bad Request', status: 400 }
        themeApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        initTestComponent()
        component.changeMode === 'CREATE'
        component.ngOnInit()

        component.themes$?.subscribe((data) => {
          expect(data).toEqual([])
          done()
        })

        expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
      })
    })

    it('should use translation data on theme template change', () => {
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme }) as any)
      initTestComponent()
      component.changeMode === 'CREATE'
      component.ngOnInit()

      const translationData = {
        'ACTIONS.COPY_OF': 'Copy of ',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))
      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance

      component.onSelectThemeTemplate({ value: themes[1].name }, themes)
      fixture.detectChanges()

      expect(confirmdialog.confirmation).toEqual(
        jasmine.objectContaining({
          header: 'themeTemplateConfirmationHeader',
          message: themes[1].displayName + ' themeTemplateConfirmationMessage',
          acceptLabel: 'actionsConfirmationYes',
          rejectLabel: 'actionsConfirmationNo'
        })
      )
    })

    it('should reset selected template on confirmation reject', () => {
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme }) as any)
      initTestComponent()
      component.changeMode === 'CREATE'
      component.ngOnInit()

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const reject = spyOn(confirmdialog, 'reject').and.callThrough()
      component.onSelectThemeTemplate({ value: themes[1].name }, themes)
      fixture.detectChanges()
      component = fixture.componentInstance

      const cancelBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-reject')
      cancelBtn.click()

      expect(reject).toHaveBeenCalled()
    })

    it('should populate only properties with template data on confirmation accept and EDIT changeMode', () => {
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme }) as any)
      initTestComponent()
      component.changeMode === 'EDIT'
      component.ngOnInit()

      component.onSelectThemeTemplate({ value: themes[1].name }, themes)

      const translationData = {
        'ACTIONS.COPY_OF': 'Copy of ',
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
        mandatory: false,
        description: 'd',
        faviconUrl: 'f',
        logoUrl: 'l',
        smallLogoUrl: 's'
      }
      component.basicForm.patchValue(basicFormBeforeFetch)

      const theme = {
        name: 'Name',
        displayName: 'Namedisplay',
        description: 'Desc',
        faviconUrl: 'FavUrl',
        logoUrl: 'LogoUrl',
        smallLogoUrl: 'SmallLogoUrl',
        properties: {
          font: { 'font-family': 'Font' },
          general: { 'primary-color': 'rgb(255,255,255)' }
        }
      }
      const themeResponse = { resource: theme }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onSelectThemeTemplate({ value: themes[1].name }, themes)
      fixture.detectChanges()

      const acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component.basicForm.value).toEqual(basicFormBeforeFetch)
      expect(component.propertiesForm.value).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'Font' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
    })

    it('should populate properties and basic info with template data on confirmation accept and NEW changeMode', () => {
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme }) as any)
      initTestComponent()
      component.changeMode === 'EDIT'
      component.ngOnInit()

      const translationData = {
        'ACTIONS.COPY_OF': 'Copy of ',
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
        mandatory: null,
        description: 'd',
        logoUrl: 'l',
        smallLogoUrl: 's',
        faviconUrl: 'f'
      }
      component.basicForm.patchValue(basicFormBeforeFetch)

      const theme = {
        name: 'Name',
        displayName: 'Namedisplay',
        description: 'Desc',
        logoUrl: 'LogoUrl',
        smallLogoUrl: 'SmallLogoUrl',
        faviconUrl: 'FavUrl',
        properties: {
          font: { 'font-family': 'Font' },
          general: { 'primary-color': 'rgb(255,255,255)' }
        }
      }
      const themeResponse = { resource: theme }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onSelectThemeTemplate({ value: themes[1].name }, themes)
      fixture.detectChanges()

      const acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component.basicForm.value).toEqual({
        name: 'Copy of Name',
        mandatory: null,
        displayName: 'Namedisplay',
        description: 'Desc',
        logoUrl: 'LogoUrl',
        smallLogoUrl: 'SmallLogoUrl',
        faviconUrl: 'FavUrl'
      })
      expect(component.propertiesForm.value).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'Font' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
      expect(component.imageUrl[RefType.Logo]).toBe('LogoUrl')
      expect(component.imageUrl[RefType.LogoSmall]).toBe('SmallLogoUrl')
      expect(component.imageUrl[RefType.Favicon]).toBe('FavUrl')
    })
  })

  describe('image', () => {
    beforeEach(() => {
      initTestComponent()
      component.autoApply = false
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      component.ngOnInit()
    })

    describe('setImageUrl', () => {
      it('call with undefined theme', () => {
        expect(component.setImageUrl(undefined, RefType.Logo)).toBeUndefined()
      })

      it('call without external URLs', () => {
        component.changeMode = 'EDIT'
        component.themeName = validTheme.name
        const theme: Theme = { ...validTheme, logoUrl: undefined, smallLogoUrl: undefined, faviconUrl: undefined }
        themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
        themeApiSpy.updateTheme.and.returnValue(of({}) as any)

        component.ngOnInit()

        expect(component.imageUrl[RefType.Logo]).toBe('basePath/images/themeName/logo')
        expect(component.imageUrlExists[RefType.Logo]).toBeFalse()
      })
    })

    describe('Loading image', () => {
      it('should set URL to undefined if the loading of external URL failed', () => {
        component.changeMode = 'EDIT'
        component.themeName = validTheme.name
        themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
        themeApiSpy.updateTheme.and.returnValue(of({}) as any)

        component.ngOnInit()

        expect(component.imageUrl[RefType.Logo]).toBe(validTheme.logoUrl)
        expect(component.imageUrlExists[RefType.Logo]).toBeTrue()

        component.onImageLoadResult(false, RefType.Logo) // failed loading

        expect(component.imageUrl[RefType.Logo]).toBeUndefined()
        expect(component.headerImageUrl).toBeUndefined()
      })

      it('should let image URL untouched if the load was successful', () => {
        component.changeMode = 'EDIT'
        component.themeName = validTheme.name
        themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
        themeApiSpy.updateTheme.and.returnValue(of({}) as any)

        component.ngOnInit()

        expect(component.imageUrl[RefType.Logo]).toBe(validTheme.logoUrl)
        expect(component.imageUrlExists[RefType.Logo]).toBeTrue()

        component.onImageLoadResult(true, RefType.Logo) // failed loading

        expect(component.imageUrl[RefType.Logo]).toBe(validTheme.logoUrl)
        expect(component.headerImageUrl).toBe(validTheme.logoUrl)
      })
    })

    describe('onInputChange', () => {
      it('should edit a logo URL on inputChange: valid value', fakeAsync(() => {
        const url = 'https://host.com/logo-url'
        const event = { target: { value: url } } as unknown as Event

        component.onInputChange(event, RefType.Logo)
        tick(1000)

        expect(component.imageUrl[RefType.Logo]).toBe(url)
        expect(component.imageUrlExists[RefType.Logo]).toBeTrue()
      }))

      it('should edit a logo URL on inputChange: invalid value', fakeAsync(() => {
        const url = 'https://host'
        const event = { target: { value: url } } as unknown as Event

        component.onInputChange(event, RefType.Logo)
        tick(1000)

        expect(component.imageUrl[RefType.Logo]).toBeUndefined()
      }))

      it('should switch to upload URL if no URL was entered', fakeAsync(() => {
        const url = ''
        const event = { target: { value: url } } as unknown as Event
        const currentUrl = component.imageUrl[RefType.Logo]

        component.onInputChange(event, RefType.Logo)
        tick(1000)

        expect(component.imageUrl[RefType.Logo]).toBe(currentUrl) // url remains
        expect(component.imageUrlExists[RefType.Logo]).toBeFalse()
      }))
    })

    describe('image loading result', () => {
      it('should load images - failed', () => {
        component.onImageLoadResult(false, RefType.Logo)
        component.onImageLoadResult(false, RefType.LogoSmall)
        component.onImageLoadResult(false, RefType.Favicon)

        expect(component.imageUrl[RefType.Logo]).toBeUndefined()
        expect(component.imageUrl[RefType.LogoSmall]).toBeUndefined()
        expect(component.imageUrl[RefType.Favicon]).toBeUndefined()
      })

      it('should load logo - success', () => {
        component.onImageLoadResult(true, RefType.Logo)
        component.onImageLoadResult(true, RefType.LogoSmall)
        component.onImageLoadResult(true, RefType.Favicon)

        expect(component.imageUrl[RefType.Logo]).toEqual(component.theme?.logoUrl)
        expect(component.imageUrl[RefType.LogoSmall]).toEqual(component.theme?.smallLogoUrl)
        expect(component.imageUrl[RefType.Favicon]).toEqual(component.theme?.faviconUrl)
      })
    })

    describe('remove image or URL', () => {
      describe('URL', () => {
        it('should remove the real logo URL - successful', () => {
          expect(component.imageUrl[RefType.Logo]).toBe(validTheme.logoUrl)
          expect(component.imageUrlExists[RefType.Logo]).toBeTrue()

          component.onRemoveImageUrl(RefType.Logo)
          expect(component.imageUrl[RefType.Logo]).toBe('basePath/images/themeName/logo')

          component.onRemoveImageUrl(RefType.LogoSmall)
          expect(component.imageUrl[RefType.LogoSmall]).toBe('basePath/images/themeName/logo-small')

          component.onRemoveImageUrl(RefType.Favicon)
          expect(component.imageUrl[RefType.Favicon]).toBe('basePath/images/themeName/favicon')
        })
      })

      describe('image', () => {
        beforeEach(() => {
          component.imageUrlExists[RefType.Logo] = false
        })

        it('should delete logo - successful', () => {
          imgServiceSpy.deleteImage.and.returnValue(of({}))

          component.onRemoveImage(RefType.Logo)

          expect(component.imageUrl[RefType.Logo]).toBeUndefined()
        })

        it('should delete favicon - failed', () => {
          const errorResponse = { status: 400, statusText: 'error on uploading' }
          imgServiceSpy.deleteImage.and.returnValue(throwError(() => errorResponse))
          spyOn(console, 'error')

          component.onRemoveImage(RefType.Logo)

          expect(console.error).toHaveBeenCalledWith('deleteImage', errorResponse)
        })
      })
    })

    describe('set image URL', () => {
      it('should get uploaded img URL if no external URLs are defined', () => {
        const theme = { id: 'id', name: 'name', logoUrl: undefined, smallLogoUrl: undefined, faviconUrl: undefined }

        component.setImageUrl(theme, RefType.Logo)
        component.setImageUrl(theme, RefType.LogoSmall)
        component.setImageUrl(theme, RefType.Favicon)

        expect(component.imageUrl[RefType.Logo]).toBe('basePath/images/name/logo')
        expect(component.imageUrl[RefType.LogoSmall]).toBe('basePath/images/name/logo-small')
        expect(component.imageUrl[RefType.Favicon]).toBe('basePath/images/name/favicon')
      })

      it('should get external URLs if exist', () => {
        const theme = { id: 'id', name: 'name', logoUrl: 'lurl', smallLogoUrl: 'surl', faviconUrl: 'furl' }

        component.setImageUrl(theme, RefType.Logo)
        component.setImageUrl(theme, RefType.LogoSmall)
        component.setImageUrl(theme, RefType.Favicon)

        expect(component.imageUrl[RefType.Logo]).toBe('lurl')
        expect(component.imageUrl[RefType.LogoSmall]).toBe('surl')
        expect(component.imageUrl[RefType.Favicon]).toBe('furl')
      })
    })

    describe('file upload', () => {
      describe('checks before', () => {
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

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT.FAILED',
            detailKey: 'IMAGE.CONSTRAINT.SIZE'
          })
        })

        it('should not upload a file without correct extension', () => {
          imgServiceSpy.getImage.and.returnValue(throwError(() => new Error()))
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.Png })
          const file = new File([blob], 'test.wrong', { type: MimeType.Png })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT.FAILED',
            detailKey: 'IMAGE.CONSTRAINT.FILE_TYPE'
          })

          component.onFileUpload(event as any, RefType.Favicon)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT.FAILED',
            detailKey: 'IMAGE.CONSTRAINT.FILE_TYPE.FAVICON'
          })
        })

        it('should display error if there are no files on upload image', () => {
          const event = { target: { files: undefined } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT.FAILED',
            detailKey: 'IMAGE.CONSTRAINT.FILE_MISSING'
          })
        })
      })

      describe('upload', () => {
        it('should upload logo - png success', () => {
          const fileType = MimeType.Png
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: fileType }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: fileType })
          const file = new File([blob], 'test.png', { type: fileType })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)
          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload logo - Jpg success', () => {
          const fileType = MimeType.Jpg
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: fileType }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: fileType })
          const file = new File([blob], 'test.jpg', { type: fileType })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)
          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload logo - Jpeg success', () => {
          const fileType = MimeType.Jpeg
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: fileType }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: fileType })
          const file = new File([blob], 'test.jpeg', { type: fileType })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)
          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload logo - Svgxml success', () => {
          const fileType = MimeType.Svgxml
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: fileType }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: fileType })
          const file = new File([blob], 'test.svg', { type: fileType })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)
          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload logo - default success', () => {
          const fileType = undefined
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: fileType }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: fileType })
          const file = new File([blob], 'test.svg', { type: fileType })
          const event = { target: { files: [file] } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, RefType.Logo)
          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload favicon - ico success', () => {
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

          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload favicon - ico failed', () => {
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
    })
  })
})
