# Firebase Setup Instructions

## Quick Fix for Firestore & Storage Permissions Error

The error "Missing or insufficient permissions" means your Firestore and/or Storage security rules are blocking access. Follow these steps:

### Option 1: Quick Test Rules (Less Secure - For Development Only)

**For Firestore Rules:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-study-hub-346c2`
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all access for authenticated users (DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**For Storage Rules:**
1. Navigate to **Storage** → **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow all access for authenticated users (DEVELOPMENT ONLY)
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish** for both rules

### Option 2: Proper Security Rules (Recommended)

Use the rule files I created and deploy them using Firebase CLI:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore
firebase init storage

# Deploy the rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Option 3: Manual Setup via Console

**For Firestore:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-study-hub-346c2`
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the content from `firestore.rules` file and paste it there
5. Click **Publish**

**For Storage:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-study-hub-346c2`
3. Navigate to **Storage** → **Rules** tab
4. Copy the content from `storage.rules` file and paste it there
5. Click **Publish**

## Test Registration & File Upload

After updating the rules, try:
1. Registering a new user
2. Creating a subject
3. Uploading files to the subject (via the files button)

## Next Steps

The updated security rules now include support for:
- Users
- Subjects
- Tasks
- Reminders
- **Subject Files** (new)

## Security Note

The proper security rules in `firestore.rules` and `storage.rules` ensure:
- Users can only access their own data
- Files can only be uploaded/accessed for subjects the user owns
- File size and type validation at the storage level
- Proper permission checks across Firestore and Storage

For development testing, you can use the quick test rules, but for production, always use the more restrictive rules in the rule files.