import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { providePermissionService } from '@onecx/angular-utils'

import { LabelResolver } from 'src/app/shared/label.resolver'

import { ThemeSearchComponent } from './theme-search/theme-search.component'
import { ThemeDetailComponent } from './theme-detail/theme-detail.component'

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
  imports: [ThemeSearchComponent, ThemeDetailComponent, RouterModule.forChild(routes)],
  providers: [...providePermissionService(), LabelResolver]
})
export class ThemeModule {
  constructor() {
    console.info('Theme Module constructor')
  }
}
