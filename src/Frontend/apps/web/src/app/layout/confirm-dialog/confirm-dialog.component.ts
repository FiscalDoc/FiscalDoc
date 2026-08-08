import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '@veloxml/services';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (svc.state(); as s) {
      <div class="overlay" (click)="svc.resolver(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          @if (s.titulo) { <h3 class="modal-title font-heading">{{ s.titulo }}</h3> }
          <p class="modal-msg">{{ s.mensagem }}</p>
          <div class="modal-actions">
            <button class="btn-ghost" (click)="svc.resolver(false)">{{ s.cancelLabel }}</button>
            <button [class]="s.destrutivo ? 'btn-danger' : 'btn-primary'" (click)="svc.resolver(true)">{{ s.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius, 10px); width: 100%; max-width: 380px; padding: 1.25rem 1.4rem; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
    .modal-title { margin: 0 0 .5rem; font-size: 1rem; }
    .modal-msg { margin: 0 0 1.25rem; font-size: 13.5px; color: var(--text2); line-height: 1.55; }
    .modal-actions { display: flex; justify-content: flex-end; gap: .6rem; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .btn-ghost:hover { color: var(--text); }
    .btn-primary { background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.1rem; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-danger { background: var(--red, #ff4d6d); color: #fff; border: none; border-radius: 8px; padding: .5rem 1.1rem; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover, .btn-danger:hover { opacity: .9; }
  `],
})
export class ConfirmDialogComponent {
  readonly svc = inject(ConfirmDialogService);
}
