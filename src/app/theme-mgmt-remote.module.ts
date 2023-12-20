import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule, MissingTranslationHandler, TranslateLoader } from '@ngx-translate/core'
import {
  MyMissingTranslationHandler,
  PortalMessageService,
  PortalDialogService,
  MFE_INFO,
  createTranslateLoader,
  PortalCoreModule
} from '@onecx/portal-integration-angular'
import { MessageService } from 'primeng/api'
import { DialogService } from 'primeng/dynamicdialog'
import { BASE_PATH } from './generated'
import { CanActivateGuard } from './shared/can-active-guard.service'
import { LabelResolver } from './shared/label.resolver'
import { basePathProvider, SharedModule } from './shared/shared.module'
import { ThemeDesignerComponent } from './theme/theme-designer/theme-designer.component'
import { ThemeDetailComponent } from './theme/theme-detail/theme-detail.component'
import { ThemeSearchComponent } from './theme/theme-search/theme-search.component'
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
  imports: [
    CommonModule,
    SharedModule,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(routes),
    TranslateModule.forChild({
      isolate: true,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, MFE_INFO]
      }
    })
  ],
  exports: [],
  //this is not elegant, for some reason the injection token from primeng does not work across federated module
  providers: [
    LabelResolver,
    { provide: MessageService, useExisting: PortalMessageService },
    { provide: DialogService, useClass: PortalDialogService },

    CanActivateGuard,
    {
      provide: BASE_PATH,
      useFactory: basePathProvider,
      deps: [MFE_INFO]
    }
  ]
})
export class ThemeMgmtModule {}
