namespace VeloXML.SharedKernel;

public interface ICurrentTenant
{
    Guid? TenantId { get; }
    bool HasTenant => TenantId.HasValue;
}
