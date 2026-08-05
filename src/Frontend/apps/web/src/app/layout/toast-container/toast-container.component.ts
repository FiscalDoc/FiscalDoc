import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@veloxml/services';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="toast" [class]="'toast--' + t.tipo" (click)="toastSvc.dismiss(t.id)">
          <span class="toast-icon">
            @switch (t.tipo) {
              @case ('sucesso') {
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              }
              @case ('erro') {
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="9"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              }
              @default {
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="9"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8h.01M11 12h1v4h1"/>
                </svg>
              }
            }
          </span>
          <span class="toast-msg">{{ t.mensagem }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      z-index: 1000; display: flex; flex-direction: column; gap: 8px;
      pointer-events: none; align-items: center; width: 100%; max-width: 480px; padding: 0 1rem;
      box-sizing: border-box;
    }
    .toast {
      pointer-events: auto; cursor: pointer;
      display: flex; align-items: center; gap: 10px;
      background: var(--bg2, #14161d); border: 1px solid var(--border, #262a35);
      border-radius: 10px; padding: .75rem 1rem; font-size: 13.5px; color: var(--text, #e8eaf0);
      box-shadow: 0 8px 24px rgba(0,0,0,.35);
      animation: toast-in 180ms ease-out;
      width: 100%; box-sizing: border-box;
    }
    .toast--sucesso { border-color: rgba(0,229,160,.4); }
    .toast--sucesso .toast-icon { color: var(--accent, #00e5a0); }
    .toast--erro { border-color: rgba(255,77,109,.4); }
    .toast--erro .toast-icon { color: var(--red, #ff4d6d); }
    .toast--info .toast-icon { color: var(--text2, #7c8299); }
    .toast-icon { flex-shrink: 0; display: flex; }
    .toast-msg { flex: 1; line-height: 1.4; }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastSvc = inject(ToastService);
}
