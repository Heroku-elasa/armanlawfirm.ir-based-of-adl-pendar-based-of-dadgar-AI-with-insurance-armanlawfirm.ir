
import { supabase } from './supabaseClient';
import { Lawyer } from '../types';

// For Lawyers, we still use IndexedDB for caching extensive lists from search
const DB_NAME = 'DadgarAIAppDB';
const DB_VERSION = 2;
const STORE_LAWYERS = 'lawyers';

export interface CaseData {
    id?: number | string; // Supabase uses ID or UUID
    registrationDate: string;
    firstName: string;
    lastName: string;
    nationalCode: string;
    mobile: string;
    email: string;
    type: string;
    status: string;
    priority: string;
    caseNumber?: string;
    branch?: string;
    defendant?: string;
    amount?: string;
    description?: string;
    user_id?: string; // Links to auth user
}

// --- INDEXEDDB SETUP (Keeping for Lawyer Cache) ---
let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => { console.error('IndexedDB error'); reject('Error opening IndexedDB.'); };
    request.onsuccess = (event) => { db = request.result; resolve(true); };
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_LAWYERS)) {
        dbInstance.createObjectStore(STORE_LAWYERS, { keyPath: 'website' });
      }
    };
  });
};

// --- LAWYERS (Local) ---
export const addLawyers = (lawyers: Lawyer[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not initialized.');
    const transaction = db.transaction(STORE_LAWYERS, 'readwrite');
    const store = transaction.objectStore(STORE_LAWYERS);
    transaction.onerror = () => reject('Error adding lawyers.');
    transaction.oncomplete = () => resolve();
    lawyers.forEach(lawyer => store.put(lawyer));
  });
};

export const getAllLawyers = (): Promise<Lawyer[]> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not initialized.');
    const transaction = db.transaction(STORE_LAWYERS, 'readonly');
    const store = transaction.objectStore(STORE_LAWYERS);
    const request = store.getAll();
    request.onerror = () => reject('Error fetching all lawyers.');
    request.onsuccess = () => resolve(request.result);
  });
};

export const clearAllLawyers = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized.');
        const transaction = db.transaction(STORE_LAWYERS, 'readwrite');
        const store = transaction.objectStore(STORE_LAWYERS);
        const request = store.clear();
        request.onerror = () => reject('Error clearing lawyers.');
        request.onsuccess = () => resolve();
    });
};

// --- CASES (Supabase) ---

// Helper to map Frontend CamelCase to DB SnakeCase
const toDbCase = (c: CaseData) => ({
    registration_date: c.registrationDate,
    first_name: c.firstName,
    last_name: c.lastName,
    national_code: c.nationalCode,
    mobile: c.mobile,
    email: c.email,
    type: c.type,
    status: c.status,
    priority: c.priority,
    case_number: c.caseNumber,
    branch: c.branch,
    defendant: c.defendant,
    amount: c.amount,
    description: c.description,
    // ID is handled by DB if new, or passed if updating
    ...(c.id ? { id: c.id } : {}) 
});

// Helper to map DB SnakeCase to Frontend CamelCase
const fromDbCase = (c: any): CaseData => ({
    id: c.id,
    registrationDate: c.registration_date || '',
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    nationalCode: c.national_code || '',
    mobile: c.mobile || '',
    email: c.email || '',
    type: c.type || '',
    status: c.status || '',
    priority: c.priority || '',
    caseNumber: c.case_number,
    branch: c.branch,
    defendant: c.defendant,
    amount: c.amount,
    description: c.description
});

export const getAllCases = async (): Promise<CaseData[]> => {
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch error:", error);
            return [];
        }
        return (data || []).map(fromDbCase);
    } catch (e) {
        console.error("Error connecting to Supabase", e);
        return [];
    }
};

export const saveCase = async (caseData: CaseData): Promise<any> => {
    // If auth user exists, attach ID (Supabase RLS usually handles this via auth.uid(), 
    // but explicit assignment might be needed depending on table policies)
    const { data: { user } } = await supabase.auth.getUser();
    
    const dbPayload = {
        ...toDbCase(caseData),
        user_id: user?.id 
    };

    const { data, error } = await supabase
        .from('cases')
        .upsert(dbPayload)
        .select();

    if (error) {
        throw new Error(error.message);
    }
    return data?.[0]?.id;
};

export const deleteCase = async (id: number | string): Promise<void> => {
    const { error } = await supabase.from('cases').delete().eq('id', id);
    if (error) throw new Error(error.message);
};
