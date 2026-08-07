export interface ChatMensagemInput {
  papel: 'user' | 'assistant';
  texto: string;
}

export interface ChatResponseDto {
  resposta: string;
}
