const supabase = require('../lib/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetEmail } = require('../services/mail.service');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const { error: createError } = await supabase
      .from('User')
      .insert({
        name,
        email,
        password: hashedPassword,
        verifyToken,
      });

    if (createError) {
      console.error('Error creando usuario:', createError);
      return res.status(500).json({ message: 'Error en el servidor', error: createError.message });
    }

    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token requerido' });
    }

    const { data: users, error: findError } = await supabase
      .from('User')
      .select('id')
      .eq('verifyToken', token)
      .limit(1);

    const user = users?.[0];
    if (!user) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    const { error: updateError } = await supabase
      .from('User')
      .update({ verified: true, verifyToken: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    res.json({ message: 'Correo verificado exitosamente' });
  } catch (error) {
    console.error('Error en verifyEmail:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const { data: users } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .limit(1);

    const user = users?.[0];
    if (!user) {
      return res.status(401).json({ message: 'Credenciales no válidas' });
    }

    if (!user.verified && user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ message: 'Debes verificar tu correo primero' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales no válidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        businessId: user.businessId || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    let businessType = null;
    if (user.businessId) {
      const { data: businesses } = await supabase
        .from('Business')
        .select('type')
        .eq('id', user.businessId)
        .limit(1);
      businessType = businesses?.[0]?.type || null;
    }

    res.json({
      token,
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      businessId: user.businessId || null,
      businessType,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { data: users } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .limit(1);

    const user = users?.[0];
    if (!user) {
      return res.json({ message: 'Si el correo existe recibirás un enlace' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('User')
      .update({ resetToken, resetExpires: resetExpires.toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando reset token:', updateError);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    await sendResetEmail(email, resetToken);
    res.json({ message: 'Si el correo existe recibirás un enlace' });
  } catch (err) {
    console.error('Error en forgotPassword:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const now = new Date();
    const { data: users } = await supabase
      .from('User')
      .select('id, resetExpires')
      .eq('resetToken', token)
      .limit(1);

    const user = users?.[0];
    if (!user || new Date(user.resetExpires) < now) {
      return res.status(400).json({ message: 'El enlace expiró o es inválido' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
      .from('User')
      .update({ password: hashed, resetToken: null, resetExpires: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en resetPassword:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const { data: users } = await supabase
      .from('User')
      .select('*')
      .eq('id', req.user.id)
      .limit(1);

    const user = users?.[0];
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrent) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('User')
      .update({ password: hashed })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en changePassword:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, changePassword };
