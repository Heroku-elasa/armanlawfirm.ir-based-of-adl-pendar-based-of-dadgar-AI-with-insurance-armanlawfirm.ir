
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

export interface SeoAuditData {
    id?: number;
    created_at?: string;
    url: string;
    score: number;
    results: any; // JSON object for details
}

// --- INDEXEDDB SETUP (Keeping for Lawyer Cache) ---
let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }
    if (typeof window === 'undefined') {
        return resolve(false);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => { console.error('IndexedDB error'); reject('Error opening IndexedDB.'); };
    request.onsuccess = (event) => { db = (event.target as IDBOpenDBRequest).result; resolve(true); };
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

// --- HELPER: Check for Missing Table Error ---
const isTableMissingError = (error: any) => {
    const msg = (error?.message || JSON.stringify(error)).toLowerCase();
    return msg.includes('does not exist') || msg.includes('could not find the table') || msg.includes('relation');
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
    description: c.description,
    user_id: c.user_id
});

export const getAllCases = async (): Promise<CaseData[]> => {
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (isTableMissingError(error)) {
                console.warn("Supabase: Table 'cases' not found. Using mock data. (Please create tables via Admin Dashboard)");
                return [];
            }
            console.error("Supabase fetch error:", error.message || JSON.stringify(error));
            return [];
        }
        return (data || []).map(fromDbCase);
    } catch (e) {
        console.error("Error connecting to Supabase", e);
        return [];
    }
};

export const saveCase = async (caseData: CaseData): Promise<any> => {
    // If auth user exists, attach ID
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
        if (isTableMissingError(error)) {
             console.warn("Supabase: Table 'cases' not found. Save skipped. (Please create tables via Admin Dashboard)");
             return null;
        }
        throw new Error(error.message || "Unknown Supabase error during save");
    }
    return data?.[0]?.id;
};

export const deleteCase = async (id: number | string): Promise<void> => {
    const { error } = await supabase.from('cases').delete().eq('id', id);
    if (error) {
        if (isTableMissingError(error)) {
             console.warn("Supabase: Table 'cases' not found. Delete skipped.");
             return;
        }
        throw new Error(error.message || "Unknown Supabase error during delete");
    }
};

// --- SEO AUDITS (Supabase) ---

export const saveSeoAudit = async (audit: SeoAuditData): Promise<void> => {
    const { error } = await supabase
        .from('seo_audits')
        .insert([audit]);
    
    if (error) {
        if (isTableMissingError(error)) {
            console.warn("Supabase: Table 'seo_audits' not found. Save skipped.");
            return;
        }
        console.error("Error saving SEO audit:", error.message || JSON.stringify(error));
    }
};

export const getSeoAudits = async (): Promise<SeoAuditData[]> => {
    const { data, error } = await supabase
        .from('seo_audits')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        if (isTableMissingError(error)) {
            console.warn("Supabase: Table 'seo_audits' not found. Returning empty list.");
            return [];
        }
        console.error("Error fetching SEO audits:", error.message || JSON.stringify(error));
        return [];
    }
    return data || [];
};
