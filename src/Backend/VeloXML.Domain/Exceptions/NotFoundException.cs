namespace VeloXML.Domain.Exceptions;

public class NotFoundException : DomainException
{
    public NotFoundException(string resource, object id)
        : base($"{resource.ToUpper()}_NOT_FOUND", $"{resource} com id '{id}' não encontrado.")
    { }
}
