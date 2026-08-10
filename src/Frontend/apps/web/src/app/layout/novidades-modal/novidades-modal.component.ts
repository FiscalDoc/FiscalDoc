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
    titulo: 'Financeiro: contas a receber',
    descricao: 'Novo módulo Financeiro no menu do cliente — cadastre contas a receber dos seus clientes, dê baixa quando o pagamento entrar, cancele ou exclua, e acompanhe pendente, atrasado e recebido no mês em cards de resumo.',
  },
  {
    titulo: 'Exportar e importar cadastros em XLSX',
    descricao: 'Produtos, Clientes (destinatários) e Transportadoras agora exportam e importam planilhas Excel (.xlsx) — útil pra migrar de outro sistema ou fazer cadastro em massa.',
  },
  {
    titulo: 'Seleção em lote nas listas de cadastro',
    descricao: 'Marque vários produtos, clientes ou transportadoras de uma vez na lista e ative, desative ou exclua em lote, sem precisar entrar em cada cadastro.',
  },
  {
    titulo: 'Botão Duplicar',
    descricao: 'Produto, Cliente e Transportadora agora têm um botão Duplicar no cabeçalho, que cria uma cópia do cadastro (CPF/CNPJ e webhook não são copiados de propósito, por segurança).',
  },
  {
    titulo: 'Anterior / Próximo nos cadastros',
    descricao: 'Produto, Cliente e Transportadora ganharam a mesma navegação de Anterior/Próximo que já existia no Pedido, pra revisar vários cadastros em sequência sem voltar pra lista.',
  },
  {
    titulo: 'Atalho Ctrl+Alt+N para novo cadastro',
    descricao: 'Nas listas de cadastro e em Pedidos, Ctrl+Alt+N abre um novo registro direto, sem precisar clicar em "+ Novo".',
  },
  {
    titulo: 'Exclusão direto na lista',
    descricao: 'Produtos, Clientes, Transportadoras e Usuários agora têm um ícone de excluir direto na lista, sem precisar abrir o cadastro — respeitando as mesmas regras de negócio (ex: produto usado em pedido não pode ser excluído).',
  },
  {
    titulo: 'Botões de ação no topo dos cadastros',
    descricao: 'Salvar, Cancelar e Excluir agora ficam no cabeçalho de todas as telas de cadastro, no mesmo padrão já usado no Pedido/NF-e.',
  },
  {
    titulo: 'Modal de atalhos de teclado (Ctrl+/)',
    descricao: 'Ctrl+/ ou o ícone de "?" no rodapé do menu abrem a lista de atalhos disponíveis no sistema.',
  },
  {
    titulo: 'Atalho Ctrl+S para salvar',
    descricao: 'Nas telas de cadastro e no pedido/NF-e, Ctrl+S (Cmd+S no Mac) salva sem precisar tirar a mão do teclado pra clicar no botão.',
  },
  {
    titulo: 'Menu lateral recolhível',
    descricao: 'Um botão no topo do menu recolhe a barra lateral pra só ícones, ganhando espaço de tela — a escolha fica salva pra próxima vez que você entrar.',
  },
  {
    titulo: 'Lucro estimado no relatório de notas',
    descricao: 'O relatório de Notas Fiscais Emitidas agora mostra o lucro estimado por nota (com base no custo cadastrado em cada Produto), além do valor total já existente.',
  },
  {
    titulo: 'Checklist "pronto pra emitir" no dashboard',
    descricao: 'Um card no dashboard mostra o que falta pra emitir a primeira NF-e — certificado digital, produto com NCM/CFOP e destinatário cadastrado — com atalho pra resolver cada pendência.',
  },
  {
    titulo: 'Aviso de validade do certificado digital',
    descricao: 'Certificado vencido ou perto de vencer agora avisa na tela Empresa e também na tela de emissão do pedido, antes que a SEFAZ rejeite a nota.',
  },
  {
    titulo: 'Busca de NCM e CFOP',
    descricao: 'Os campos de NCM e CFOP agora têm busca por código ou descrição, no cadastro de Produto, nos itens do pedido e no cadastro rápido de produto direto na tela de emissão.',
  },
  {
    titulo: 'Recalcular Impostos na emissão',
    descricao: 'Antes de emitir, um botão mostra o cálculo real de ICMS, IPI, PIS, COFINS, DIFAL e FCP — os mesmos valores que o emissor de NF-e vai usar, não uma estimativa aproximada.',
  },
  {
    titulo: 'Tema claro',
    descricao: 'Um botão no rodapé do menu alterna entre tema escuro e claro — a escolha fica salva no navegador.',
  },
  {
    titulo: 'Correções na tributação (IPI, DIFAL/FCP, CST/CSOSN)',
    descricao: 'Emissão de NF-e passou a calcular e validar corretamente IPI, o diferencial de alíquota (DIFAL/FCP) em vendas interestaduais pra consumidor final, e os códigos de CST/CSOSN antes de tentar emitir.',
  },
  {
    titulo: 'Busca global, confirmação e validação em tempo real',
    descricao: 'Ctrl+K abre uma busca geral no sistema, exclusões agora pedem confirmação numa caixa própria (sem mais pop-up do navegador), e campos como CPF/CNPJ e e-mail avisam erro de formato enquanto você digita.',
  },
  {
    titulo: 'Tour guiado para quem está começando',
    descricao: 'No primeiro acesso, uma seta percorre o menu mostrando onde ficam Emissão, Cadastros e Relatórios — disponível a qualquer momento pelo ícone de alvo no rodapé do menu.',
  },
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
