using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetFocusNfeConfig;

public record GetFocusNfeConfigQuery : IRequest<Result<FocusNfeConfigDto>>;

// Os tokens (homologação/produção) nunca voltam pro frontend — só se já estão configurados ou
// não, mesmo padrão do SmtpConfigDto (senha é write-only). O WebhookSecret é diferente: não é
// uma credencial que a Focus deu pro Admin, é um valor que o próprio FiscalDoc usa pra validar
// a chamada de volta — o Admin precisa poder ver/copiar pra colar no painel da Focus, então
// esse aqui volta em texto puro.
public record FocusNfeConfigDto(
    bool TokenHomologacaoConfigurado,
    bool TokenProducaoConfigurado,
    string? WebhookSecret
);
