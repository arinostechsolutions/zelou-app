const nodemailer = require('nodemailer');

// Configuração do transporter
// Em produção, use um serviço real como SendGrid, AWS SES, etc.
const createTransporter = () => {
  // Se tiver configuração de email no .env
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback para desenvolvimento - usa Ethereal (fake SMTP)
  // Os emails não são enviados de verdade, mas podem ser visualizados
  console.log('⚠️ SMTP não configurado. Usando modo de desenvolvimento (emails não serão enviados).');
  return null;
};

const transporter = createTransporter();

/**
 * Gera um código de 6 dígitos
 */
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Envia email de reset de senha
 */
const sendPasswordResetEmail = async (email, code, userName) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Zelou App" <noreply@zelou.app>',
    to: email,
    subject: '🔐 Código de Recuperação de Senha - Zelou',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Zelou</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Gestão de Condomínio</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 22px;">Olá${userName ? `, ${userName}` : ''}! 👋</h2>
                    <p style="color: #64748b; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar:
                    </p>
                    
                    <!-- Code Box -->
                    <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                      <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Seu código de verificação:</p>
                      <p style="color: #6366F1; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px;">${code}</p>
                    </div>
                    
                    <p style="color: #64748b; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6;">
                      ⏰ Este código expira em <strong>15 minutos</strong>.
                    </p>
                    <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px; line-height: 1.6;">
                      Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} Zelou. Todos os direitos reservados.
                    </p>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; text-align: center;">
                      Este é um email automático, por favor não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      Zelou - Recuperação de Senha
      
      Olá${userName ? `, ${userName}` : ''}!
      
      Recebemos uma solicitação para redefinir a senha da sua conta.
      
      Seu código de verificação: ${code}
      
      Este código expira em 15 minutos.
      
      Se você não solicitou esta alteração, ignore este email.
      
      © ${new Date().getFullYear()} Zelou
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  } else {
    // Modo desenvolvimento - apenas loga o código
    console.log('📧 [DEV] Email de reset para:', email);
    console.log('📧 [DEV] Código:', code);
    return { success: true, dev: true, code };
  }
};

module.exports = {
  generateResetCode,
  sendPasswordResetEmail,
};

