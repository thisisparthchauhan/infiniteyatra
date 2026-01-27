import { db } from './script_firebase_config.js';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

const updateStory = async () => {
    try {
        const q = query(
            collection(db, 'travelStories'),
            where('title', '==', 'From Watching Stars to Explore Infinite')
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('Story not found!');
            return;
        }

        const storyDoc = querySnapshot.docs[0];
        const storyRef = doc(db, 'travelStories', storyDoc.id);

        // Create timestamp for Dec 6, 2024
        const newDate = new Date('2024-12-06T12:00:00');

        await updateDoc(storyRef, {
            createdAt: Timestamp.fromDate(newDate),
            authorName: 'Parth Chauhan (Founder)'
        });

        console.log(`Successfully updated story: ${storyDoc.id}`);
    } catch (error) {
        console.error('Error updating story:', error);
    }
};

updateStory();
