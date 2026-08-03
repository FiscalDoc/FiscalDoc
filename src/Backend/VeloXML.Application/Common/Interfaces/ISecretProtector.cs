namespace VeloXML.Application.Common.Interfaces;

// Criptografia em repouso pra segredos que a aplicação precisa ler de volta (diferente de
// BCrypt, que só serve pra hash unidirecional de senha de login). Hoje usado só pra
// Cliente.CertificadoA1Senha — não existe outro precedente de "secret em repouso" nesse
// código (IMAP/SMTP são gravados em texto puro), mas a senha de um certificado digital é um
// dado sensível o suficiente pra justificar o esforço extra.
public interface ISecretProtector
{
    string Protect(string plainText);
    string Unprotect(string protectedText);
}
