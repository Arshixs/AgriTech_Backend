// File: src/utils/uploadUtils.js

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebaseConfig";

/**
 * Upload a document to Firebase Storage
 * @param {Object} file - File object from document picker
 * @param {string} userId - User/Employee ID
 * @param {string} documentType - Type of document (idProof, addressProof, etc.)
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} Download URL of uploaded file
 */
export const uploadDocument = async (
  file,
  userId,
  documentType,
  onProgress = null
) => {
  try {
    // Validate file
    if (!file || !file.uri) {
      throw new Error("Invalid file");
    }

    // Create a unique file name
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}.pdf`;
    const storagePath = `govt-employees/${userId}/documents/${fileName}`;

    // Create a reference to the storage location
    const storageRef = ref(storage, storagePath);

    // Fetch the file as a blob
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: "application/pdf",
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calculate progress
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          // Handle upload errors
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Upload Document Error:", error);
    throw error;
  }
};

/**
 * Upload multiple documents
 * @param {Object} documents - Object containing document files
 * @param {string} userId - User/Employee ID
 * @param {Function} onProgress - Callback for overall progress
 * @returns {Promise<Object>} Object with document URLs
 */
export const uploadMultipleDocuments = async (
  documents,
  userId,
  onProgress = null
) => {
  const documentUrls = {};
  const documentTypes = Object.keys(documents).filter(
    (key) => documents[key] !== null
  );
  let completedUploads = 0;

  for (const docType of documentTypes) {
    try {
      const url = await uploadDocument(
        documents[docType],
        userId,
        docType,
        (progress) => {
          // Calculate overall progress
          const overallProgress =
            ((completedUploads + progress / 100) / documentTypes.length) * 100;
          if (onProgress) {
            onProgress(Math.round(overallProgress));
          }
        }
      );

      documentUrls[docType] = url;
      completedUploads++;

      if (onProgress) {
        onProgress(Math.round((completedUploads / documentTypes.length) * 100));
      }
    } catch (error) {
      console.error(`Failed to upload ${docType}:`, error);
      throw new Error(`Failed to upload ${docType}`);
    }
  }

  return documentUrls;
};
