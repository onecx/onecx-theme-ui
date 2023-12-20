import { CommonModule } from '@angular/common'
import { Inject, NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { MfeInfo, MFE_INFO, PortalCoreModule } from '@onecx/portal-integration-angular'
import { ColorSketchModule } from 'ngx-color/sketch'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'
import { FieldsetModule } from 'primeng/fieldset'

import { CanActivateGuard } from '../shared/can-active-guard.service'
import { LabelResolver } from '../shared/label.resolver'
import { SharedModule } from '../shared/shared.module'
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
    CommonModule,
    SharedModule,
    [RouterModule.forChild(routes)],
    PortalCoreModule.forMicroFrontend(),
    FormsModule,
    ColorSketchModule,
    ConfirmDialogModule,
    FieldsetModule
  ],

  providers: [ConfirmationService]
})
export class ThemeModule {
  constructor(@Inject(MFE_INFO) mfeInfo: MfeInfo) {
    console.log(`Theme Module constructor ${JSON.stringify(mfeInfo)}`)
  }
}
