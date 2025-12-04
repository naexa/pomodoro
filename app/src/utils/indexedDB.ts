/**
 * IndexedDB ユーティリティ
 *
 * ポモドーロアプリのデータ永続化用ラッパー関数群
 */

const DB_NAME = 'pomodoro-db';
const DB_VERSION = 1;

// オブジェクトストア名
export const STORES = {
  TASKS: 'tasks',
  CALENDAR: 'calendar',
  CATEGORIES: 'categories',
  REFLECTIONS: 'reflections',
  SETTINGS: 'settings',
  TASK_HISTORY: 'taskHistory',
  QUOTES: 'quotes',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;

/**
 * データベースを開く（シングルトン）
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // tasks: id をキーとするオブジェクトストア
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
      }

      // calendar: date (YYYY-MM-DD) をキーとするオブジェクトストア
      if (!db.objectStoreNames.contains(STORES.CALENDAR)) {
        db.createObjectStore(STORES.CALENDAR, { keyPath: 'date' });
      }

      // categories: id をキーとするオブジェクトストア
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }

      // reflections: id をキーとするオブジェクトストア
      if (!db.objectStoreNames.contains(STORES.REFLECTIONS)) {
        db.createObjectStore(STORES.REFLECTIONS, { keyPath: 'id' });
      }

      // settings: 単一オブジェクト（キー: 'main'）
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }

      // taskHistory: date をキーとするオブジェクトストア
      if (!db.objectStoreNames.contains(STORES.TASK_HISTORY)) {
        db.createObjectStore(STORES.TASK_HISTORY, { keyPath: 'date' });
      }

      // quotes: id をキーとするオブジェクトストア
      if (!db.objectStoreNames.contains(STORES.QUOTES)) {
        db.createObjectStore(STORES.QUOTES, { keyPath: 'id' });
      }
    };
  });
};

/**
 * 全件取得
 */
export const getAll = async <T>(storeName: StoreName): Promise<T[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get all from ${storeName}`));
    };
  });
};

/**
 * 1件取得
 */
export const get = async <T>(storeName: StoreName, key: string): Promise<T | undefined> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get ${key} from ${storeName}`));
    };
  });
};

/**
 * 保存/更新（1件）
 */
export const put = async <T>(storeName: StoreName, data: T, key?: string): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = key ? store.put(data, key) : store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to put data to ${storeName}`));
    };
  });
};

/**
 * 複数件保存（バルクインサート）
 */
export const putAll = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error(`Failed to put all data to ${storeName}`));
    };

    for (const item of items) {
      store.put(item);
    }
  });
};

/**
 * 削除（1件）
 */
export const remove = async (storeName: StoreName, key: string): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete ${key} from ${storeName}`));
    };
  });
};

/**
 * 全件削除（ストアをクリア）
 */
export const clear = async (storeName: StoreName): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear ${storeName}`));
    };
  });
};

/**
 * データベースを閉じる
 */
export const closeDatabase = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

/**
 * データベースを削除（デバッグ/リセット用）
 */
export const deleteDatabase = (): Promise<void> => {
  closeDatabase();
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete database'));
    };
  });
};
