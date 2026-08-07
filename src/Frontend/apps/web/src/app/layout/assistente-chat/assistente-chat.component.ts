import { Component, ElementRef, ViewChild, AfterViewChecked, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistenteService, AuthService, extractErrorMessage } from '@veloxml/services';
import { ChatMensagemInput } from '@veloxml/models';

interface ChatMsg {
  papel: 'user' | 'assistant';
  texto: string;
}

@Component({
  selector: 'app-assistente-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (aberto()) {
      <div class="chat-panel">
        <div class="chat-header">
          <div class="chat-header-title">
            <span class="chat-header-dot"></span>
            Assistente FiscalDoc
          </div>
          <button type="button" class="chat-close" (click)="aberto.set(false)" aria-label="Fechar">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="chat-body" #chatBody>
          @if (mensagens().length === 0) {
            <div class="chat-empty">
              <p>Oi! Eu ajudo você a entender o que falta pra emitir uma nota fiscal, ou explico termos fiscais (CST, CFOP, NCM, IBS/CBS).</p>
              <p class="chat-empty-sub">Eu só oriento — não emito nem altero nada por conta própria.</p>
            </div>
          }
          @for (m of mensagens(); track $index) {
            <div class="chat-msg" [class.user]="m.papel === 'user'">
              <div class="chat-bubble">{{ m.texto }}</div>
            </div>
          }
          @if (enviando()) {
            <div class="chat-msg">
              <div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>
            </div>
          }
          @if (erro()) {
            <div class="chat-error">{{ erro() }}</div>
          }
        </div>

        <form class="chat-input-row" (ngSubmit)="enviar()">
          <input
            class="chat-input"
            [(ngModel)]="texto"
            name="texto"
            placeholder="Digite sua pergunta..."
            autocomplete="off"
            [disabled]="enviando()"
          />
          <button type="submit" class="chat-send" [disabled]="!texto.trim() || enviando()" aria-label="Enviar">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7"/>
            </svg>
          </button>
        </form>
      </div>
    }

    <button type="button" class="chat-fab" (click)="aberto.set(!aberto())" [class.open]="aberto()" aria-label="Assistente FiscalDoc">
      @if (aberto()) {
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      } @else {
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.181 0-2.31-.203-3.343-.573C7.755 20.13 5.8 21 4 21c.688-.982 1.15-2.11 1.335-3.293C3.879 16.339 3 14.27 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      }
    </button>
  `,
  styles: [`
    :host { display: contents; }

    .chat-fab {
      position: fixed; bottom: 20px; right: 20px; z-index: 900;
      width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--accent); color: #0d0f14;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
      transition: transform 150ms, opacity 150ms;
    }
    .chat-fab:hover { transform: scale(1.06); }
    .chat-fab.open { background: var(--bg3); color: var(--text); }

    .chat-panel {
      position: fixed; bottom: 84px; right: 20px; z-index: 899;
      width: min(360px, calc(100vw - 40px)); height: min(480px, calc(100vh - 140px));
      background: var(--bg2); border: 1px solid var(--border); border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.5);
      display: flex; flex-direction: column; overflow: hidden;
    }

    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .chat-header-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--text); }
    .chat-header-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
    .chat-close { background: none; border: none; color: var(--text2); cursor: pointer; padding: 2px; display: flex; }
    .chat-close:hover { color: var(--text); }

    .chat-body { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: .625rem; }
    .chat-empty { color: var(--text2); font-size: 13px; line-height: 1.6; text-align: center; margin: auto 0; padding: 1rem; }
    .chat-empty-sub { margin-top: .5rem; font-size: 11.5px; color: var(--text3); }

    .chat-msg { display: flex; }
    .chat-msg.user { justify-content: flex-end; }
    .chat-bubble {
      max-width: 82%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.5;
      background: var(--bg3); color: var(--text); white-space: pre-wrap; word-break: break-word;
    }
    .chat-msg.user .chat-bubble { background: var(--accent-dim); color: var(--text); border: 1px solid var(--accent); }

    .chat-typing { display: flex; gap: 4px; padding: 12px; }
    .chat-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text2); animation: chat-blink 1.2s infinite ease-in-out; }
    .chat-typing span:nth-child(2) { animation-delay: .2s; }
    .chat-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes chat-blink { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }

    .chat-error {
      font-size: 12.5px; color: var(--red); background: rgba(255,77,109,.1);
      border: 1px solid rgba(255,77,109,.25); border-radius: 8px; padding: 8px 10px;
    }

    .chat-input-row { display: flex; gap: 8px; padding: .75rem; border-top: 1px solid var(--border); flex-shrink: 0; }
    .chat-input {
      flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px;
      padding: 9px 12px; color: var(--text); font-size: 13px; outline: none; font-family: inherit;
    }
    .chat-input:focus { border-color: var(--accent); }
    .chat-send {
      width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; flex-shrink: 0;
      background: var(--accent); color: #0d0f14; display: flex; align-items: center; justify-content: center;
    }
    .chat-send:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 480px) {
      .chat-panel { right: 12px; bottom: 76px; }
      .chat-fab { right: 12px; bottom: 12px; }
    }
  `],
})
export class AssistenteChatComponent implements AfterViewChecked {
  private readonly _svc = inject(AssistenteService);
  private readonly _auth = inject(AuthService);

  @ViewChild('chatBody') private _chatBody?: ElementRef<HTMLDivElement>;
  private _deveRolar = false;

  aberto = signal(false);
  mensagens = signal<ChatMsg[]>([]);
  enviando = signal(false);
  erro = signal<string | null>(null);
  texto = '';

  ngAfterViewChecked(): void {
    if (this._deveRolar && this._chatBody) {
      this._chatBody.nativeElement.scrollTop = this._chatBody.nativeElement.scrollHeight;
      this._deveRolar = false;
    }
  }

  enviar(): void {
    const texto = this.texto.trim();
    if (!texto || this.enviando()) return;

    this.erro.set(null);
    this.mensagens.update(l => [...l, { papel: 'user', texto }]);
    this.texto = '';
    this.enviando.set(true);
    this._deveRolar = true;

    const historico: ChatMensagemInput[] = this.mensagens().map(m => ({ papel: m.papel, texto: m.texto }));
    const clienteId = this._auth.currentUser()?.clienteId;

    this._svc.chat(historico, clienteId).subscribe({
      next: r => {
        this.mensagens.update(l => [...l, { papel: 'assistant', texto: r.resposta }]);
        this.enviando.set(false);
        this._deveRolar = true;
      },
      error: err => {
        this.enviando.set(false);
        this.erro.set(extractErrorMessage(err, 'Não foi possível falar com o assistente agora. Tente de novo em instantes.'));
        this._deveRolar = true;
      },
    });
  }
}
