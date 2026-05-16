const Brevo = require('@getbrevo/brevo');

const client = Brevo.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const emailApi = new Brevo.TransactionalEmailsApi();

const FROM = { name: 'ReserFlex', email: 'noreply@reservflex.com' };

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  try {
    await emailApi.sendTransacEmail({
      sender: FROM,
      to: [{ email: to }],
      subject: 'Verifica tu cuenta en ReserFlex',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenido a ReserFlex</h2>
          <p>Gracias por registrarte. Haz clic en el botón para verificar tu cuenta:</p>
          <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white;
             padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verificar mi cuenta
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            Si no solicitaste este correo, puedes ignorarlo.
          </p>
        </div>
      `
    });
    console.log(`📧 Correo de verificación enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando verificación:', error.message);
    throw new Error('No se pudo enviar el correo de verificación');
  }
};

const sendCredentialsEmail = async (to, password) => {
  try {
    await emailApi.sendTransacEmail({
      sender: FROM,
      to: [{ email: to }],
      subject: 'Credenciales de acceso — ReserFlex',
      htmlContent: `
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
    console.log(`📧 Credenciales enviadas a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando credenciales:', error.message);
    throw new Error('No se pudo enviar el correo de credenciales');
  }
};

module.exports = { sendVerificationEmail, sendCredentialsEmail };