// firestoreUtils.js
import { db } from './firebase';
import { doc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';

const computeHash = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

export const checkBase64Exists = async (base64) => {
    try {
        const hash = await computeHash(base64.split(',')[1]); // Compute the hash
        const q = query(collection(db, "opepen-base64"), where("hash", "==", hash));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking base64 existence:", error);
        throw new Error("Failed to check base64 existence in Firestore.");
    }
};

export const addBase64ToFirestore = async (base64) => {
    try {
        const base64String = base64.split(',')[1]; // Remove the data:image/jpeg;base64, part
        const hash = await computeHash(base64String); // Compute the hash

        const newDocRef = doc(collection(db, "opepen-base64"));
        await setDoc(newDocRef, { hash }); // Store only the hash
        return { success: true, message: "Added successfully." };
    } catch (error) {
        console.error("Error adding hash to Firestore:", error);
        return { success: false, message: "Failed to add hash to Firestore." };
    }
};
