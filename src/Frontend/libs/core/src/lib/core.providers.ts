import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../../../interceptors/src/lib/auth.interceptor';
import { errorInterceptor } from '../../../interceptors/src/lib/error.interceptor';

export function provideCoreFeatures(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ]);
}
