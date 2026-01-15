import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";
import { formatFileSize } from "../utils/imageOptimization";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * No optimization - direct upload to avoid Android compatibility issues.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'projects/{projectId}/documents/{fileName}')
 * @returns Promise resolving to the download URL
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    if (!file || file.size === 0) {
      throw new Error(`Invalid file: ${file.name}. File size is 0 bytes.`);
    }

    console.log(`📤 Uploading file: ${file.name} (${formatFileSize(file.size)}) to ${path}`);

    const storageRef = ref(storage, path);
    
    const metadata = {
      contentType: file.type || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000'
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    if (!snapshot || !snapshot.ref) {
      throw new Error('Upload snapshot is invalid');
    }

    const downloadURL = await getDownloadURL(snapshot.ref);
    
    if (!downloadURL) {
      throw new Error('Failed to get download URL after upload');
    }

    console.log(`✅ File uploaded successfully: ${file.name} (${formatFileSize(file.size)})`);
    console.log(`📥 Download URL: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    throw error;
  }
};

/**
 * Uploads a logo file to Firebase Storage for branding purposes.
 * @param logoFile The logo file to upload
 * @param tenantId The tenant ID to organize the logo
 * @returns Promise resolving to the download URL
 */
export const uploadLogoToStorage = async (logoFile: File, tenantId: string): Promise<string> => {
  try {
    console.log('📤 Starting logo upload for tenant:', tenantId);
    console.log('📄 File details:', {
      name: logoFile.name,
      size: logoFile.size,
      type: logoFile.type
    });
    
    // Use a safe filename and add timestamp to avoid conflicts
    const fileExtension = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `logo_${Date.now()}.${fileExtension}`;
    const logoPath = `tenants/${tenantId}/branding/${fileName}`;
    
    console.log('📂 Upload path:', logoPath);
    
    const downloadURL = await uploadFile(logoFile, logoPath);
    console.log('✅ Logo upload successful, URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Logo upload failed:', error);
    throw error;
  }
};
