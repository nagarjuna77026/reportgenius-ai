

import { User, AuthSession } from '../types';

const USERS_KEY = 'rg_users';
const SESSION_KEY = 'rg_secure_session';

// Helper to simulate JWT generation
const generateMockToken = () => {
  return 'ey' + Math.random().toString(36).substring(2) + '.' + Date.now();
};

const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    return null;
};

export const authService = {
  login: (email: string, password: string): Promise<AuthSession> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const usersStr = localStorage.getItem(USERS_KEY);
          const users = usersStr ? JSON.parse(usersStr) : [];
          // In a real app, passwords would be hashed. Here we compare plain text for the demo.
          const user = users.find((u: any) => u.email === email && u.password === password);
          
          if (user) {
            const { password, ...safeUser } = user;
            const session: AuthSession = {
              user: { ...safeUser, role: 'Admin' }, // Defaulting to Admin for demo
              token: generateMockToken(),
              expiresAt: Date.now() + 3600000 // 1 hour
            };
            
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            resolve(session);
          } else {
            reject(new Error('Invalid credentials. Please check your email and password.'));
          }
        } catch (e) {
          reject(new Error('Authentication service unavailable. Please try again later.'));
        }
      }, 800);
    });
  },

  signup: (email: string, password: string, name: string): Promise<AuthSession> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const usersStr = localStorage.getItem(USERS_KEY);
        const users = usersStr ? JSON.parse(usersStr) : [];
        
        if (users.find((u: any) => u.email === email)) {
          reject(new Error('User already exists with this email.'));
          return;
        }

        // Validation
        const pwdError = validatePassword(password);
        if (pwdError) {
            reject(new Error(pwdError));
            return;
        }

        if (!name.trim()) {
            reject(new Error("Full Name is required."));
            return;
        }

        const newUser = {
          id: crypto.randomUUID(),
          email,
          password, // In real backend: bcrypt.hash(password)
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          role: 'Admin'
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        const { password: _, ...safeUser } = newUser;
        const session: AuthSession = {
          user: safeUser as User,
          token: generateMockToken(),
          expiresAt: Date.now() + 3600000
        };
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        resolve(session);
      }, 1000);
    });
  },

  socialLogin: (provider: 'google' | 'github' | 'microsoft'): Promise<AuthSession> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              const mockUser: User = {
                  id: `social_${Date.now()}`,
                  email: `user@${provider}.com`,
                  name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
                  role: 'Viewer'
              };
              const session: AuthSession = {
                  user: mockUser,
                  token: generateMockToken(),
                  expiresAt: Date.now() + 3600000
              };
              localStorage.setItem(SESSION_KEY, JSON.stringify(session));
              resolve(session);
          }, 1500);
      });
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: (): AuthSession | null => {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;
      
      const session: AuthSession = JSON.parse(sessionStr);
      
      // Check expiry
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      
      return session;
    } catch (e) {
      return null;
    }
  }
};