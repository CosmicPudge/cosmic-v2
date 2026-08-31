/**
 * Raw uploads are deliberately not exposed as public URLs. Phase 2 stores
 * extracted text and metadata in the private database; durable object storage
 * can be added here later without changing the source contract.
 */
export async function storePrivateSourceFile(): Promise<{ storageReference: null }> {
  return { storageReference: null };
}
