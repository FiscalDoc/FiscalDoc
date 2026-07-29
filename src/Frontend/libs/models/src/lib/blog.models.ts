export type BlogStatus = 'Rascunho' | 'Publicado';

export interface BlogCategoriaDto {
  id: string;
  nome: string;
  slug: string;
}

export interface BlogPostResumoDto {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  imagemUrl?: string;
  autor: string;
  dataPublicacao?: string;
  categoriaNome?: string;
}

export interface BlogPostDto {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagemUrl?: string;
  categoriaId?: string;
  categoriaNome?: string;
  tags: string[];
  autor: string;
  dataPublicacao?: string;
  status: BlogStatus;
  visualizacoes: number;
  metaTitulo?: string;
  metaDescricao?: string;
  criadoEm: string;
}

export interface BlogPostRequest {
  titulo: string;
  slug?: string;
  resumo: string;
  conteudo: string;
  imagemCapaKey?: string;
  categoriaId?: string;
  tags: string[];
  autor: string;
  dataPublicacao?: string;
  status: BlogStatus;
  metaTitulo?: string;
  metaDescricao?: string;
}

export interface BlogCategoriaRequest {
  nome: string;
  slug?: string;
}

export interface UploadBlogImagemResult {
  key: string;
  url: string;
}
