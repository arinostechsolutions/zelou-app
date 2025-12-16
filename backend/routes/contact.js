const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

/**
 * POST /api/contact
 * Envia mensagem de contato
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, condominium, units, message } = req.body;

    // Validação básica
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Nome, email e mensagem são obrigatórios' 
      });
    }

    // Configurar transporter de email (usando as mesmas credenciais do sistema)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Preparar email
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Zelou'}" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `Nova mensagem de contato - ${name}`,
      html: `
        <h2>Nova mensagem de contato do site Zelou</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
        ${condominium ? `<p><strong>Condomínio:</strong> ${condominium}</p>` : ''}
        ${units ? `<p><strong>Unidades:</strong> ${units}</p>` : ''}
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' 
    });
  }
});

module.exports = router;

