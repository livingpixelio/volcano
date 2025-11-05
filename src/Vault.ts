export interface FileMeta {
  slug: string;
  type: string;
  checksum: string;
}

export interface Vault {
  all: () => FileMeta[];
}

interface OpenVaultArgs {
  path: string;
  modelCache?: boolean;
  attachmentCache?: string | null;
}

/**
 * Opens an Obsidian vault for querying. Note that the contents of the vault
 * will be read at the time this function is called.
 *
 * @arg path: string.
 */
export const openVault = ({
  path,
  modelCache,
  attachmentCache,
}: OpenVaultArgs): Promise<Vault> => {
  return Promise.reject(new Error("VaultNotFound"));
};
