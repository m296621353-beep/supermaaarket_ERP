import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Branch, Warehouse, RolePermissionKey } from '../types';
import { getUsers, getRoles, getBranches, getWarehouses, addAuditLog, subscribeToDB } from '../db/dbEngine';
import { auth, signInAnonymously, onAuthStateChanged, firebaseSignOut } from '../firebase';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  activeBranch: Branch | null;
  activeWarehouse: Warehouse | null;
  branches: Branch[];
  warehouses: Warehouse[];
  login: (username: string) => boolean;
  logout: () => void;
  setActiveBranchId: (branchId: string) => void;
  setActiveWarehouseId: (warehouseId: string) => void;
  hasPermission: (moduleKey: RolePermissionKey, action: 'view' | 'add' | 'edit' | 'delete' | 'print' | 'discount' | 'changePrice') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [roles, setRoles] = useState<Role[]>(getRoles());
  const [branches, setBranches] = useState<Branch[]>(getBranches());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(getWarehouses());

  // Default logged in user (admin)
  const defaultUser = users.find(u => u.username === 'admin') || users[0] || null;
  const [user, setUser] = useState<User | null>(defaultUser);
  const [activeBranchId, setActiveBranchIdState] = useState<string>(defaultUser?.branchId || branches[0]?.id || '');
  const [activeWarehouseId, setActiveWarehouseIdState] = useState<string>('');

  // Firebase Auth state listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Auto sign-in to Firebase Auth anonymously for backend Firestore operations
        signInAnonymously(auth).catch(err => {
          console.log('Firebase anonymous auth note:', err);
        });
      }
    });

    return unsubAuth;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToDB(() => {
      setUsers(getUsers());
      setRoles(getRoles());
      setBranches(getBranches());
      setWarehouses(getWarehouses());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Sync default warehouse whenever active branch changes
    const branchWhs = warehouses.filter(w => w.branchId === activeBranchId);
    if (branchWhs.length > 0) {
      const defaultWh = branchWhs.find(w => w.isDefault) || branchWhs[0];
      setActiveWarehouseIdState(defaultWh.id);
    } else {
      setActiveWarehouseIdState('');
    }
  }, [activeBranchId, warehouses]);

  const role = user ? roles.find(r => r.id === user.roleId) || null : null;
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || null;
  const activeWarehouse = warehouses.find(w => w.id === activeWarehouseId) || warehouses[0] || null;

  const login = (username: string): boolean => {
    const foundUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.active);
    if (foundUser) {
      setUser(foundUser);
      setActiveBranchIdState(foundUser.branchId);
      
      // Ensure Firebase Auth session is active
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(console.warn);
      }

      addAuditLog({
        userId: foundUser.id,
        userName: foundUser.name,
        action: 'LOGIN',
        module: 'تسجيل الدخول',
        details: 'تم تسجيل الدخول بنجاح عبر Firebase Auth'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
      addAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
        module: 'تسجيل الخروج',
        details: 'تم تسجيل الخروج'
      });
    }
    setUser(null);
    firebaseSignOut(auth).catch(console.warn);
  };

  const setActiveBranchId = (branchId: string) => {
    setActiveBranchIdState(branchId);
  };

  const setActiveWarehouseId = (warehouseId: string) => {
    setActiveWarehouseIdState(warehouseId);
  };

  const hasPermission = (
    moduleKey: RolePermissionKey,
    action: 'view' | 'add' | 'edit' | 'delete' | 'print' | 'discount' | 'changePrice'
  ): boolean => {
    if (!user || !role) return false;
    const modPerm = role.permissions[moduleKey];
    if (!modPerm) return false;
    return Boolean(modPerm[action]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      activeBranch,
      activeWarehouse,
      branches,
      warehouses,
      login,
      logout,
      setActiveBranchId,
      setActiveWarehouseId,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
