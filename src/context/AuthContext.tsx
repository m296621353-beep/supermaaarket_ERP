import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Branch, Warehouse, RolePermissionKey } from '../types';
import { getUsers, getRoles, getBranches, getWarehouses, addAuditLog, subscribeToDB, saveUser } from '../db/dbEngine';
import { auth, db, doc, getDoc, signInWithEmailAndPassword, onAuthStateChanged, firebaseSignOut } from '../firebase';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  activeBranch: Branch | null;
  activeWarehouse: Warehouse | null;
  branches: Branch[];
  warehouses: Warehouse[];
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('');
  const [activeWarehouseId, setActiveWarehouseIdState] = useState<string>('');

  // Real Firebase Auth state listener.
  // The user's profile document in Firestore/local cache MUST be stored
  // with its document id equal to the Firebase Auth UID (uid). This is
  // what lets firestore.rules verify each user's real role server-side.
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        // Try local/synced copy first (fast, works offline)
        let profile = getUsers().find(u => u.id === firebaseUser.uid) || null;

        // Fall back to a direct Firestore read if not found locally yet
        if (!profile) {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            profile = snap.data() as User;
          }
        }

        if (profile && profile.active) {
          setUser(profile);
          setActiveBranchIdState(profile.branchId);
        } else {
          // No matching profile / inactive account -> force sign-out
          await firebaseSignOut(auth);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setUser(null);
      } finally {
        setAuthLoading(false);
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

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      let profile = getUsers().find(u => u.id === cred.user.uid) || null;
      if (!profile) {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) profile = snap.data() as User;
      }

      if (!profile || !profile.active) {
        await firebaseSignOut(auth);
        return { ok: false, error: 'الحساب غير مفعّل أو غير مسجل في النظام.' };
      }

      setUser(profile);
      setActiveBranchIdState(profile.branchId);

      addAuditLog({
        userId: profile.id,
        userName: profile.name,
        action: 'LOGIN',
        module: 'تسجيل الدخول',
        details: 'تم تسجيل الدخول بنجاح عبر Firebase Auth (Email/Password)'
      });

      return { ok: true };
    } catch (err: any) {
      const code = err?.code || '';
      let message = 'حدث خطأ أثناء تسجيل الدخول.';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (code === 'auth/too-many-requests') {
        message = 'عدد محاولات كبير، حاول مرة أخرى بعد قليل.';
      } else if (code === 'auth/invalid-email') {
        message = 'صيغة البريد الإلكتروني غير صحيحة.';
      }
      return { ok: false, error: message };
    }
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
      authLoading,
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
