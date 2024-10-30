// In a real application, this would be handled securely on the backend
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export const authenticateAdmin = (credentials: { 
  username: string; 
  password: string 
}): boolean => {
  return (
    credentials.username === ADMIN_CREDENTIALS.username &&
    credentials.password === ADMIN_CREDENTIALS.password
  );
};