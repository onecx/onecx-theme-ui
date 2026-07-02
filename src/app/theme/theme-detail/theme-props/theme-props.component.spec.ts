import { SimpleChange } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ThemePropsComponent } from './theme-props.component'
import { MimeType, ImagesInternalAPIService, Theme } from 'src/app/shared/generated'
import { of, throwError } from 'rxjs'
import { HttpResponse } from '@angular/common/http'
import { Utils, LogoRefType } from 'src/app/shared/utils'

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

describe('ThemePropsComponent', () => {
  let component: ThemePropsComponent
  let fixture: ComponentFixture<ThemePropsComponent>
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  const imgServiceSpy = {
    getImage: jasmine.createSpy('getImage').and.returnValue(of({})),
    deleteImage: jasmine.createSpy('deleteImage').and.returnValue(of({})),
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(of({})),
    configuration: { basePath: 'basePath' }
  }
  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemePropsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemePropsComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ImagesInternalAPIService, useValue: imgServiceSpy }
      ]
    })
      .overrideComponent(ThemePropsComponent, {
        set: {
          template: '',
          imports: []
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    // to spy data: refill with neutral data
    imgServiceSpy.deleteImage.and.returnValue(of({}))
    imgServiceSpy.getImage.and.returnValue(of({}))
    imgServiceSpy.uploadImage.and.returnValue(of({}))
  })

  it('should create', () => {
    initTestComponent()
    expect(component).toBeTruthy()
  })

  describe('OnChanges', () => {
    it('call without theme', () => {
      component.changeMode = 'VIEW'
      component.theme = undefined
      component.ngOnChanges({ theme: new SimpleChange(undefined, undefined, true) })

      expect(component.basicForm.disabled).toBeTrue()
      expect(component.fontForm.disabled).toBeTrue()
    })
  })

  describe('OnSave', () => {
    it('call without theme', () => {
      component.changeMode = 'EDIT'
      component.theme = undefined
      component.ngOnChanges({ theme: new SimpleChange(undefined, undefined, true) })
      component.onUpdateTheme()

      expect().nothing()
    })

    it('call with theme but invalid basic form', () => {
      component.changeMode = 'EDIT'
      component.theme = { ...validTheme, name: '' } // name is required, so form is invalid
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })

      component.onUpdateTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('call with theme but invalid font form', () => {
      component.changeMode = 'EDIT'
      component.theme = { ...validTheme }
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })
      // manually invalidate the font form
      component.fontForm.controls['font-family'].setErrors({ invalid: true })

      component.onUpdateTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('call with valid theme', () => {
      component.changeMode = 'EDIT'
      component.theme = validTheme
      component.ngOnChanges({ theme: new SimpleChange(undefined, validTheme, true) })
      // a change in the form: change   displayName and font-family
      component.basicForm.controls['displayName'].setValue('new display name')
      component.fontForm.controls['font-family'].setValue('newFont')

      component.onUpdateTheme()
      expect(component.theme.displayName).toBe('new display name')
      //expect(component.fontForm.value['font-family']).toBe(component.theme.properties?.font?.['font-family'])
    })
  })

  describe('image', () => {
    describe('setBffImageUrl', () => {
      let bffUrl: string | undefined = '/base-path-to-logo'

      beforeEach(() => {
        initTestComponent()
        bffUrl = Utils.bffImageUrl(component.imageBasePath, validTheme.name, LogoRefType.Logo)
      })

      it('call with undefined theme', () => {
        expect(component.setBffImageUrl(undefined, LogoRefType.Logo)).toBeUndefined()
      })

      it('call without external URLs', () => {
        const theme: Theme = { ...validTheme, logoUrl: undefined, smallLogoUrl: undefined, faviconUrl: undefined }
        component.changeMode = 'EDIT'
        component.theme = theme
        component.ngOnChanges({ theme: new SimpleChange(undefined, theme, true) })

        expect(component.changeMode).toBe('EDIT')
        expect(component.bffUrl[LogoRefType.Logo]).toBe(bffUrl)
      })
    })

    describe('on image loading', () => {
      const extUrl = 'https:///path-to-logo'
      const bffUrl = '/base-path-to-logo'
      beforeEach(() => {
        initTestComponent()
        component.bffUrl[LogoRefType.Logo] = bffUrl
      })

      it('should emit header image with ext URL on successful load', () => {
        const emitSpy = spyOn(component.headerImageUrl, 'emit')

        component.onImageLoadResult(true, LogoRefType.Logo, extUrl)

        expect(emitSpy).toHaveBeenCalledWith(extUrl)
      })

      it('should emit header image with bff URL when extUrl is empty', () => {
        const emitSpy = spyOn(component.headerImageUrl, 'emit')

        component.onImageLoadResult(true, LogoRefType.Logo, '')

        expect(emitSpy).toHaveBeenCalledWith(bffUrl)
      })

      it('should emit undefined and reset bff URL on failed load without ext URL', () => {
        const emitSpy = spyOn(component.headerImageUrl, 'emit')

        component.onImageLoadResult(false, LogoRefType.Logo)

        expect(emitSpy).toHaveBeenCalledWith(undefined)
        expect(component.bffUrl[LogoRefType.Logo]).toBeUndefined()
      })

      it('should emit undefined on failed load with ext URL but keep bff URL', () => {
        const emitSpy = spyOn(component.headerImageUrl, 'emit')

        component.onImageLoadResult(false, LogoRefType.Logo, extUrl)

        expect(emitSpy).toHaveBeenCalledWith(undefined)
        expect(component.bffUrl[LogoRefType.Logo]).toBe(bffUrl)
      })
    })

    describe('remove image or URL', () => {
      // create a component and initialize with a theme
      beforeEach(() => {
        initTestComponent()
        component.changeMode = 'EDIT'
        component.theme = validTheme
        component.ngOnChanges({ theme: new SimpleChange(undefined, validTheme, true) })
      })

      it('should remove the real logo URL - successful', () => {
        // check current state
        expect(component.basicForm.get('logoUrl')?.value).toBe(validTheme.logoUrl)
        expect(component.basicForm.get('smallLogoUrl')?.value).toBe(validTheme.smallLogoUrl)
        expect(component.basicForm.get('faviconUrl')?.value).toBe(validTheme.faviconUrl)

        // clear external URLs
        component.onRemoveImageUrl(LogoRefType.Logo)
        expect(component.basicForm.get('logoUrl')?.value).toBeNull()

        component.onRemoveImageUrl(LogoRefType.LogoSmall)
        expect(component.basicForm.get('smallLogoUrl')?.value).toBeNull()
      })

      it('should delete image - successful', () => {
        imgServiceSpy.deleteImage.and.returnValue(of({}))
        const emitSpy = spyOn(component.headerImageUrl, 'emit')
        component.bffUrl[LogoRefType.Logo] = 'some-logo-url'
        component.bffUrl[LogoRefType.LogoSmall] = 'some-small-logo-url'
        component.bffUrl[LogoRefType.Favicon] = 'some-favicon-url'

        component.onRemoveImage(LogoRefType.Logo)
        expect(component.bffUrl[LogoRefType.Logo]).toBeUndefined()
        expect(emitSpy).toHaveBeenCalledWith(undefined)

        component.onRemoveImage(LogoRefType.LogoSmall)
        expect(component.bffUrl[LogoRefType.LogoSmall]).toBeUndefined()

        component.onRemoveImage(LogoRefType.Favicon)
        expect(component.bffUrl[LogoRefType.Favicon]).toBeUndefined()
      })

      it('should not change state on delete image error', () => {
        const errorResponse = { error: 'Cannot remove', statusText: 'Bad Request', status: 400 }
        imgServiceSpy.deleteImage.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.bffUrl[LogoRefType.Logo] = 'some-logo-url'

        component.onRemoveImage(LogoRefType.Logo)

        expect(component.bffUrl[LogoRefType.Logo]).toBe('some-logo-url')
        expect(console.error).toHaveBeenCalledWith('deleteImage', errorResponse)
      })
    })

    describe('file upload', () => {
      beforeEach(() => {
        initTestComponent()
        component.changeMode = 'EDIT'
        component.theme = { ...validTheme }
        component.ngOnChanges({ theme: new SimpleChange(undefined, validTheme, true) })
      })

      describe('checks before', () => {
        it('should not upload a file if theme is not set', () => {
          component.theme = undefined
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.Png })
          const file = new File([blob], 'test.png', { type: MimeType.Png })
          const event = { target: { files: [file] } }

          component.onFileUpload(event as any, LogoRefType.Logo)

          expect(imgServiceSpy.uploadImage).not.toHaveBeenCalled()
        })

        it('should not upload a file that is too large', () => {
          const largeBlob = new Blob(['a'.repeat(120000)], { type: MimeType.Png })
          const largeFile = new File([largeBlob], 'test.png', { type: MimeType.Png })
          const event = { target: { files: [largeFile] } }

          component.onFileUpload(event as any, LogoRefType.Logo)

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

          component.onFileUpload(event as any, LogoRefType.Logo)

          expect(msgServiceSpy.error).toHaveBeenCalledWith({
            summaryKey: 'IMAGE.CONSTRAINT.FAILED',
            detailKey: 'IMAGE.CONSTRAINT.FILE_TYPE'
          })
        })

        it('should display error if there are no files on upload image', () => {
          const event = { target: { files: undefined } }
          component.basicForm.controls['name'].setValue('name')

          component.onFileUpload(event as any, LogoRefType.Logo)

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

          component.onFileUpload(event as any, LogoRefType.Logo)

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

          component.onFileUpload(event as any, LogoRefType.Logo)

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

          component.onFileUpload(event as any, LogoRefType.Logo)

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

          component.onFileUpload(event as any, LogoRefType.Logo)

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

          component.onFileUpload(event as any, LogoRefType.Logo)

          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload favicon - png success', () => {
          const mockHttpResponse: HttpResponse<Blob> = new HttpResponse({
            body: new Blob([''], { type: MimeType.Png }),
            status: 200
          })
          imgServiceSpy.getImage.and.returnValue(of(mockHttpResponse))
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.Png })
          const file = new File([blob], 'favicon.png', { type: MimeType.Png })
          const event = { target: { files: [file] } }

          component.onFileUpload(event as any, LogoRefType.Favicon)

          expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD.OK' })
        })

        it('should upload favicon - failed', () => {
          const errorResponse = { status: 400, statusText: 'error on uploading' }
          imgServiceSpy.uploadImage.and.returnValue(throwError(() => errorResponse))
          spyOn(console, 'error')
          const blob = new Blob(['a'.repeat(10)], { type: MimeType.Png })
          const file = new File([blob], 'favicon.png', { type: MimeType.Png })
          const event = { target: { files: [file] } }

          component.onFileUpload(event as any, LogoRefType.Favicon)

          expect(console.error).toHaveBeenCalledWith('uploadImage', errorResponse)
        })
      })
    })
  })
})
