const https = require('https');

const sendEmail = (to, subject, htmlContent) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: { name: 'ReserFlex', email: 'marco2002rios@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Brevo error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  try {
    await sendEmail(to, 'Verifica tu cuenta en ReserFlex', `
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
    `);
    console.log(`📧 Correo de verificación enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando verificación:', error.message);
    throw new Error('No se pudo enviar el correo de verificación');
  }
};

const sendCredentialsEmail = async (to, password) => {
  try {
    await sendEmail(to, 'Credenciales de acceso — ReserFlex', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Tu cuenta de administrador ha sido creada</h2>
        <p>Ya puedes acceder al panel de administración de tu negocio.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Correo:</strong> ${to}</p>
          <p><strong>Contraseña temporal:</strong> ${password}</p>
        </div>
        <p style="color: #dc2626;">Por favor cambia tu contraseña al iniciar sesión.</p>
      </div>
    `);
    console.log(`📧 Credenciales enviadas a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando credenciales:', error.message);
    throw new Error('No se pudo enviar el correo de credenciales');
  }
};

const sendResetEmail = async (to, token) => {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  try {
    await sendEmail(to, 'Restablece tu contraseña — ReserFlex', `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">Restablecer contraseña</h2>
        <p>Haz clic en el botón para crear una nueva contraseña. El enlace expira en 60 minutos.</p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:white;
          padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280;font-size:14px">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `);
    console.log(`📧 Correo de recuperación enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando reset:', error.message);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
};

const sendConfirmationEmail = async (to, reservation, accessCode = null) => {
  const fecha = new Date(reservation.startTime).toLocaleString('es-EC', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guayaquil'
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#2563eb">¡Reserva confirmada!</h2>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
        <p><strong>Negocio:</strong> ${reservation.business?.name || ''}</p>
        <p><strong>Servicio:</strong> ${reservation.service?.name || ''}</p>
        <p><strong>Fecha y hora:</strong> ${fecha}</p>
        ${reservation.employee ? `<p><strong>Empleado:</strong> ${reservation.employee.name}</p>` : ''}
        ${accessCode ? `<p><strong>Código de acceso:</strong> ${accessCode}</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/mis-reservas"
        style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;
        text-decoration:none;border-radius:6px">Ver mis reservas</a>
    </div>
  `;

  try {
    await sendEmail(to, '¡Tu reserva está confirmada! — ReserFlex', html);
    console.log(`📧 Confirmación de reserva enviada a ${to}`);
  } catch (err) {
    console.error('❌ Error enviando confirmación:', err.message);
    throw new Error('No se pudo enviar la confirmación');
  }
};

module.exports = { sendVerificationEmail, sendCredentialsEmail, sendResetEmail, sendConfirmationEmail };