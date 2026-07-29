using MediatR;
using VeloXML.Application.Common.DTOs;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.UploadBlogImagem;

public record UploadBlogImagemCommand(FileUploadDto Arquivo) : IRequest<Result<UploadBlogImagemResultDto>>;

public record UploadBlogImagemResultDto(string Key, string Url);
