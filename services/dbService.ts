
import { Lawyer } from '../types';

const DB_NAME = 'DadgarAIAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'lawyers';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'website' });
      }
    };
  });
};

export const addLawyers = (lawyers: Lawyer[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject('DB not initialized.');
    }
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.onerror = () => {
      console.error('Transaction error:', transaction.error);
      reject('Error adding lawyers.');
    };
    
    transaction.oncomplete = () => {
      resolve();
    };

    lawyers.forEach(lawyer => {
      store.put(lawyer);
    });
  });
};

export const getAllLawyers = (): Promise<Lawyer[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject('DB not initialized.');
    }
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Get all lawyers error:', request.error);
      reject('Error fetching all lawyers.');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

export const clearAllLawyers = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject('DB not initialized.');
        }
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
            console.error('Clear all lawyers error:', request.error);
            reject('Error clearing lawyers.');
        };

        request.onsuccess = () => {
            resolve();
        };
    });
};
