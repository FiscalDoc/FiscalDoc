using VeloXML.Application.Features.Contadores.Queries.GetContadores;

namespace VeloXML.Application.Features.Contadores.Commands.CreateContador;

public record CreateContadorResponse(
    ContadorDto Contador,
    string SenhaTemporaria
);
