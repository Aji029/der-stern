interface ValidationErrors {
  [key: string]: string;
}

export const validateSignupForm = (data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  phone: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Name validation
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }

  // Company name validation
  if (!data.companyName.trim()) {
    errors.companyName = 'Company name is required';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  if (!data.phone) {
    errors.phone = 'Phone number is required';
  } else if (!phoneRegex.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    errors.password =
      'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};