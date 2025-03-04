import { APP_INITIALIZER, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { RouterModule, Routes, Router } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateLoader, TranslateModule, MissingTranslationHandler } from '@ngx-translate/core'

import { KeycloakAuthModule } from '@onecx/keycloak-auth'
import { createTranslateLoader, TRANSLATION_PATH, translationPathFactory } from '@onecx/angular-utils'
import { APP_CONFIG, AppStateService } from '@onecx/angular-integration-interface'
import { PortalMissingTranslationHandler, PortalCoreModule } from '@onecx/portal-integration-angular'

import { environment } from 'src/environments/environment'
import { AppComponent } from './app.component'
import { initializeRouter } from '@onecx/angular-webcomponents'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./theme/theme.module').then((m) => m.ThemeModule)
  }
]

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    KeycloakAuthModule,
    PortalCoreModule.forRoot('onecx-theme-ui'),
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking', enableTracing: true }),
    TranslateModule.forRoot({
      isolate: true,
      loader: { provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient] },
      missingTranslationHandler: { provide: MissingTranslationHandler, useClass: PortalMissingTranslationHandler }
    })
  ],
  providers: [
    { provide: APP_CONFIG, useValue: environment },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRouter,
      multi: true,
      deps: [Router, AppStateService]
    },
    {
      provide: TRANSLATION_PATH,
      useFactory: (appStateService: AppStateService) => translationPathFactory('assets/i18n/')(appStateService),
      multi: true,
      deps: [AppStateService]
    },
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule {
  constructor() {
    console.info('OneCX Theme Module constructor')
  }
}
