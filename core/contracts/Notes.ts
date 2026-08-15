export interface Note { id: string; title: string; body: string; tags: string[]; folder?: string; pinned: boolean; archived: boolean; createdAt: string; updatedAt: string; }
export interface NotesLocalData { version: 1; notes: Note[]; }
