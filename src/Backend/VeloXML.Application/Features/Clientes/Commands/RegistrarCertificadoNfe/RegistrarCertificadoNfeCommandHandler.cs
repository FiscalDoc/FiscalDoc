using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using AutoMapper;
using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.RegistrarCertificadoNfe;

public sealed class RegistrarCertificadoNfeCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    IStorageService storage,
    IFocusNfeService focusNfe,
    ISecretProtector secretProtector,
    IMapper mapper) : IRequestHandler<RegistrarCertificadoNfeCommand, Result<ClienteDto>>
{
    private const string BucketName = "certificados";

    public async Task<Result<ClienteDto>> Handle(RegistrarCertificadoNfeCommand request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<ClienteDto>(ResultError.Unauthorized("Você não tem acesso a este cliente."));

        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<ClienteDto>(ResultError.NotFound("Cliente"));

        var certificadoBytes = new MemoryStream();
        await request.Certificado.Content.CopyToAsync(certificadoBytes, ct);
        certificadoBytes.Position = 0;

        DateTime validade;
        try
        {
            using var cert = X509CertificateLoader.LoadPkcs12(certificadoBytes.ToArray(), request.Senha);
            validade = cert.NotAfter.ToUniversalTime();
        }
        catch (CryptographicException)
        {
            return Result.Failure<ClienteDto>(
                ResultError.Validation("Senha", "Não foi possível abrir o certificado — verifique o arquivo e a senha."));
        }

        var bucket = storage.ResolveBucket(BucketName);
        await storage.EnsureBucketExistsAsync(bucket, ct);
        var cnpjLimpo = new string(cliente.Cnpj.Where(char.IsDigit).ToArray());
        var objectKey = $"{cnpjLimpo}/certificado.pfx";
        certificadoBytes.Position = 0;
        await storage.UploadAsync(certificadoBytes, objectKey, bucket, request.Certificado.ContentType, ct);

        cliente.CertificadoA1Key = objectKey;
        cliente.CertificadoA1Senha = secretProtector.Protect(request.Senha);
        cliente.CertificadoA1Validade = validade;
        cliente.FocusNfeAmbiente = request.Ambiente == "producao" ? "producao" : "homologacao";
        cliente.FocusNfeStatus = "PendenteRegistro";
        cliente.FocusNfeErro = null;

        certificadoBytes.Position = 0;
        var registro = await focusNfe.RegistrarEmpresaAsync(cliente, certificadoBytes, request.Senha, ct);
        if (registro.Sucesso)
        {
            cliente.FocusNfeEmpresaId = registro.EmpresaId;
            cliente.FocusNfeStatus = "Registrada";
        }
        else
        {
            cliente.FocusNfeStatus = "ErroRegistro";
            cliente.FocusNfeErro = registro.Erro;
        }

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
