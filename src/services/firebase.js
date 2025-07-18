// src/services/firebase.js

import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged, 
    signInWithCustomToken 
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    doc, 
    onSnapshot, 
    writeBatch, 
    getDocs,
    getDoc
} from "firebase/firestore";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "firebase/storage";


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-family-tree-app';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const authenticateUser = () => {
    return new Promise((resolve, reject) => {
        if (auth.currentUser) {
            return resolve(auth.currentUser.uid);
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                unsubscribe();
                resolve(user.uid);
            }
        });
        const performSignIn = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Authentication failed:", e);
                unsubscribe();
                reject(new Error("Could not connect to the authentication service."));
            }
        };
        performSignIn();
    });
};

export const subscribeToFamilyData = (userId, onDataChange, onError) => {
    const membersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/family_members`);
    
    return onSnapshot(membersCollectionRef, async (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // **THE FIX IS HERE:**
        // If the database is empty for this user, create the initial set.
        // The onSnapshot listener will be automatically triggered again with the new data.
        if (membersData.length === 0 && !snapshot.metadata.hasPendingWrites) {
             try {
                await createInitialMembers(membersCollectionRef);
                // We don't need to call onDataChange here, as the listener will re-fire
                // with the new data automatically.
             } catch(e) {
                onError(e.message);
             }
        }
        
        // Always pass the current state of the data to the App component.
        // This ensures the UI updates with an empty list first, then with the real data.
        onDataChange(membersData);

    }, (err) => {
        console.error("Firestore snapshot error:", err);
        onError("Failed to load family data. Check your Firestore security rules.");
    });
};

const createInitialMembers = async (membersCollectionRef) => {
    const batch = writeBatch(db);
    const janeRef = doc(membersCollectionRef);
    const johnRef = doc(membersCollectionRef);
    const peterRef = doc(membersCollectionRef);
    const maryRef = doc(membersCollectionRef);
    const robertRef = doc(membersCollectionRef);
    const chrisRef = doc(membersCollectionRef);
    const susanRef = doc(membersCollectionRef);

    batch.set(janeRef, { firstName: 'Jane', lastName: 'Appleseed', birthDate: '1945-03-15', deathDate: '2020-11-22', bio: 'The matriarch of the Appleseed family.', photoUrl: '', generation: 0, parents: [], children: [peterRef.id, maryRef.id], partners: [johnRef.id], alias: 'Grandma Jane', gender: 'Female' });
    batch.set(johnRef, { firstName: 'John', lastName: 'Appleseed', birthDate: '1943-07-20', deathDate: '2018-05-10', bio: 'The patriarch of the Appleseed family.', photoUrl: '', generation: 0, parents: [], children: [peterRef.id, maryRef.id], partners: [janeRef.id], alias: 'Grandpa John', gender: 'Male' });
    batch.set(peterRef, { firstName: 'Peter', lastName: 'Appleseed', birthDate: '1968-01-30', deathDate: '', bio: '', photoUrl: '', generation: 1, parents: [janeRef.id, johnRef.id], children: [], partners: [], alias: '', gender: 'Male' });
    batch.set(maryRef, { firstName: 'Mary', lastName: 'Smith', birthDate: '1970-06-05', deathDate: '', bio: '', photoUrl: '', generation: 1, parents: [janeRef.id, johnRef.id], children: [chrisRef.id], partners: [robertRef.id], alias: 'Aunt Mary', gender: 'Female' });
    batch.set(robertRef, { firstName: 'Robert', lastName: 'Smith', birthDate: '1969-11-12', deathDate: '', bio: '', photoUrl: '', generation: 1, parents: [], children: [chrisRef.id], partners: [maryRef.id], alias: 'Uncle Rob', gender: 'Male' });
    batch.set(susanRef, { firstName: 'Susan', lastName: 'Smith', birthDate: '1972-02-22', deathDate: '', bio: '', photoUrl: '', generation: 1, parents: [], children: [], partners: [], alias: '', gender: 'Female' });
    batch.set(chrisRef, { firstName: 'Chris', lastName: 'Smith', birthDate: '1995-09-01', deathDate: '', bio: '', photoUrl: '', generation: 2, parents: [maryRef.id, robertRef.id], children: [], partners: [], alias: '', gender: 'Male' });
    await batch.commit();
};

export const saveMember = async (userId, newData, originalData = {}) => {
    const membersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/family_members`);
    const batch = writeBatch(db);
    const memberRef = newData.id ? doc(membersCollectionRef, newData.id) : doc(membersCollectionRef);
    if (!newData.id) newData.id = memberRef.id;

    // Update partners for all affected members
    const oldPartners = originalData.partners || [];
    const newPartners = newData.partners || [];
    // Remove this member from old partners who are no longer partners
    for (const oldPartnerId of oldPartners.filter(pid => !newPartners.includes(pid))) {
        const pDoc = await getDoc(doc(membersCollectionRef, oldPartnerId));
        if (pDoc.exists()) {
            const pData = pDoc.data();
            batch.update(doc(membersCollectionRef, oldPartnerId), { partners: (pData.partners || []).filter(id => id !== newData.id) });
        }
    }
    // Add this member to new partners who didn't have them before
    for (const newPartnerId of newPartners.filter(pid => !oldPartners.includes(pid))) {
        const pDoc = await getDoc(doc(membersCollectionRef, newPartnerId));
        if (pDoc.exists()) {
            const pData = pDoc.data();
            batch.update(doc(membersCollectionRef, newPartnerId), { partners: [...(pData.partners || []), newData.id] });
        }
    }

    // Parents/children logic unchanged
    const oldParents = originalData.parents || [];
    const newParents = newData.parents || [];
    for (const pId of newParents.filter(p => !oldParents.includes(p))) {
        const pDoc = await getDoc(doc(membersCollectionRef, pId));
        if (pDoc.exists()) batch.update(doc(membersCollectionRef, pId), { children: [...(pDoc.data().children || []), newData.id] });
    }
    for (const pId of oldParents.filter(p => !newParents.includes(p))) {
        const pDoc = await getDoc(doc(membersCollectionRef, pId));
        if (pDoc.exists()) batch.update(doc(membersCollectionRef, pId), { children: pDoc.data().children.filter(c => c !== newData.id) });
    }
    const oldChildren = originalData.children || [];
    const newChildren = newData.children || [];
    for (const cId of newChildren.filter(c => !oldChildren.includes(c))) {
        const childDoc = await getDoc(doc(membersCollectionRef, cId));
        if(childDoc.exists()) batch.update(doc(membersCollectionRef, cId), { parents: [...(childDoc.data().parents || []), newData.id] });
    }
    for (const cId of oldChildren.filter(c => !newChildren.includes(c))) {
        const childDoc = await getDoc(doc(membersCollectionRef, cId));
        if(childDoc.exists()) batch.update(doc(membersCollectionRef, cId), { parents: (childDoc.data().parents || []).filter(p => p !== newData.id) });
    }

    batch.set(memberRef, newData);
    await batch.commit();
};

export const deleteMember = async (userId, memberIdToDelete) => {
    const membersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/family_members`);
    const batch = writeBatch(db);
    const allMembersSnapshot = await getDocs(membersCollectionRef);
    for (const docSnap of allMembersSnapshot.docs) {
        if (docSnap.id === memberIdToDelete) continue;
        const memberData = docSnap.data();
        const updateData = {};
        if (memberData.parents?.includes(memberIdToDelete)) updateData.parents = memberData.parents.filter(pId => pId !== memberIdToDelete);
        if (memberData.children?.includes(memberIdToDelete)) updateData.children = memberData.children.filter(cId => cId !== memberIdToDelete);
        if (memberData.partners?.includes(memberIdToDelete)) updateData.partners = memberData.partners.filter(pId => pId !== memberIdToDelete);
        if (Object.keys(updateData).length > 0) batch.update(doc(membersCollectionRef, docSnap.id), updateData);
    }
    batch.delete(doc(membersCollectionRef, memberIdToDelete));
    await batch.commit();
};

export const uploadImage = async (userId, file) => {
    if (!file || !userId) throw new Error("User ID and file are required for upload.");
    const imageRef = ref(storage, `images/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
};
