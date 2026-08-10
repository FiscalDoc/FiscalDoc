import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../../../services/src/lib/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges?.()) return true;

  const confirm = inject(ConfirmDialogService);
  return confirm.ask(
    'Esta página tem alterações que ainda não foram salvas. Se você sair agora, elas serão perdidas.',
    { titulo: 'Sair sem salvar?', confirmLabel: 'Sair sem salvar', cancelLabel: 'Continuar editando' },
  );
};
