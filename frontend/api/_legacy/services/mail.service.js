const https = require('https');

const sendEmail = (to, subject, htmlContent) => new Promise((resolve, reject) => {
  const body = JSON.stringify({
    sender: { name: 'ReserFlex', email: process.env.BREVO_SENDER_EMAIL || 'marco2002rios@gmail.com' },
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
      if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
      else reject(new Error(`Brevo error ${res.statusCode}: ${data}`));
    });
  });

  req.on('error', reject);
  req.write(body);
  req.end();
});

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;
  await sendEmail(to, 'Verifica tu cuenta en ReserFlex', `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Bienvenido a ReserFlex</h2>
      <p>Gracias por registrarte. Haz clic para verificar tu cuenta:</p>
      <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verificar mi cuenta</a>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este correo, puedes ignorarlo.</p>
    </div>
  `);
};

const sendCredentialsEmail = async (to, password) => {
  await sendEmail(to, 'Credenciales de acceso — ReserFlex', `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Tu cuenta ha sido creada</h2>
      <p>Ya puedes acceder al panel de administración.</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Correo:</strong> ${to}</p>
        <p><strong>Contraseña temporal:</strong> ${password}</p>
      </div>
      <p style="color: #dc2626;">Cambia tu contraseña al iniciar sesión.</p>
    </div>
  `);
};

const sendResetEmail = async (to, token) => {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail(to, 'Restablece tu contraseña — ReserFlex', `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Restablecer contraseña</h2>
      <p>Haz clic para crear una nueva contraseña (expira en 60 min).</p>
      <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Restablecer contraseña</a>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste esto, ignora el correo.</p>
    </div>
  `);
};

const sendConfirmationEmail = async (to, reservation, accessCode = null) => {
  const fecha = new Date(reservation.startTime).toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guayaquil' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">¡Reserva confirmada!</h2>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Negocio:</strong> ${reservation.business?.name || ''}</p>
        <p><strong>Servicio:</strong> ${reservation.service?.name || ''}</p>
        <p><strong>Fecha y hora:</strong> ${fecha}</p>
        ${reservation.employee ? `<p><strong>Empleado:</strong> ${reservation.employee.name}</p>` : ''}
        ${accessCode ? `<p><strong>Código de acceso:</strong> ${accessCode}</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/mis-reservas" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Ver mis reservas</a>
    </div>
  `;

  try {
    await sendEmail(to, '¡Tu reserva está confirmada! — ReserFlex', html);
    console.log(`Correo de confirmación enviado a ${to}`);
  } catch (err) {
    console.error('Error enviando confirmación:', err.message);
    throw new Error('No se pudo enviar la confirmación');
  }
};

const sendTableConfirmationEmail = async (to, reservation, accessCode = null) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">¡Reserva de mesa confirmada!</h2>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Negocio:</strong> ${reservation.business?.name || ''}</p>
        <p><strong>Mesa:</strong> ${reservation.table?.number ? `Mesa ${reservation.table.number}` : ''}</p>
        <p><strong>Fecha:</strong> ${reservation.date || ''}</p>
        <p><strong>Hora:</strong> ${reservation.time || ''}</p>
        <p><strong>Personas:</strong> ${reservation.guests || ''}</p>
        ${reservation.occasion ? `<p><strong>Ocasión:</strong> ${reservation.occasion}</p>` : ''}
        ${accessCode ? `<p><strong>Código de acceso:</strong> ${accessCode}</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/mis-reservas" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Ver mis reservas</a>
    </div>
  `;

  try {
    await sendEmail(to, '¡Tu reserva de mesa está confirmada! — ReserFlex', html);
    console.log(`Correo de confirmación de mesa enviado a ${to}`);
  } catch (err) {
    console.error('Error enviando confirmación de mesa:', err.message);
    throw new Error('No se pudo enviar la confirmación de mesa');
  }
};

module.exports = { sendVerificationEmail, sendCredentialsEmail, sendResetEmail, sendConfirmationEmail, sendTableConfirmationEmail };
