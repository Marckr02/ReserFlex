const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  await transporter.sendMail({
    from: `"ReserFlex" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Verifica tu cuenta en ReserFlex',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenido a ReserFlex</h2>
        <p>Gracias por registrarte. Para verificar tu cuenta, haz clic en el siguiente enlace:</p>
        <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verificar mi cuenta
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          Si no solicitaste este correo, puedes ignorarlo.
        </p>
      </div>
    `
  });
};

const sendCredentialsEmail = async (to, password) => {
  await transporter.sendMail({
    from: `"ReserFlex" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Credenciales de acceso — ReserFlex',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Tu cuenta de administrador ha sido creada</h2>
        <p>Ya puedes acceder al panel de administración de tu negocio.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Correo:</strong> ${to}</p>
          <p><strong>Contraseña temporal:</strong> ${password}</p>
        </div>
        <p style="color: #dc2626;">Por favor cambia tu contraseña al iniciar sesión.</p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail, sendCredentialsEmail };