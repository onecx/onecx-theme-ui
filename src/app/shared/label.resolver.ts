import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, map } from 'rxjs'

// dont use `providedIn root` - wont work when we are in shell
export const labelResolver: ResolveFn<string> = (route: ActivatedRouteSnapshot): string | Observable<string> => {
  const translate = inject(TranslateService)
  return route.data['breadcrumb']
    ? translate.get(route.data['breadcrumb']).pipe(map((t) => t.toString()))
    : (route.routeConfig?.path ?? '')
}
