# Firebase Security Rules Setup

## Important: Firebase Permissions Error

The Travel Stories feature requires proper Firebase security rules to be configured. Currently, you may see a "Missing or insufficient permissions" error in the console.

## Required Setup Steps

### 1. Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Travel Stories Collection
    match /travelStories/{storyId} {
      // Anyone can read stories
      allow read: if true;
      
      // Only authenticated users can create stories
      allow create: if request.auth != null &&
                      request.resource.data.authorId == request.auth.uid;
      
      // Only authenticated users can update (for likes, views, etc.)
      allow update: if request.auth != null;
      
      // Only the author can delete their own stories
      allow delete: if request.auth != null && 
                      request.auth.uid == resource.data.authorId;
    }
    
    // Keep your existing rules for other collections below
    // (bookings, trips, contacts, etc.)
  }
}
```

### 2. Firebase Storage Security Rules

Go to Firebase Console → Storage → Rules and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Stories images
    match /stories/{userId}/{allPaths=**} {
      // Anyone can read images
      allow read: if true;
      
      // Only authenticated users can upload to their own folder
      // Maximum file size: 5MB
      allow write: if request.auth != null && 
                     request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
    
    // Keep your existing storage rules below
  }
}
```

### 3. Enable Firebase Storage

If you haven't already:

1. Go to Firebase Console
2. Navigate to Storage
3. Click "Get Started"
4. Choose your security rules (use the rules above)
5. Select your storage location (same region as Firestore recommended)

## Testing After Setup

Once you've applied these rules:

1. Refresh the website
2. The "No Stories Yet" message should appear (without console errors)
3. Login to your account
4. Click "Share Your Story"
5. Fill in the form and upload an image
6. Submit the story
7. The story should appear in the grid

## Security Features

### What These Rules Do:

**Firestore Rules:**
- ✅ Anyone can view stories (public content)
- ✅ Only logged-in users can create stories
- ✅ Users can only create stories with their own user ID
- ✅ Any logged-in user can like/update stories
- ✅ Users can only delete their own stories

**Storage Rules:**
- ✅ Anyone can view uploaded images
- ✅ Only logged-in users can upload images
- ✅ Users can only upload to their own folder
- ✅ Maximum file size: 5MB
- ✅ Only image files allowed

## Common Issues

### Issue 1: "Missing or insufficient permissions"
**Solution:** Apply the Firestore rules above

### Issue 2: "Storage upload failed"
**Solution:** 
- Enable Firebase Storage in console
- Apply the Storage rules above

### Issue 3: "User not authenticated"
**Solution:** Make sure you're logged in before creating a story

### Issue 4: Images not loading
**Solution:** 
- Check Storage rules allow public read
- Verify images were uploaded successfully in Firebase Console

## Verification Checklist

After applying rules, verify:

- [ ] No console errors when loading the page
- [ ] "No Stories Yet" message appears cleanly
- [ ] Can open "Share Your Story" modal when logged in
- [ ] Can upload an image (preview appears)
- [ ] Can submit a story successfully
- [ ] Story appears in the grid after submission
- [ ] Can like a story
- [ ] Can view all stories on /stories page
- [ ] Can filter stories by Recent/Popular/Trending

## Additional Configuration (Optional)

### Enable Firebase Storage CORS

If you encounter CORS errors when uploading images:

1. Install Google Cloud SDK
2. Create a `cors.json` file:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

3. Run:
```bash
gsutil cors set cors.json gs://YOUR-PROJECT-ID.appspot.com
```

Replace `YOUR-PROJECT-ID` with your Firebase project ID.

## Need Help?

If you encounter any issues:

1. Check the browser console for specific error messages
2. Verify your Firebase project settings
3. Ensure you're using the correct Firebase project
4. Check that all Firebase services are enabled
5. Verify your internet connection

## Next Steps

After setting up the rules:

1. Test creating a story
2. Test liking stories
3. Test filtering on the stories page
4. Consider adding moderation features
5. Set up Firebase Functions for notifications (optional)

---

**Note:** These rules are production-ready but you may want to add additional security measures like:
- Rate limiting
- Content moderation
- Spam prevention
- User reputation system
