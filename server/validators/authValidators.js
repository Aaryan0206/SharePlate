const validateRegisterInput = (data) => {
  const errors = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Full name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email address is required');
  } else if (!emailRegex.test(data.email.trim())) {
    errors.push('Please enter a valid email address');
  }

  // Password validation
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Role validation: Public registration only allows 'donor' or 'recipient'
  const allowedPublicRoles = ['donor', 'recipient'];
  if (!data.role) {
    errors.push('Account role is required (donor or recipient)');
  } else if (!allowedPublicRoles.includes(data.role)) {
    errors.push(`Invalid role '${data.role}'. Public registration is only available for 'donor' or 'recipient'`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateLoginInput = (data) => {
  const errors = [];

  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
    errors.push('Email address is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};
