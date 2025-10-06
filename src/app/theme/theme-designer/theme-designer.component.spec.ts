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
  description: 'description',
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
    fixture.detectChanges() // triggers ngOnInit()
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
    themeApiSpy.searchThemes.calls.reset()
    themeApiSpy.updateTheme.calls.reset()
    themeApiSpy.createTheme.calls.reset()
    themeServiceSpy.apply.calls.reset()
    // to spy data: refill with neutral data
    themeApiSpy.getThemeById.and.returnValue(of({}) as any)
    themeApiSpy.getThemeByName.and.returnValue(of({}) as any)
    themeApiSpy.searchThemes.and.returnValue(of({}) as any)
    themeApiSpy.createTheme.and.returnValue(of({}) as any)
    themeApiSpy.updateTheme.and.returnValue(of({}) as any)
    imgServiceSpy.deleteImage.and.returnValue(of({}))
    imgServiceSpy.getImage.and.returnValue(of({}))
    imgServiceSpy.uploadImage.and.returnValue(of({}))
  })

  describe('construction', () => {
    it('should initialize component', () => {
      initTestComponent()
      expect(component).toBeTruthy()
    })
  })

  describe('initialization', () => {
    it('should have edit changeMode when a name is present in route', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(validTheme.name)

      initTestComponent()

      expect(component.themeName).toBe(validTheme.name)
      expect(component.changeMode).toBe('EDIT')
    })

    it('should have create changeMode when id not present in route', () => {
      initTestComponent()

      expect(component.themeName).toBeNull()
      expect(component.changeMode).toBe('CREATE')
    })

    it('should populate state and create forms', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(validTheme.name)

      initTestComponent()

      expect(component.themeName).toBe(validTheme.name)
      expect(component.autoApply).toBeFalse()
      expect(Object.keys(component.fontForm.controls).length).toBe(themeVariables.font.length)
      expect(Object.keys(component.generalForm.controls).length).toBe(themeVariables.general.length)
      expect(Object.keys(component.topbarForm.controls).length).toBe(themeVariables.topbar.length)
      expect(Object.keys(component.sidebarForm.controls).length).toBe(themeVariables.sidebar.length)
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

  describe('form', () => {
    beforeEach(() => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(validTheme.name)
      initTestComponent()
    })

    it('should populate form with theme data in edit changeMode', () => {
      component.ngOnInit()
      component['fillForm'](validTheme)

      expect(component.basicForm.controls['name'].value).toBe(validTheme.name)
      expect(component.basicForm.controls['description'].value).toBe(validTheme.description)
      expect(component.basicForm.controls['logoUrl'].value).toBe(validTheme.logoUrl)
      expect(component.basicForm.controls['faviconUrl'].value).toBe(validTheme.faviconUrl)
      expect(component.fontForm.controls['font-family'].value).toBe('myFont')
      expect(component.generalForm.controls['primary-color'].value).toBe('rgb(0,0,0)')
      // expect(component.themeId).toBe('id')

      expect(component.bffUrl[RefType.Logo]).toBe(
        component.bffImageUrl(component.imageBasePath, validTheme.name, RefType.Logo)
      )
      expect(component.bffUrl[RefType.LogoSmall]).toBe(
        component.bffImageUrl(component.imageBasePath, validTheme.name, RefType.LogoSmall)
      )
      expect(component.bffUrl[RefType.Favicon]).toBe(
        component.bffImageUrl(component.imageBasePath, validTheme.name, RefType.Favicon)
      )
    })

    it('should populate forms with default values if not in edit changeMode', () => {
      const documentStyle = getComputedStyle(document.documentElement).getPropertyValue('--font-family')

      component.changeMode = 'CREATE'
      component.ngOnInit()

      expect(component.fontForm.controls['font-family'].value).toBe(documentStyle)
    })

    it('should display error when theme basic form invalid', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)

      component.changeMode = 'EDIT'
      component.ngOnInit()
      component['fillForm'](validTheme)

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

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should display error when theme property form invalid', () => {
      spyOnProperty(component.basicForm, 'valid').and.returnValue(true)
      spyOnProperty(component.propertiesForm, 'invalid').and.returnValue(true)

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })
  })

  describe('save theme', () => {
    beforeEach(() => {
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(validTheme.name)
      initTestComponent()
    })

    it('should update theme base and property data with logo URLs - successful', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.ngOnInit()
      component.theme$.subscribe()

      // updating forms with different data
      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const basicData = {
        displayName: 'new display name',
        description: 'new desc',
        logoUrl: 'https://newhost/path-to-logo'
      }
      component.basicForm.patchValue(basicData)

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
      const theme: Theme = { ...validTheme, logoUrl: undefined, smallLogoUrl: undefined, faviconUrl: undefined }
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
      themeApiSpy.updateTheme.and.returnValue(of({}) as any)

      component.ngOnInit()
      component.theme$.subscribe()
      // check
      expect(component.basicForm.controls['logoUrl'].value).toBeUndefined()

      // updating forms with different data
      component.fontForm.patchValue({ 'font-family': 'updatedFont' })
      component.generalForm.patchValue({ 'primary-color': 'rgb(255,255,255)' })
      const basicData = {
        displayName: 'new display name',
        description: 'new desc'
      }
      component.basicForm.patchValue(basicData)

      expect(component.basicForm.valid).toBeTrue()

      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
      expect(themeApiSpy.updateTheme).toHaveBeenCalledTimes(1)
      const updateArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(updateArgs.updateThemeRequest?.resource.description).toBe(basicData.description)
      expect(updateArgs.updateThemeRequest?.resource.properties).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'updatedFont' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )
    })

    it('should apply changes when updating theme is successful', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)

      component.ngOnInit()
      component.theme$.subscribe()
      component.autoApply = true

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
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      const errorResponse = { error: 'Cannot create', statusText: 'Bad Request', status: 400 }
      themeApiSpy.updateTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()
      component.theme$.subscribe()

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

    it('should display save as new popup on save as click', () => {
      component.displaySaveAsDialog = false

      component.onDisplaySaveAsDialog()

      expect(component.displaySaveAsDialog).toBe(true)
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
    const validTheme2: Theme = {
      id: 'id2',
      name: 'themeName2',
      displayName: 'themeDisplayName2',
      mandatory: false,
      description: 'description2',
      logoUrl: 'https://host/path-to-logo2',
      smallLogoUrl: 'https://host/path-to-small_logo2',
      faviconUrl: 'https://host/path-to-favicon2',
      properties: {
        font: { 'font-family': 'myFont2' },
        general: { 'primary-color': 'rgb(0,0,0)' }
      }
    }
    const themes: Theme[] = [validTheme, validTheme2]

    describe('load themes', () => {
      it('should get themes - success', (done: DoneFn) => {
        themeApiSpy.searchThemes.and.returnValue(of({ totalElements: 2, stream: themes }) as any)

        initTestComponent()

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

        component.themes$?.subscribe((data) => {
          expect(data).toEqual([])
          done()
        })
        expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
      })
    })

    it('should create confirmation dialog for template use', () => {
      themeApiSpy.searchThemes.and.returnValue(of({ totalElements: 2, stream: themes }) as any)
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme }) as any)
      initTestComponent()

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

      component.onSelectThemeTemplate({ value: validTheme2.name }, themes)
      fixture.detectChanges()

      expect(confirmdialog.confirmation).toEqual(
        jasmine.objectContaining({
          header: 'themeTemplateConfirmationHeader',
          message: validTheme2.displayName + ' themeTemplateConfirmationMessage',
          acceptLabel: 'actionsConfirmationYes',
          rejectLabel: 'actionsConfirmationNo'
        })
      )
    })

    it('should reset selected template on confirmation reject', () => {
      themeApiSpy.searchThemes.and.returnValue(of({ totalElements: 2, stream: themes }) as any)
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme2 }) as any)

      initTestComponent()

      // prepare dialog
      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const reject = spyOn(confirmdialog, 'reject').and.callThrough()
      // open dialog
      component.onSelectThemeTemplate({ value: validTheme2.name }, themes)
      fixture.detectChanges()
      spyOn<any>(component, 'useThemeAsTemplate')

      // reject template use
      const cancelBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-reject')
      cancelBtn.click()

      expect(reject).toHaveBeenCalled()
      expect(component['useThemeAsTemplate']).not.toHaveBeenCalled()
    })

    it('should only use template properties on confirmation accept and EDIT mode', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme2 }) as any)
      themeApiSpy.searchThemes.and.returnValue(of({ totalElements: 2, stream: themes }) as any)

      initTestComponent()

      // load theme
      component.changeMode = 'EDIT'
      component.themeName = validTheme.name
      component.ngOnInit()
      component.theme$?.subscribe()

      expect(component.themeId).toBe(validTheme.id)
      expect(component.basicForm.get('displayName')?.value).toBe(validTheme.displayName)

      // change basic data
      const newBasicProperties = {
        displayName: 'new display name',
        mandatory: false,
        description: 'new description',
        logoUrl: 'l',
        smallLogoUrl: 's',
        faviconUrl: 'f'
      }
      component.basicForm.patchValue(newBasicProperties)
      expect(component.basicForm.value).toEqual(newBasicProperties)

      // prepare template selection => to be select theme 2
      const themeResponse = { resource: validTheme2 }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any) //

      // prepare confirmation dialog
      const translationData = {
        'ACTIONS.COPY_OF': 'Copy of ',
        'THEME.TEMPLATE.CONFIRMATION.HEADER': 'themeTemplateConfirmationHeader',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE': '{{ITEM}} themeTemplateConfirmationMessage',
        'ACTIONS.CONFIRMATION.YES': 'actionsConfirmationYes',
        'ACTIONS.CONFIRMATION.NO': 'actionsConfirmationNo'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))
      spyOn<any>(component, 'useThemeAsTemplate')

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const accept = spyOn(confirmdialog, 'accept').and.callThrough()
      // open dialog
      component.onSelectThemeTemplate({ value: validTheme2.name }, themes) // select theme 2
      fixture.detectChanges()

      const acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component['useThemeAsTemplate']).toHaveBeenCalled()

      // check if form has still the value of the initial theme
      /*
      expect(component.basicForm.value).toEqual(newBasicProperties) // check if form has the new values

      expect(component.propertiesForm.value).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': 'Font' }),
          general: jasmine.objectContaining({ 'primary-color': 'rgb(255,255,255)' })
        })
      )*/
    })

    it('should use template complete on confirmation accept and CREATE mode', () => {
      themeApiSpy.getThemeById.and.returnValue(of({ resource: validTheme }) as any)

      initTestComponent()
      expect(component.changeMode).toBe('CREATE')

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

      const themeResponse = { resource: validTheme }
      themeApiSpy.getThemeById.and.returnValue(of(themeResponse) as any)

      const confirmdialog: ConfirmDialog = fixture.debugElement.query(By.css('p-confirmdialog')).componentInstance
      const accept = spyOn(confirmdialog, 'accept').and.callThrough()

      component.onSelectThemeTemplate({ value: validTheme.name }, themes)
      fixture.detectChanges()

      const acceptBtn = fixture.debugElement.nativeElement.querySelector('.p-confirm-dialog-accept')
      acceptBtn.click()

      expect(accept).toHaveBeenCalled()
      expect(component.basicForm.value).toEqual({
        name: 'Copy of ' + validTheme.name,
        mandatory: null,
        displayName: validTheme.displayName,
        description: validTheme.description,
        logoUrl: validTheme.logoUrl,
        smallLogoUrl: validTheme.smallLogoUrl,
        faviconUrl: validTheme.faviconUrl
      })
      expect(component.propertiesForm.value).toEqual(
        jasmine.objectContaining({
          font: jasmine.objectContaining({ 'font-family': validTheme.properties.font['font-family'] }),
          general: jasmine.objectContaining({ 'primary-color': validTheme.properties.general['primary-color'] })
        })
      )
    })
  })

  describe('image', () => {
    describe('setBffImageUrl', () => {
      let bffUrl: string | undefined = '/base-path-to-logo'

      beforeEach(() => {
        initTestComponent()
        bffUrl = component.bffImageUrl(component.imageBasePath, validTheme.name, RefType.Logo)
      })

      it('call with undefined theme', () => {
        expect(component.setBffImageUrl(undefined, RefType.Logo)).toBeUndefined()
      })

      it('call without external URLs', () => {
        component.changeMode = 'EDIT'
        component.themeName = validTheme.name
        const theme: Theme = { ...validTheme, logoUrl: undefined, smallLogoUrl: undefined, faviconUrl: undefined }
        themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

        component.ngOnInit()
        component.theme$.subscribe()

        expect(component.changeMode).toBe('EDIT')
        expect(component.bffUrl[RefType.Logo]).toBe(bffUrl)
      })
    })

    describe('on image loading', () => {
      const extUrl = 'https:///path-to-logo'
      const bffUrl = '/base-path-to-logo'
      beforeEach(() => {
        initTestComponent()
        component.bffUrl[RefType.Logo] = bffUrl
      })

      it('should set header image depending on results', () => {
        component.onImageLoadResult(false, RefType.Logo, extUrl) // failed loading

        expect(component.headerImageUrl).toBeUndefined()

        component.onImageLoadResult(true, RefType.Logo, extUrl) // loaded: ext URL

        expect(component.headerImageUrl).toBe(extUrl)

        component.onImageLoadResult(true, RefType.Logo, '') // loaded: bff image

        expect(component.headerImageUrl).toBe(bffUrl)
      })

      it('should reset bff URL if use of it failed', () => {
        component.onImageLoadResult(false, RefType.Logo) // failed loading

        expect(component.bffUrl[RefType.Logo]).toBeUndefined()
      })
    })

    describe('remove image or URL', () => {
      // create a component and initialize with a theme
      beforeEach(() => {
        initTestComponent()
        component.autoApply = false
        component.changeMode = 'EDIT'
        component.themeName = validTheme.name
        themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
        component.ngOnInit()
        component.theme$.subscribe()
      })

      it('should remove the real logo URL - successful', () => {
        // check current state
        expect(component.basicForm.get('logoUrl')?.value).toBe(validTheme.logoUrl)
        expect(component.basicForm.get('smallLogoUrl')?.value).toBe(validTheme.smallLogoUrl)
        expect(component.basicForm.get('faviconUrl')?.value).toBe(validTheme.faviconUrl)

        // clear external URLs
        component.onRemoveImageUrl(RefType.Logo)
        expect(component.basicForm.get('logoUrl')?.value).toBeNull()

        component.onRemoveImageUrl(RefType.LogoSmall)
        expect(component.basicForm.get('smallLogoUrl')?.value).toBeNull()

        component.onRemoveImageUrl(RefType.Favicon)
        expect(component.basicForm.get('faviconUrl')?.value).toBeNull()
      })

      it('should delete image - successful', () => {
        imgServiceSpy.deleteImage.and.returnValue(of({}))

        component.onRemoveImage(RefType.Logo)
        expect(component.bffUrl[RefType.Logo]).toBeUndefined()
        expect(component.headerImageUrl).toBeUndefined()

        component.headerImageUrl = 'logo-path'

        component.onRemoveImage(RefType.LogoSmall)
        expect(component.bffUrl[RefType.LogoSmall]).toBeUndefined()
        expect(component.headerImageUrl).not.toBeUndefined()

        component.onRemoveImage(RefType.Favicon)
        expect(component.bffUrl[RefType.Favicon]).toBeUndefined()
      })

      it('should delete image - successful', () => {
        const headerUrl = component.headerImageUrl
        const bffUrl = component.bffUrl[RefType.Logo]

        const errorResponse = { error: 'Cannot remove', statusText: 'Bad Request', status: 400 }
        imgServiceSpy.deleteImage.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.onRemoveImage(RefType.Logo)

        expect(component.headerImageUrl).toBe(headerUrl)
        expect(component.bffUrl[RefType.Logo]).toBe(bffUrl)
      })
    })

    describe('file upload', () => {
      beforeEach(() => {
        initTestComponent()
        component.autoApply = false
        component.changeMode = 'EDIT'
        component.themeName = validTheme.name
        themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
        component.ngOnInit()
        component.theme$.subscribe()
      })

      describe('checks before', () => {
        it('should not upload a file if currThemeName is empty', () => {
          const event = { target: { files: ['file'] } }
          component.basicForm.controls['name'].setValue('')

          component.onFileUpload(event as any, RefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT.FAILED',
            detailKey: 'IMAGE.CONSTRAINT.NAME'
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

          component.onFileUpload(event as any, RefType.Favicon)

          expect(console.error).toHaveBeenCalledWith('uploadImage', errorResponse)
        })
      })
    })
  })

  describe('Extra UI actions', () => {
    it('should navigate back on close', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true))

      initTestComponent()

      component['onClose']()

      expect(router.navigate).toHaveBeenCalledOnceWith(['./..'], jasmine.any(Object))
    })

    it('page actions - CREATE mode', (done: DoneFn) => {
      const idBase = 'th_designer_page_action_'
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
        let action = actions.filter((a) => a.id === idBase + 'close')[0]
        spyOn<any>(component, 'onClose')
        action.actionCallback()
        expect(component['onClose']).toHaveBeenCalledTimes(1)

        action = actions.filter((a) => a.id === idBase + 'save')[0]
        spyOn(component, 'onSaveTheme')
        action.actionCallback()
        expect(component.onSaveTheme).toHaveBeenCalledTimes(1)

        action = actions.filter((a) => a.id === idBase + 'save_as')[0]
        spyOn(component, 'onDisplaySaveAsDialog')
        action.actionCallback()
        expect(component.onDisplaySaveAsDialog).toHaveBeenCalledTimes(1)

        done()
      })
    })

    it('page actions - EDIT mode', (done: DoneFn) => {
      const idBase = 'th_designer_page_action_'
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: validTheme }) as any)
      const activatedRoute = TestBed.inject(ActivatedRoute)
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(validTheme.name)

      initTestComponent()
      component.theme$.subscribe()

      // simulate async pipe
      component.actions$?.subscribe((actions) => {
        expect(actions.length).toBe(3)
        let action = actions.filter((a) => a.id === idBase + 'close')[0]
        spyOn<any>(component, 'onClose')
        action.actionCallback()
        expect(component['onClose']).toHaveBeenCalledTimes(1)

        action = actions.filter((a) => a.id === idBase + 'save')[0]
        spyOn(component, 'onSaveTheme')
        action.actionCallback()
        expect(component.onSaveTheme).toHaveBeenCalledTimes(1)

        action = actions.filter((a) => a.id === idBase + 'save_as')[0]
        spyOn(component, 'onDisplaySaveAsDialog')
        action.actionCallback()
        expect(component.onDisplaySaveAsDialog).toHaveBeenCalledTimes(1)

        done()
      })
    })
  })
})
