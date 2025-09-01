import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideCharts, ThemeService, withDefaultRegisterables } from 'ng2-charts';
import { provideAnimations }      from '@angular/platform-browser/animations';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { LucideAngularModule, LucideIconProvider, Moon, Sun } from 'lucide-angular';

//import {traslate}


export function httpLoaderFactory(http: HttpClient) {
  console.log('[i18n] HttpLoaderFactory init'); // ← debe verse una sola vez al arrancar
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptors([tokenInterceptor, errorInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({ Sun, Moon }),),
    provideAnimations(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory, //
          deps: [HttpClient],
          /* useFactory: () => {
            return {
              getTranslation: (lang: string) => import(`./assets/i18n/${lang}.json`)
            };
          }*/
        },
      })
    ), provideCharts(withDefaultRegisterables()), provideCharts(withDefaultRegisterables()),
  ],
};
