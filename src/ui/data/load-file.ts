export interface SourceFileResponse {
  path: string;
  content: string;
  sizeBytes: number;
  extension: string;
}

export interface FileListItem {
  path: string;
  role: string;
  featureNumber?: number;
  sizeBytes?: number;
}

/**
 * Fetch a single SpecKit source file (read-only) from the serve API.
 */
export async function loadSourceFile(relativePath: string): Promise<SourceFileResponse> {
  const response = await fetch(`/api/file?path=${encodeURIComponent(relativePath)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Failed to load file (${response.status})`);
  }
  return data as SourceFileResponse;
}

/**
 * List markdown/text source files known from the snapshot.
 */
export async function loadFileList(): Promise<FileListItem[]> {
  try {
    const response = await fetch('/api/files');
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.files) ? data.files : [];
  } catch {
    return [];
  }
}
