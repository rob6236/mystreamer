// lib/uploadProfilePicture.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadProfilePicture(uid: string, file: File) {
  const fileRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
