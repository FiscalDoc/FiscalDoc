namespace VeloXML.Domain.Exceptions;

public class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message = "Acesso não autorizado.")
        : base("UNAUTHORIZED", message)
    { }
}
