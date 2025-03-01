import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { addInitializeModuleGuard, InitializeModuleGuard } from '@onecx/angular-integration-interface'

import { LabelResolver } from 'src/app/shared/label.resolver'
import { SharedModule } from 'src/app/shared/shared.module'

import { ThemeSearchComponent } from './theme-search/theme-search.component'
import { ThemeImportComponent } from './theme-import/theme-import.component'
import { ThemeDetailComponent } from './theme-detail/theme-detail.component'
import { ThemeInternComponent } from './theme-detail/theme-intern/theme-intern.component'
import { ThemeUseComponent } from './theme-detail/theme-use/theme-use.component'
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
    path: ':name',
    component: ThemeDetailComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.DETAIL',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: ':name/edit',
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
    ThemeInternComponent,
    ThemeUseComponent
  ],
  imports: [
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(addInitializeModuleGuard(routes))],
    SharedModule
  ],
  providers: [InitializeModuleGuard]
})
export class ThemeModule {
  constructor() {
    console.info('Theme Module constructor')
  }
}
