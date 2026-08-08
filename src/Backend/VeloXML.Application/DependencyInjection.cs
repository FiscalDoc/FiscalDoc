using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using VeloXML.Application.Common.Behaviors;
using VeloXML.Application.Common.Mappings;
using VeloXML.Application.Features.Pedidos.Common;

namespace VeloXML.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddAutoMapper(typeof(MappingProfile).Assembly);
        services.AddScoped<NfeEmissaoFinalizer>();
        services.AddScoped<PedidoNotificationDispatcher>();

        return services;
    }
}
