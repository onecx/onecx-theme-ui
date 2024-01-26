import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { FieldsetModule } from 'primeng/fieldset'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'

import { addInitializeModuleGuard, InitializeModuleGuard, PortalCoreModule } from '@onecx/portal-integration-angular'

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
    pathMatch: 'full'
  },
  {
    path: 'new',
    component: ThemeDesignerComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.CREATE',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: ':id',
    component: ThemeDetailComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.DETAIL',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: ':id/edit',
    component: ThemeDesignerComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.EDIT',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: { labeli18n: LabelResolver }
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
    ConfirmDialogModule,
    FieldsetModule,
    FormsModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(addInitializeModuleGuard(routes))],
    SharedModule
  ],
  providers: [ConfirmationService, InitializeModuleGuard],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class ThemeModule {
  constructor() {
    console.info('Theme Module constructor')
  }
}
