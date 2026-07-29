using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class BlogCategoria : BaseEntity
{
    public string Nome { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<BlogPost> Posts { get; set; } = [];
}
