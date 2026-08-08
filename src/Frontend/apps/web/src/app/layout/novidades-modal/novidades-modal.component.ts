import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '@veloxml/services';
import { TOUR_KEY } from '../onboarding-tour/onboarding-tour.component';
import { environment } from '../../../environments/environment';

interface Novidade {
  titulo: string;
  descricao: string;
}

// Toda funcionalidade nova entregue no app deve ganhar uma entrada aqui (mais recente primeiro
// ou por ordem de entrega) — é o que faz o modal reaparecer sozinho pros usuários, sem
// depender da versão de build (ver comentário em VISTA_KEY acima).
const NOVIDADES: Novidade[] = [
  {
    titulo: 'Webhook de NF-e para a transportadora',
    descricao: 'Cadastre uma URL na transportadora e o XML da nota fiscal é enviado automaticamente pra ela assim que a NF-e é autorizada.',
  },
  {
    titulo: 'E-mail automático da NF-e para o destinatário',
    descricao: 'Configure no cadastro do cliente se o e-mail deve sair quando o pedido é emitido ou só quando a NF-e é autorizada de fato — com XML e DANFE em anexo.',
  },
  {
    titulo: 'Histórico de envios com reenvio manual',
    descricao: 'Toda tentativa de webhook ou e-mail agora fica registrada no histórico do pedido. Em caso de falha, um link mostra o motivo e um botão permite tentar novamente sem sair da tela.',
  },
  {
    titulo: 'Nome da empresa e CNPJ no menu lateral',
    descricao: 'O rodapé do menu agora mostra a empresa e o CNPJ da sessão atual, além da versão do sistema.',
  },
  {
    titulo: 'Navegação por teclado nos campos de busca',
    descricao: 'Destinatário, transportadora e produto agora aceitam setas e Enter pra navegar e selecionar sem tirar a mão do teclado.',
  },
  {
    titulo: 'Aviso de cadastro fiscal incompleto',
    descricao: 'Produtos sem NCM ou CFOP cadastrados aparecem com um aviso na busca, antes de virarem erro na hora de emitir a NF-e.',
  },
  {
    titulo: '"Aplicar a todos os itens"',
    descricao: 'Ao preencher CFOP, CST e demais dados fiscais de um item do pedido, um botão permite copiar tudo pros outros itens de uma vez.',
  },
  {
    titulo: 'Campos de destinatário, transportadora e produto como link',
    descricao: 'A própria descrição do campo agora é o link de edição — sem mais um botão avulso ao lado.',
  },
];

@Component({
  selector: 'app-novidades-modal',
  standalone: true,
  template: `
    @if (visivel()) {
      <div class="overlay" (click)="fechar()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h3 class="modal-title font-heading">Novidades do FiscalDoc</h3>
              <span class="modal-versao">{{ versao }}</span>
            </div>
            <button class="modal-close" (click)="fechar()">✕</button>
          </header>
          <div class="modal-body">
            @for (n of novidades; track n.titulo) {
              <div class="novidade-item">
                <p class="novidade-titulo">{{ n.titulo }}</p>
                <p class="novidade-descricao">{{ n.descricao }}</p>
              </div>
            }
          </div>
          <footer class="modal-footer">
            <button class="btn-primary" (click)="fechar()">Entendi</button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 520px; max-height: 85vh; display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1.05rem; }
    .modal-versao { font-size: 11px; color: var(--accent); font-weight: 700; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.25rem 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .novidade-item { padding-left: .75rem; border-left: 2px solid var(--accent-dim, oklch(0.62 0.17 254 / 0.3)); }
    .novidade-titulo { margin: 0 0 2px; font-size: 13.5px; font-weight: 700; color: var(--text); }
    .novidade-descricao { margin: 0; font-size: 12.5px; color: var(--text2); line-height: 1.5; }
    .modal-footer { padding: 1rem 1.5rem 1.25rem; display: flex; justify-content: flex-end; border-top: 1px solid var(--border); }
    .btn-primary { background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .55rem 1.25rem; font-size: 13.5px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { opacity: .9; }
  `],
})
export class NovidadesModalComponent implements OnInit {
  private readonly _auth = inject(AuthService);

  readonly novidades = NOVIDADES;
  readonly versao = environment.appVersion;
  readonly visivel = signal(false);

  // Aparece sozinho toda vez que o usuário efetua login de verdade (não em F5/refresh de
  // sessão) — fora isso, fica disponível a qualquer momento pelo sininho de novidades no
  // rodapé do menu, via abrir(). Exceção: se o tour guiado de onboarding ainda vai aparecer
  // pra esse login (cliente novo), não empilha os dois modais ao mesmo tempo — o tour vem
  // primeiro, as novidades ficam disponíveis no sininho pra depois.
  ngOnInit(): void {
    const loginRecente = this._auth.consumirLoginRecente();
    const tourPendente = this._auth.currentUser()?.perfil === 'Cliente' && !localStorage.getItem(TOUR_KEY);
    if (loginRecente && !tourPendente) this.visivel.set(true);
  }

  abrir(): void {
    this.visivel.set(true);
  }

  fechar(): void {
    this.visivel.set(false);
  }
}
