import { APP_INITIALIZER, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { DialogService } from 'primeng/dynamicdialog'

import { APP_CONFIG, PortalCoreModule, TranslateCombinedLoader } from '@onecx/portal-integration-angular'
import { KeycloakAuthModule } from '@onecx/keycloak-auth'
import { AppComponent } from './app.component'
import { environment } from '../environments/environment'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { Observable } from 'rxjs'

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateCombinedLoader(
    new TranslateHttpLoader(http, `./assets/i18n/`, '.json'),
    new TranslateHttpLoader(http, `./onecx-portal-lib/assets/i18n/`, '.json')
  )
}

function initializer(translate: TranslateService): () => Observable<any> {
  return () => {
    translate.addLangs(['en', 'de'])
    const browserLang = translate.getBrowserLang()
    return translate.use(browserLang?.match(/en|de/) ? browserLang : 'en')
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    KeycloakAuthModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      [
        { path: '', pathMatch: 'full', redirectTo: '/theme' },
        {
          path: 'theme',
          loadChildren: () => import('./theme/theme.module').then((m) => m.ThemeModule),
          data: {
            breadcrumb: 'Theme Mgmt'
          }
        }
      ],
      { initialNavigation: 'enabledBlocking', enableTracing: true }
    ),
    PortalCoreModule.forRoot('theme-mgmt'),
    TranslateModule.forRoot({
      isolate: true
    })
  ],
  providers: [
    {
      provide: APP_CONFIG,
      useValue: environment
    },
    DialogService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
      deps: [TranslateService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
