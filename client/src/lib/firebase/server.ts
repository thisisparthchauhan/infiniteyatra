// Server-side Firebase data fetching via Firestore REST API
// Safe to use in Server Components, generateStaticParams, generateMetadata
// No browser SDK required

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Convert Firestore REST document format to a plain JS object.
 * Handles: string, integer, double, boolean, array, map, null values.
 */
function parseFirestoreDoc(doc: FirestoreDoc): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (!doc.fields) return result;

    for (const [key, val] of Object.entries(doc.fields)) {
        result[key] = parseFirestoreValue(val);
    }

    // Attach Firestore document ID from the name path
    if (doc.name) {
        result.id = doc.name.split('/').pop();
    }
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFirestoreValue(val: any): unknown {
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
        return (val.arrayValue?.values ?? []).map(parseFirestoreValue);
    }
    if ('mapValue' in val) {
        const nested: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val.mapValue?.fields ?? {})) {
            nested[k] = parseFirestoreValue(v);
        }
        return nested;
    }
    return null;
}

interface FirestoreDoc {
    name?: string;
    fields?: Record<string, unknown>;
}

interface FirestoreListResponse {
    documents?: FirestoreDoc[];
}

// ─── Tour / Package helpers ───────────────────────────────────────────────────

export async function getAllTourIds(): Promise<string[]> {
    try {
        const res = await fetch(`${BASE_URL}/packages?pageSize=200`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map((d) => d.name!.split('/').pop()!);
    } catch {
        return [];
    }
}

export async function getTourById(id: string): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(`${BASE_URL}/packages/${id}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const doc: FirestoreDoc = await res.json();
        return parseFirestoreDoc(doc);
    } catch {
        return null;
    }
}

export async function getAllTours(): Promise<Record<string, unknown>[]> {
    try {
        const res = await fetch(`${BASE_URL}/packages?pageSize=200`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map(parseFirestoreDoc);
    } catch {
        return [];
    }
}

// ─── Blog helpers ─────────────────────────────────────────────────────────────

export async function getAllBlogSlugs(): Promise<string[]> {
    try {
        const res = await fetch(`${BASE_URL}/blogs?pageSize=200`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map((d) => d.name!.split('/').pop()!);
    } catch {
        return [];
    }
}

export async function getBlogPost(slug: string): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(`${BASE_URL}/blogs/${slug}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        const doc: FirestoreDoc = await res.json();
        return parseFirestoreDoc(doc);
    } catch {
        return null;
    }
}

export async function getAllBlogPosts(): Promise<Record<string, unknown>[]> {
    try {
        const res = await fetch(`${BASE_URL}/blogs?pageSize=200`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map(parseFirestoreDoc);
    } catch {
        return [];
    }
}

// ─── Destination helpers ──────────────────────────────────────────────────────

export async function getAllDestinationSlugs(): Promise<string[]> {
    try {
        const res = await fetch(`${BASE_URL}/destinations?pageSize=200`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map((d) => d.name!.split('/').pop()!);
    } catch {
        return [];
    }
}

export async function getDestinationBySlug(slug: string): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(`${BASE_URL}/destinations/${slug}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        const doc: FirestoreDoc = await res.json();
        return parseFirestoreDoc(doc);
    } catch {
        return null;
    }
}

export async function getAllDestinations(): Promise<Record<string, unknown>[]> {
    try {
        const res = await fetch(`${BASE_URL}/destinations?pageSize=200`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map(parseFirestoreDoc);
    } catch {
        return [];
    }
}

// ─── Hotel helpers ────────────────────────────────────────────────────────────

export async function getAllHotelIds(): Promise<string[]> {
    try {
        const res = await fetch(`${BASE_URL}/hotels?pageSize=200`, {
            next: { revalidate: 1800 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map((d) => d.name!.split('/').pop()!);
    } catch {
        return [];
    }
}

export async function getHotelById(id: string): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(`${BASE_URL}/hotels/${id}`, {
            next: { revalidate: 1800 },
        });
        if (!res.ok) return null;
        const doc: FirestoreDoc = await res.json();
        return parseFirestoreDoc(doc);
    } catch {
        return null;
    }
}

export async function getAllHotels(): Promise<Record<string, unknown>[]> {
    try {
        const res = await fetch(`${BASE_URL}/hotels?pageSize=200`, {
            next: { revalidate: 1800 },
        });
        if (!res.ok) return [];
        const data: FirestoreListResponse = await res.json();
        return (data.documents ?? []).map(parseFirestoreDoc);
    } catch {
        return [];
    }
}
