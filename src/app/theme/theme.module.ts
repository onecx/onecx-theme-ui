import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'
import { PortalApiConfiguration, providePermissionService } from '@onecx/angular-utils'

import { Configuration } from 'src/app/shared/generated'
import { LabelResolver } from 'src/app/shared/label.resolver'
import { environment } from 'src/environments/environment'

import { ThemeSearchComponent } from './theme-search/theme-search.component'
import { ThemeDetailComponent } from './theme-detail/theme-detail.component'

function apiConfigProvider() {
  return new PortalApiConfiguration(Configuration, environment.apiPrefix)
}

const routes: Routes = [
  {
    path: '',
    component: ThemeSearchComponent,
    pathMatch: 'full'
  },
  {
    path: ':name',
    component: ThemeDetailComponent,
    runGuardsAndResolvers: 'paramsChange',
    data: {
      breadcrumb: 'BREADCRUMBS.DETAIL',
      breadcrumbFn: (data: { labeli18n: string }) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  }
]
@NgModule({
  declarations: [],
  imports: [
    AngularAcceleratorModule,
    CommonModule,
    RouterModule.forChild(routes),
    ThemeSearchComponent,
    ThemeDetailComponent
  ],
  providers: [
    ...providePermissionService(),
    LabelResolver,
    { provide: Configuration, useFactory: apiConfigProvider, deps: [ConfigurationService, AppStateService] }
  ]
})
export class ThemeModule {
  constructor() {
    console.info('Theme Module constructor')
  }
}
