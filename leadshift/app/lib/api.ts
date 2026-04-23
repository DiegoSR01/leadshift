const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('leadshift_token');
}

/** Fetch a file from the API and trigger a browser download */
async function downloadBlob(path: string, filename: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers });

  if (res.status === 401) {
    localStorage.removeItem('leadshift_token');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('leadshift_token');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }

  return res.json();
}

/** Send FormData (multipart) – does NOT set Content-Type (browser sets boundary) */
async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem('leadshift_token');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────
export const api = {
  auth: {
    register: (data: {
      name: string;
      email: string;
      password: string;
      university: string;
      career: string;
      semester: number;
    }) => request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    me: () => request<any>('/auth/me'),
  },

  // ─── Users ─────────────────────────────────
  users: {
    me: () => request<any>('/users/me'),
    update: (data: any) =>
      request<any>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ─── Modules ───────────────────────────────
  modules: {
    list: () => request<any[]>('/modules'),
    get: (id: string) => request<any>(`/modules/${id}`),
    getScenario: (id: string) => request<any>(`/modules/scenarios/${id}`),
    getExercise: (id: string) => request<any>(`/modules/exercises/${id}`),
  },

  // ─── Results / Submissions ─────────────────
  results: {
    submitScenario: (scenarioId: string, selectedOption: string) =>
      request<any>('/results/scenario', {
        method: 'POST',
        body: JSON.stringify({ scenarioId, selectedOption }),
      }),

    submitOral: (exerciseId: string, transcript: string) =>
      request<any>('/results/oral', {
        method: 'POST',
        body: JSON.stringify({ exerciseId, transcript }),
      }),

    submitWritten: (exerciseId: string, text: string) =>
      request<any>('/results/written', {
        method: 'POST',
        body: JSON.stringify({ exerciseId, text }),
      }),

    list: () => request<any[]>('/results'),
  },

  // ─── Assessments ───────────────────────────
  assessments: {
    create: (type: 'pretest' | 'postest', scores: Record<string, number>) =>
      request<any>('/assessments', {
        method: 'POST',
        body: JSON.stringify({ type, scores }),
      }),
    list: () => request<any[]>('/assessments'),
    comparison: () => request<any>('/assessments/comparison'),
  },

  // ─── Dashboard ─────────────────────────────
  dashboard: {
    get: () => request<any>('/dashboard'),
    analytics: () => request<any>('/dashboard/analytics'),
    results: () => request<any>('/dashboard/results'),
  },

  // ─── Admin ─────────────────────────────────
  admin: {
    /** Overall platform statistics */
    stats: () => request<any>('/admin/stats'),

    users: {
      /** All registered students with their progress */
      list: () => request<any[]>('/admin/users'),
    },

    reports: {
      /**
       * Downloads the full-group CSV (raw data) compatible with Excel /
       * statistical tools (SPSS, R, etc.).
       */
      downloadCsv: () =>
        downloadBlob(
          '/admin/reports/csv',
          `leadshift-reporte-grupal-${new Date().toISOString().slice(0, 10)}.csv`,
        ),

      /**
       * Downloads the individual visual PDF report for a single student.
       * @param userId  UUID of the student
       * @param userName Full name used to build the filename
       */
      downloadPdf: (userId: string, userName: string) =>
        downloadBlob(
          `/admin/reports/pdf/${encodeURIComponent(userId)}`,
          `leadshift-reporte-${userName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
        ),
    },
  },

  // ─── Transcription (Whisper) ───────────────
  transcribe: {
    /** Check if Whisper is available on the server */
    status: () => request<{ available: boolean }>('/transcribe/status'),

    /** Upload audio blob for transcription */
    audio: (blob: Blob, filename = 'audio.webm') => {
      const fd = new FormData();
      fd.append('audio', blob, filename);
      return requestFormData<{
        text: string;
        language: string;
        duration: number;
        segments: { start: number; end: number; text: string }[];
      }>('/transcribe', fd);
    },
  },
};

// ─── Token helpers ───────────────────────────
export function saveToken(token: string) {
  localStorage.setItem('leadshift_token', token);
}

export function clearToken() {
  localStorage.removeItem('leadshift_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
