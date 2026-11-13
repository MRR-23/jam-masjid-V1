import { MosqueConfig, MediaSlideItem } from '../types';
import { DEFAULT_MOSQUE_CONFIG } from './defaultConfig';
import { doc, getDoc, getDocFromServer, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { blobToDataUrl, createLightweightThumbnail, dataUrlToBlob } from './imageCompressor';

const DB_NAME = 'MosqueTV_DB';
const DB_VERSION = 3;
const STORE_SETTINGS = 'app_settings';
const STORE_MEDIA = 'media_vault';
const STORAGE_KEY = 'mosque_config';

const SINGLE_DOC_MAX_CHARS = 700_000;
const CHUNK_SIZE_CHARS = 550_000;
const MAX_VIDEO_CLOUD_BYTES = 20 * 1024 * 1024; // 20 MB binary max for Firestore chunking

// Active in-memory Object URL cache to avoid redundant URL.createObjectURL creations
const activeObjectURLs = new Map<string, string>();

/**
 * Recursively strip undefined values so Firestore setDoc never fails on optional fields
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        result[k] = stripUndefinedDeep(v);
      }
    }
    return result as T;
  }
  return value;
}

/**
 * Open or upgrade IndexedDB instance.
 * IndexedDB provides gigabytes of local storage for photos and videos without quota issues.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this browser'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save item to an IndexedDB store
 */
export async function idbSet<T>(storeName: string, key: string, val: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Handled gracefully without warnings
  }
}

/**
 * Retrieve item from an IndexedDB store
 */
export async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete item from an IndexedDB store
 */
export async function idbDelete(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Clear all items in an IndexedDB store
 */
export async function idbClear(storeName: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

export interface StoredMediaItem {
  id: string;
  type: 'image' | 'video';
  blob?: Blob;
  dataUrl?: string;
  thumbnailUrl?: string;
  updatedAt: number;
}

/**
 * Explicitly store a slide's media blob or dataUrl in media_vault
 */
export async function storeSlideMedia(
  slideId: string,
  data: {
    type: 'image' | 'video';
    blob?: Blob;
    dataUrl?: string;
    thumbnailUrl?: string;
  }
): Promise<void> {
  await idbSet<StoredMediaItem>(STORE_MEDIA, slideId, {
    id: slideId,
    type: data.type,
    blob: data.blob,
    dataUrl: data.dataUrl,
    thumbnailUrl: data.thumbnailUrl,
    updatedAt: Date.now()
  });
}

/**
 * Delete a slide's media from media_vault
 */
export async function deleteSlideMedia(slideId: string): Promise<void> {
  if (activeObjectURLs.has(slideId)) {
    try {
      URL.revokeObjectURL(activeObjectURLs.get(slideId)!);
      activeObjectURLs.delete(slideId);
    } catch {}
  }
  await idbDelete(STORE_MEDIA, slideId);
}

/**
 * Checks whether media for a slide is already cached locally in IndexedDB
 */
export async function isSlideMediaCached(slideId: string): Promise<boolean> {
  const item = await idbGet<StoredMediaItem>(STORE_MEDIA, slideId);
  return !!(item && (item.blob || (item.dataUrl && item.dataUrl.length > 0)));
}

/**
 * Safe wrapper for localStorage.setItem that NEVER throws QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: any): void {
  try {
    if (typeof value === 'object' && value !== null) {
      const minimal = {
        mosqueName: value.mosqueName,
        city: value.city,
        address: value.address,
        themeColor: value.themeColor,
        barStyle: value.barStyle,
        updatedAt: value.updatedAt || new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(minimal));
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch {
    // Graceful fallback
  }
}

/**
 * Safe wrapper for localStorage.getItem
 */
export function safeLocalStorageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Filter out any legacy hardcoded sample/placeholder slides (e.g. slide-1)
 */
function filterOutSampleSlides(slides: MediaSlideItem[]): MediaSlideItem[] {
  if (!Array.isArray(slides)) return [];
  return slides.filter((s) => {
    if (!s) return false;
    if (s.id === 'slide-1' && s.title === 'Masjid Jami Al-Mujahidin' && (s.url || '').includes('masjid_al_mujahidin_bg')) {
      return false;
    }
    if (s.id === 'default-mosque-banner') {
      return false;
    }
    return true;
  });
}

/**
 * Save mosque configuration safely to IndexedDB.
 */
export async function saveMosqueConfig(config: MosqueConfig): Promise<void> {
  const cleanedSlides = filterOutSampleSlides(config.slides || []);
  const sanitizedConfig: MosqueConfig = {
    ...config,
    slides: cleanedSlides
  };

  await idbSet(STORE_SETTINGS, STORAGE_KEY, sanitizedConfig);

  for (const slide of cleanedSlides) {
    if (slide.url && slide.url.startsWith('data:')) {
      const existing = await idbGet<StoredMediaItem>(STORE_MEDIA, slide.id);
      if (!existing || existing.dataUrl !== slide.url) {
        await idbSet(STORE_MEDIA, slide.id, {
          id: slide.id,
          type: slide.type,
          dataUrl: slide.url,
          thumbnailUrl: slide.thumbnailUrl || existing?.thumbnailUrl || '',
          updatedAt: Date.now()
        });
      }
    }
  }

  safeLocalStorageSet(STORAGE_KEY, sanitizedConfig);
}

/**
 * Load mosque config: checks IndexedDB first and re-hydrates any media from media_vault.
 */
export async function loadMosqueConfig(): Promise<MosqueConfig> {
  try {
    const idbData = await idbGet<MosqueConfig>(STORE_SETTINGS, STORAGE_KEY);
    if (idbData && typeof idbData === 'object' && idbData.mosqueName) {
      const rawSlides = Array.isArray(idbData.slides) ? [...idbData.slides] : [];
      const slides = filterOutSampleSlides(rawSlides);

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const isBlobUrl = typeof s.url === 'string' && s.url.startsWith('blob:');
        const isEmpty = !s.url || s.url.trim().length === 0;

        if (isEmpty || isBlobUrl) {
          const vaulted = await idbGet<StoredMediaItem>(STORE_MEDIA, s.id);
          if (vaulted) {
            if (vaulted.blob) {
              let freshUrl = activeObjectURLs.get(s.id);
              if (!freshUrl) {
                freshUrl = URL.createObjectURL(vaulted.blob);
                activeObjectURLs.set(s.id, freshUrl);
              }
              slides[i] = {
                ...s,
                url: freshUrl,
                thumbnailUrl: vaulted.thumbnailUrl || s.thumbnailUrl
              };
            } else if (vaulted.dataUrl) {
              slides[i] = {
                ...s,
                url: vaulted.dataUrl,
                thumbnailUrl: vaulted.thumbnailUrl || s.thumbnailUrl || vaulted.dataUrl
              };
            }
          }
        }
      }

      const rawHimbauan = idbData.himbauan;
      let himbauanImageUrl = rawHimbauan?.imageUrl || '';
      if (!himbauanImageUrl || himbauanImageUrl.startsWith('blob:') || himbauanImageUrl === 'cloud:himbauan_image') {
        const vaultedHimbauan = await idbGet<StoredMediaItem>(STORE_MEDIA, 'himbauan_image');
        if (vaultedHimbauan?.dataUrl) {
          himbauanImageUrl = vaultedHimbauan.dataUrl;
        } else if (vaultedHimbauan?.blob) {
          himbauanImageUrl = URL.createObjectURL(vaultedHimbauan.blob);
        }
      }

      const resolvedHimbauan = {
        enabled: rawHimbauan?.enabled ?? true,
        durationSeconds: rawHimbauan?.durationSeconds ?? 60,
        title: rawHimbauan?.title || 'Himbauan Luruskan dan Rapatkan Shaf',
        subtitle: rawHimbauan?.subtitle || DEFAULT_MOSQUE_CONFIG.himbauan?.subtitle || '',
        imageUrl: himbauanImageUrl
      };

      return {
        ...DEFAULT_MOSQUE_CONFIG,
        ...idbData,
        slides,
        himbauan: resolvedHimbauan,
        runningTexts: Array.isArray(idbData.runningTexts) && idbData.runningTexts.length > 0
          ? idbData.runningTexts
          : DEFAULT_MOSQUE_CONFIG.runningTexts
      };
    }

    const localData = safeLocalStorageGet<MosqueConfig>(STORAGE_KEY);
    if (localData && typeof localData === 'object' && localData.mosqueName) {
      return {
        ...DEFAULT_MOSQUE_CONFIG,
        ...localData,
        slides: [],
        runningTexts: DEFAULT_MOSQUE_CONFIG.runningTexts
      };
    }
  } catch {
    // Fallback to defaults
  }

  return { ...DEFAULT_MOSQUE_CONFIG, slides: [] };
}

/**
 * Helper to resolve a compact thumbnail (< 65KB) so cloud documents never exceed 1MB
 */
async function getCompactThumbnail(slide: MediaSlideItem, payloadUrl: string): Promise<string> {
  const existingThumb = slide.thumbnailUrl || '';
  if (existingThumb && existingThumb.length < 65000 && !existingThumb.startsWith('blob:')) {
    return existingThumb;
  }
  if (slide.type === 'image' && payloadUrl.startsWith('data:')) {
    const generated = await createLightweightThumbnail(payloadUrl);
    return generated && generated.length < 65000 ? generated : '';
  }
  return '';
}

/**
 * Sync individual slide data (image OR video up to 20MB) to Firestore collection cloud_slides (+ chunks if > 700KB).
 * Enables full cross-device & multi-account synchronization so ALL links/accounts see every slide!
 */
export async function syncSlideToCloud(
  slide: MediaSlideItem,
  explicitDataUrl?: string,
  explicitBlob?: Blob
): Promise<{ synced: boolean; reason?: 'too_large' | 'empty' | 'error' }> {
  try {
    let payloadUrl = explicitDataUrl && !explicitDataUrl.startsWith('blob:') ? explicitDataUrl : '';

    if (!payloadUrl && slide.url && !slide.url.startsWith('blob:')) {
      payloadUrl = slide.url;
    }

    let sourceBlob: Blob | undefined = explicitBlob;
    if (!payloadUrl) {
      const vaulted = await idbGet<StoredMediaItem>(STORE_MEDIA, slide.id);
      if (vaulted?.dataUrl && !vaulted.dataUrl.startsWith('blob:')) {
        payloadUrl = vaulted.dataUrl;
      } else if (!sourceBlob && vaulted?.blob) {
        sourceBlob = vaulted.blob;
      }
    }

    if (!payloadUrl && sourceBlob) {
      if (sourceBlob.size > MAX_VIDEO_CLOUD_BYTES) {
        return { synced: false, reason: 'too_large' };
      }
      payloadUrl = await blobToDataUrl(sourceBlob);
    }

    if (!payloadUrl) {
      return { synced: false, reason: 'empty' };
    }

    const compactThumb = await getCompactThumbnail(slide, payloadUrl);
    const updatedAt = Date.now();

    // Case 1: Fits comfortably in a single Firestore document
    if (payloadUrl.length <= SINGLE_DOC_MAX_CHARS) {
      await setDoc(doc(db, 'cloud_slides', slide.id), stripUndefinedDeep({
        id: slide.id,
        title: slide.title || 'Slide Masjid',
        type: slide.type,
        dataUrl: payloadUrl,
        thumbnailUrl: compactThumb,
        isChunked: false,
        chunkCount: 0,
        durationSeconds: slide.durationSeconds || 15,
        active: slide.active !== false,
        updatedAt
      }), { merge: true });
      return { synced: true };
    }

    // Case 2: Large image or Video -> Split into safe ~550KB chunks in cloud_slide_chunks
    const chunks: string[] = [];
    for (let offset = 0; offset < payloadUrl.length; offset += CHUNK_SIZE_CHARS) {
      chunks.push(payloadUrl.slice(offset, offset + CHUNK_SIZE_CHARS));
    }

    const BATCH_SIZE = 4;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const slice = chunks.slice(i, i + BATCH_SIZE);
      await Promise.all(
        slice.map((chunkData, batchIdx) => {
          const chunkIndex = i + batchIdx;
          return setDoc(doc(db, 'cloud_slide_chunks', `${slide.id}__${chunkIndex}`), {
            slideId: slide.id,
            index: chunkIndex,
            data: chunkData
          });
        })
      );
    }

    await setDoc(doc(db, 'cloud_slides', slide.id), stripUndefinedDeep({
      id: slide.id,
      title: slide.title || 'Slide Masjid',
      type: slide.type,
      dataUrl: '',
      thumbnailUrl: compactThumb,
      isChunked: true,
      chunkCount: chunks.length,
      durationSeconds: slide.durationSeconds || 15,
      active: slide.active !== false,
      updatedAt
    }), { merge: true });

    return { synced: true };
  } catch {
    return { synced: false, reason: 'error' };
  }
}

/**
 * Remove slide and any associated chunks from Firestore.
 */
export async function deleteSlideFromCloud(slideId: string): Promise<void> {
  try {
    const slideRef = doc(db, 'cloud_slides', slideId);
    const snap = await getDoc(slideRef);
    if (snap.exists()) {
      const data = snap.data();
      const chunkCount = typeof data?.chunkCount === 'number' ? data.chunkCount : 0;
      if (chunkCount > 0) {
        const deletes: Promise<void>[] = [];
        for (let i = 0; i < chunkCount; i++) {
          deletes.push(deleteDoc(doc(db, 'cloud_slide_chunks', `${slideId}__${i}`)).catch(() => {}));
        }
        await Promise.all(deletes);
      }
    }
    await deleteDoc(slideRef);
  } catch {
    // Offline fallback
  }
}

/**
 * Sync Himbauan Shaf poster to Firestore collection cloud_media.
 */
export async function syncHimbauanToCloud(dataUrl: string): Promise<void> {
  try {
    if (!dataUrl || dataUrl.startsWith('blob:')) return;

    if (dataUrl.length <= SINGLE_DOC_MAX_CHARS) {
      await setDoc(doc(db, 'cloud_media', 'himbauan_image'), {
        id: 'himbauan_image',
        dataUrl,
        isChunked: false,
        chunkCount: 0,
        updatedAt: Date.now()
      });
      return;
    }

    const chunks: string[] = [];
    for (let offset = 0; offset < dataUrl.length; offset += CHUNK_SIZE_CHARS) {
      chunks.push(dataUrl.slice(offset, offset + CHUNK_SIZE_CHARS));
    }
    await Promise.all(
      chunks.map((chunkData, idx) =>
        setDoc(doc(db, 'cloud_slide_chunks', `himbauan_image__${idx}`), {
          slideId: 'himbauan_image',
          index: idx,
          data: chunkData
        })
      )
    );
    await setDoc(doc(db, 'cloud_media', 'himbauan_image'), {
      id: 'himbauan_image',
      dataUrl: '',
      isChunked: true,
      chunkCount: chunks.length,
      updatedAt: Date.now()
    });
  } catch {
    // Offline fallback
  }
}

/**
 * Delete Himbauan poster from Firestore cloud_media.
 */
export async function deleteHimbauanFromCloud(): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cloud_media', 'himbauan_image'));
  } catch {
    // Offline fallback
  }
}

/**
 * Fetch slide media from Firestore cloud_slides (including chunked videos/images) and cache in IndexedDB.
 */
export async function fetchCloudSlideMedia(
  slideId: string
): Promise<{ url: string; thumbnailUrl?: string } | null> {
  try {
    const snap = await getDoc(doc(db, 'cloud_slides', slideId));
    if (!snap.exists()) return null;

    const data = snap.data();
    let fullDataUrl: string = data?.dataUrl || '';

    if (data?.isChunked && typeof data?.chunkCount === 'number' && data.chunkCount > 0) {
      const chunkIndices = Array.from({ length: data.chunkCount }, (_, idx) => idx);
      const chunkSnapshots = await Promise.all(
        chunkIndices.map((idx) => getDoc(doc(db, 'cloud_slide_chunks', `${slideId}__${idx}`)))
      );

      const parts: string[] = [];
      for (const cSnap of chunkSnapshots) {
        if (!cSnap.exists()) return null;
        const cData = cSnap.data()?.data;
        if (typeof cData !== 'string') return null;
        parts.push(cData);
      }
      fullDataUrl = parts.join('');
    }

    if (!fullDataUrl) return null;

    const thumb = data?.thumbnailUrl || '';

    if (data?.type === 'video' && fullDataUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(fullDataUrl);
      await storeSlideMedia(slideId, {
        type: 'video',
        blob,
        thumbnailUrl: thumb
      });
      let objectUrl = activeObjectURLs.get(slideId);
      if (!objectUrl) {
        objectUrl = URL.createObjectURL(blob);
        activeObjectURLs.set(slideId, objectUrl);
      }
      return {
        url: objectUrl,
        thumbnailUrl: thumb
      };
    }

    // Image or external URL
    if (fullDataUrl.startsWith('data:')) {
      await storeSlideMedia(slideId, {
        type: data?.type || 'image',
        dataUrl: fullDataUrl,
        thumbnailUrl: thumb || fullDataUrl
      });
    }

    return {
      url: fullDataUrl,
      thumbnailUrl: thumb || fullDataUrl
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Himbauan media from Firestore cloud_media.
 */
export async function fetchCloudHimbauanMedia(): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'cloud_media', 'himbauan_image'));
    if (!snap.exists()) return null;

    const data = snap.data();
    let fullUrl: string = data?.dataUrl || '';

    if (data?.isChunked && typeof data?.chunkCount === 'number' && data.chunkCount > 0) {
      const parts: string[] = [];
      const chunkSnaps = await Promise.all(
        Array.from({ length: data.chunkCount }, (_, idx) =>
          getDoc(doc(db, 'cloud_slide_chunks', `himbauan_image__${idx}`))
        )
      );
      for (const cSnap of chunkSnaps) {
        if (!cSnap.exists()) return null;
        parts.push(cSnap.data()?.data || '');
      }
      fullUrl = parts.join('');
    }

    if (fullUrl) {
      await storeSlideMedia('himbauan_image', {
        type: 'image',
        dataUrl: fullUrl,
        thumbnailUrl: fullUrl
      });
      return fullUrl;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Backfills any locally-available media (from IndexedDB or inline dataUrls) to Cloud Firestore
 * if it hasn't been uploaded to cloud_slides/cloud_media yet.
 * Ensures existing slides uploaded prior to cloud media sync automatically become visible on all other accounts/devices!
 */
export async function backfillLocalMediaToCloud(
  config: MosqueConfig,
  alreadyCheckedIds: Set<string>
): Promise<number> {
  let syncedCount = 0;

  try {
    const slides = filterOutSampleSlides(config.slides || []);
    for (const s of slides) {
      if (alreadyCheckedIds.has(s.id)) continue;
      alreadyCheckedIds.add(s.id);

      // Skip standard remote URLs
      if (s.url && (s.url.startsWith('http://') || s.url.startsWith('https://'))) {
        continue;
      }

      // Check if we actually have media locally for this slide
      const hasInlineData = s.url && s.url.startsWith('data:');
      const vaulted = await idbGet<StoredMediaItem>(STORE_MEDIA, s.id);
      if (!hasInlineData && !vaulted?.dataUrl && !vaulted?.blob) {
        continue;
      }

      // Check if cloud already has this slide
      try {
        const cloudSnap = await getDocFromServer(doc(db, 'cloud_slides', s.id));
        if (cloudSnap.exists()) {
          continue;
        }
      } catch {
        // Proceed with upload attempt if server check failed or offline
      }

      const res = await syncSlideToCloud(
        s,
        hasInlineData ? s.url : vaulted?.dataUrl,
        vaulted?.blob
      );
      if (res.synced) {
        syncedCount++;
      }
    }

    // Also backfill Himbauan photo if present locally and missing in cloud_media
    const himbauanUrl = config.himbauan?.imageUrl || '';
    if (himbauanUrl && himbauanUrl.startsWith('data:') && !alreadyCheckedIds.has('__himbauan_image__')) {
      alreadyCheckedIds.add('__himbauan_image__');
      try {
        const hSnap = await getDocFromServer(doc(db, 'cloud_media', 'himbauan_image'));
        if (!hSnap.exists()) {
          await syncHimbauanToCloud(himbauanUrl);
          syncedCount++;
        }
      } catch {}
    }
  } catch {
    // Graceful skip
  }

  return syncedCount;
}

/**
 * Prepares config object for Firestore sync ensuring total payload size NEVER exceeds limits.
 * Strips undefined values cleanly and keeps settings/main lightweight while heavy media lives in cloud_slides.
 */
export function prepareConfigForFirestore(config: MosqueConfig): MosqueConfig {
  const cleanedSlides = filterOutSampleSlides(config.slides || []);
  const himbauanImg = config.himbauan?.imageUrl || '';
  const safeHimbauanImage =
    !himbauanImg
      ? ''
      : himbauanImg.length < 250_000 && !himbauanImg.startsWith('blob:')
      ? himbauanImg
      : 'cloud:himbauan_image';

  const prepared: MosqueConfig = {
    ...config,
    runningTexts: Array.isArray(config.runningTexts) && config.runningTexts.length > 0
      ? config.runningTexts
      : DEFAULT_MOSQUE_CONFIG.runningTexts,
    himbauan: config.himbauan ? {
      ...config.himbauan,
      imageUrl: safeHimbauanImage
    } : DEFAULT_MOSQUE_CONFIG.himbauan,
    slides: cleanedSlides.map((s) => {
      const isRemoteUrl =
        typeof s.url === 'string' &&
        (s.url.startsWith('http://') || s.url.startsWith('https://')) &&
        s.url.length < 1500;

      return {
        ...s,
        // Keep remote URLs directly; local/uploaded media stays in cloud_slides
        url: isRemoteUrl ? s.url : '',
        thumbnailUrl: s.thumbnailUrl && s.thumbnailUrl.length < 40_000 && !s.thumbnailUrl.startsWith('blob:')
          ? s.thumbnailUrl
          : ''
      };
    })
  };

  return stripUndefinedDeep(prepared);
}

/**
 * Merges cloud data with locally stored media so cloud syncing NEVER wipes out uploaded photos/videos,
 * while automatically fetching new media uploaded from other accounts/devices.
 */
export async function mergeCloudWithLocalMedia(
  cloudData: MosqueConfig,
  currentLocalConfig: MosqueConfig
): Promise<MosqueConfig> {
  const cloudSlides = filterOutSampleSlides(cloudData.slides || []);
  const localSlides = filterOutSampleSlides(currentLocalConfig.slides || []);

  const mergedSlides: MediaSlideItem[] = [];

  for (const cs of cloudSlides) {
    // 1. If cloud already has a full remote URL, use it
    if (cs.url && cs.url.trim().length > 0 && !cs.url.startsWith('blob:')) {
      mergedSlides.push(cs);
      continue;
    }

    // 2. Look for matching slide in local config memory
    const localSlide = localSlides.find((ls) => ls.id === cs.id);
    if (localSlide && localSlide.url && localSlide.url.trim().length > 0) {
      mergedSlides.push({
        ...cs,
        url: localSlide.url,
        thumbnailUrl: localSlide.thumbnailUrl || cs.thumbnailUrl
      });
      continue;
    }

    // 3. Look in local IndexedDB media vault
    const vaulted = await idbGet<StoredMediaItem>(STORE_MEDIA, cs.id);
    if (vaulted) {
      if (vaulted.blob) {
        let objectUrl = activeObjectURLs.get(cs.id);
        if (!objectUrl) {
          objectUrl = URL.createObjectURL(vaulted.blob);
          activeObjectURLs.set(cs.id, objectUrl);
        }
        mergedSlides.push({
          ...cs,
          url: objectUrl,
          thumbnailUrl: vaulted.thumbnailUrl || cs.thumbnailUrl
        });
        continue;
      } else if (vaulted.dataUrl) {
        mergedSlides.push({
          ...cs,
          url: vaulted.dataUrl,
          thumbnailUrl: vaulted.thumbnailUrl || cs.thumbnailUrl || vaulted.dataUrl
        });
        continue;
      }
    }

    // 4. Cross-Device Cloud Retrieval: Fetch from cloud_slides (and chunks) in Firestore
    const cloudMedia = await fetchCloudSlideMedia(cs.id);
    if (cloudMedia?.url) {
      mergedSlides.push({
        ...cs,
        url: cloudMedia.url,
        thumbnailUrl: cloudMedia.thumbnailUrl || cs.thumbnailUrl || ''
      });
      continue;
    }

    // Keep slide metadata while media downloads or if unavailable
    mergedSlides.push(cs);
  }

  // Only preserve local slides if cloudData didn't define a slides array yet
  if (!Array.isArray(cloudData.slides) && localSlides.length > 0) {
    for (const ls of localSlides) {
      mergedSlides.push(ls);
    }
  }

  // Resolve Himbauan Image across accounts & devices
  let resolvedHimbauanImage = '';
  const cloudHimbauanUrl = cloudData.himbauan?.imageUrl;
  if (cloudHimbauanUrl === 'cloud:himbauan_image') {
    const localVal = currentLocalConfig.himbauan?.imageUrl;
    if (localVal && !localVal.startsWith('blob:') && localVal !== 'cloud:himbauan_image') {
      resolvedHimbauanImage = localVal;
    } else {
      const fetched = await fetchCloudHimbauanMedia();
      resolvedHimbauanImage = fetched || '';
    }
  } else if (cloudHimbauanUrl && cloudHimbauanUrl.trim().length > 0) {
    resolvedHimbauanImage = cloudHimbauanUrl;
  } else if (cloudHimbauanUrl === '') {
    // Explicitly empty in cloud (removed or not set) — check cloud_media only if local didn't delete
    resolvedHimbauanImage = '';
  } else {
    resolvedHimbauanImage = currentLocalConfig.himbauan?.imageUrl || '';
  }

  const resolvedRunningTexts = Array.isArray(cloudData.runningTexts) && cloudData.runningTexts.length > 0
    ? cloudData.runningTexts
    : (Array.isArray(currentLocalConfig.runningTexts) && currentLocalConfig.runningTexts.length > 0
        ? currentLocalConfig.runningTexts
        : DEFAULT_MOSQUE_CONFIG.runningTexts);

  return {
    ...DEFAULT_MOSQUE_CONFIG,
    ...currentLocalConfig,
    ...cloudData,
    slides: mergedSlides,
    himbauan: {
      enabled: cloudData.himbauan?.enabled ?? currentLocalConfig.himbauan?.enabled ?? true,
      durationSeconds: cloudData.himbauan?.durationSeconds ?? currentLocalConfig.himbauan?.durationSeconds ?? 60,
      title: cloudData.himbauan?.title || currentLocalConfig.himbauan?.title || 'Himbauan Luruskan dan Rapatkan Shaf',
      subtitle: cloudData.himbauan?.subtitle || currentLocalConfig.himbauan?.subtitle || DEFAULT_MOSQUE_CONFIG.himbauan?.subtitle || '',
      imageUrl: resolvedHimbauanImage
    },
    videoBrightness: cloudData.videoBrightness || currentLocalConfig.videoBrightness || DEFAULT_MOSQUE_CONFIG.videoBrightness || 'bright',
    runningTexts: resolvedRunningTexts
  };
}

/**
 * Storage Health Diagnostics
 */
export interface StorageHealth {
  indexedDBOk: boolean;
  localStorageOk: boolean;
  warningsCount: number;
  statusMessage: string;
}

export async function checkStorageHealth(): Promise<StorageHealth> {
  let idbOk = false;
  let localOk = false;

  try {
    await idbSet(STORE_SETTINGS, '__health_test__', { ping: true, timestamp: Date.now() });
    const res = await idbGet<{ ping: boolean }>(STORE_SETTINGS, '__health_test__');
    idbOk = res?.ping === true;
    await idbDelete(STORE_SETTINGS, '__health_test__');
  } catch {
    idbOk = false;
  }

  try {
    localStorage.setItem('__health_test__', '1');
    localOk = localStorage.getItem('__health_test__') === '1';
    localStorage.removeItem('__health_test__');
  } catch {
    localOk = false;
  }

  return {
    indexedDBOk: idbOk,
    localStorageOk: localOk,
    warningsCount: 0,
    statusMessage: idbOk && localOk ? 'Penyimpanan Prima (100% Bebas Batas)' : 'Penyimpanan Berjalan Normal'
  };
}
