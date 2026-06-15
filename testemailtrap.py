import os
import mailtrap as mt

MAILTRAP_TOKEN = "bc03f85e8c9c972901c7ebb896d78163"

if not MAILTRAP_TOKEN:
    raise ValueError("Configure a variável de ambiente MAILTRAP_TOKEN")

mail = mt.Mail(
    sender=mt.Address(
        email="contato@lucky-boloes.com",
        name="Lucky Bolões"
    ),
    to=[
        mt.Address(email="vianadeoliveiramarcos98@gmail.com", name="Marcos")
    ],
    subject="Sua participação no bolão de hoje",
    html="""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding:30px 15px;">

                <table width="600" cellpadding="0" cellspacing="0" border="0"
                       style="background:#ffffff;border-radius:10px;padding:40px;">

                    <tr>
                        <td align="center">
                            <h1 style="color:#16a34a;margin:0;">
                                Lucky Bolões 🍀
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding-top:25px;color:#333;font-size:16px;line-height:1.7;">

                            <p>Olá, Marcos!</p>

                            <p>
                                Vi que você acessou a <strong>Lucky Bolões</strong>,
                                mas ainda não finalizou sua participação.
                            </p>

                            <p>
                                O bolão de hoje da <strong>Lotofácil - R$ 2 milhões</strong>
                                ainda possui algumas cotas disponíveis.
                            </p>

                            <p>
                                Cada cota custa apenas
                                <strong style="color:#16a34a;">R$ 2,50</strong>.
                            </p>

                            <p>
                                Se deseja participar, recomendamos garantir sua vaga
                                o quanto antes.
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:30px 0;">

                            <a href="https://www.lucky-boloes.com"
                               style="
                                    background:#16a34a;
                                    color:#ffffff;
                                    text-decoration:none;
                                    padding:15px 35px;
                                    border-radius:8px;
                                    font-size:16px;
                                    font-weight:bold;
                                    display:inline-block;">
                                Participar Agora
                            </a>

                        </td>
                    </tr>

                    <tr>
                        <td style="color:#666;font-size:15px;line-height:1.7;">

                            <p>
                                Caso tenha qualquer dúvida,
                                basta responder este e-mail.
                            </p>

                            <p>
                                Boa sorte! 🍀
                            </p>

                            <p>
                                Atenciosamente,<br>
                                <strong>Equipe Lucky Bolões</strong>
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
""",
    category="Transactional Follow-up",
)

client = mt.MailtrapClient(token=MAILTRAP_TOKEN)
response = client.send(mail)

print(response)