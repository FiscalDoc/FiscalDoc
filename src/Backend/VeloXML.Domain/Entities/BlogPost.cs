using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class BlogPost : BaseEntity
{
    public string Titulo { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Resumo { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public string? ImagemCapaKey { get; set; }
    public Guid? CategoriaId { get; set; }
    public BlogCategoria? Categoria { get; set; }
    public List<string> Tags { get; set; } = [];
    public string Autor { get; set; } = string.Empty;
    public DateTime? DataPublicacao { get; set; }
    public string Status { get; set; } = "Rascunho";
    public int Visualizacoes { get; set; }
    public string? MetaTitulo { get; set; }
    public string? MetaDescricao { get; set; }
}
