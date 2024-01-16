import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { FieldsetModule } from 'primeng/fieldset'
import { ConfirmDialogModule } from 'primeng/confirmdialog'

import { MFE_INFO, PortalCoreModule, MyMissingTranslationHandler } from '@onecx/portal-integration-angular'

import { CanActivateGuard } from '../shared/can-active-guard.service'
import { LabelResolver } from '../shared/label.resolver'
import { HttpLoaderFactory, SharedModule } from '../shared/shared.module'

import { ThemeSearchComponent } from './theme-search/theme-search.component'
import { ThemeImportComponent } from './theme-import/theme-import.component'
import { ThemeDetailComponent } from './theme-detail/theme-detail.component'
import { ThemeInternComponent } from './theme-detail/theme-intern/theme-intern.component'
import { ThemeDesignerComponent } from './theme-designer/theme-designer.component'

const routes: Routes = [
  {
    path: '',
    component: ThemeSearchComponent,
    canActivate: [CanActivateGuard],
    pathMatch: 'full'
  },
  {
    path: 'new',
    canActivate: [CanActivateGuard],
    component: ThemeDesignerComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.CREATE',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  },
  {
    path: ':id',
    canActivate: [CanActivateGuard],
    component: ThemeDetailComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.DETAIL',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  },
  {
    path: ':id/edit',
    canActivate: [CanActivateGuard],
    component: ThemeDesignerComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.EDIT',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  }
]
@NgModule({
  declarations: [
    ThemeSearchComponent,
    ThemeDetailComponent,
    ThemeDesignerComponent,
    ThemeImportComponent,
    ThemeInternComponent
  ],
  imports: [
    FormsModule,
    FieldsetModule,
    ConfirmDialogModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(routes)],
    SharedModule,
    TranslateModule.forChild({
      isolate: true,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, MFE_INFO]
      }
    })
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class ThemeModule {
  constructor() {
    console.info('Theme Module constructor')
  }
}
