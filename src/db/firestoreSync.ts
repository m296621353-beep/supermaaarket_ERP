import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs 
} from '../firebase';

// Helper to sanitize object before sending to Firestore (removing undefined values)
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

// Write or sync a full collection or single document to Firestore
export async function syncToFirestore(key: string, value: any): Promise<void> {
  try {
    if (!db) return;

    if (key === 'settings' || key === 'system_settings') {
      const docRef = doc(db, 'settings', 'system_settings');
      await setDoc(docRef, sanitizeForFirestore(value), { merge: true });
      return;
    }

    if (Array.isArray(value)) {
      // Save items to Firestore collection with matching doc id
      for (const item of value) {
        if (item && item.id) {
          const docRef = doc(db, key, String(item.id));
          setDoc(docRef, sanitizeForFirestore(item), { merge: true }).catch(err => {
            console.warn(`Firestore sync write error for ${key}/${item.id}:`, err);
          });
        }
      }
    } else if (value && typeof value === 'object' && value.id) {
      const docRef = doc(db, key, String(value.id));
      await setDoc(docRef, sanitizeForFirestore(value), { merge: true });
    }
  } catch (err) {
    console.warn(`Error in syncToFirestore for ${key}:`, err);
  }
}

// Delete document from Firestore
export async function deleteFromFirestore(collectionName: string, id: string): Promise<void> {
  try {
    if (!db || !id) return;
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`Firestore delete error for ${collectionName}/${id}:`, err);
  }
}

// Batch seed collection into Firestore if empty
export async function seedCollectionIfEmpty(
  collectionName: string, 
  initialItems: any[]
): Promise<void> {
  try {
    if (!db || !initialItems || initialItems.length === 0) return;
    
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    
    if (snap.empty) {
      console.log(`Migrating initial ${collectionName} dataset to Cloud Firestore...`);
      // Use batches of max 400 writes
      const batch = writeBatch(db);
      for (const item of initialItems) {
        if (item && item.id) {
          const docRef = doc(db, collectionName, String(item.id));
          batch.set(docRef, sanitizeForFirestore(item));
        }
      }
      await batch.commit();
      console.log(`Seeded ${initialItems.length} records into Firestore /${collectionName}`);
    }
  } catch (err) {
    console.warn(`Initial seed error for ${collectionName}:`, err);
  }
}

// Seed settings document if empty
export async function seedSettingsIfEmpty(defaultSettings: any): Promise<void> {
  try {
    if (!db || !defaultSettings) return;
    const docRef = doc(db, 'settings', 'system_settings');
    await setDoc(docRef, sanitizeForFirestore(defaultSettings), { merge: true });
  } catch (err) {
    console.warn('Initial settings seed error:', err);
  }
}

// Setup Realtime OnSnapshot listeners for bidirectional synchronization
export function setupCollectionListener(
  collectionName: string,
  onUpdate: (items: any[]) => void
): () => void {
  try {
    if (!db) return () => {};
    
    const colRef = collection(db, collectionName);
    const unsub = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        onUpdate(items);
      }
    }, (err) => {
      console.warn(`Firestore listener error on ${collectionName}:`, err);
    });

    return unsub;
  } catch (err) {
    console.warn(`Failed to attach Firestore listener on ${collectionName}:`, err);
    return () => {};
  }
}

// Setup Realtime Settings listener
export function setupSettingsListener(
  onUpdate: (settings: any) => void
): () => void {
  try {
    if (!db) return () => {};
    
    const docRef = doc(db, 'settings', 'system_settings');
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    }, (err) => {
      console.warn('Firestore settings listener error:', err);
    });

    return unsub;
  } catch (err) {
    console.warn('Failed to attach Firestore settings listener:', err);
    return () => {};
  }
}
