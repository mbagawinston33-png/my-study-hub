# Firebase Setup Instructions

## Quick Fix for Firestore Permissions Error

The error "Missing or insufficient permissions" means your Firestore security rules are blocking access. Follow these steps:

### Option 1: Quick Test Rules (Less Secure - For Development Only)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-study-hub-346c2`
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to users collection for authenticated users
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    // Allow all access for development (REMOVE IN PRODUCTION)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**

### Option 2: Proper Security Rules (Recommended)

Use the `firestore.rules` file I created and deploy it using Firebase CLI:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

### Option 3: Manual Setup via Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-study-hub-346c2`
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the content from `firestore.rules` file and paste it there
5. Click **Publish**

## Test Registration

After updating the rules, try registering a new user. The error should be resolved.

## Next Steps

Once registration works, you can add more specific rules for other collections like:
- Tasks
- Subjects
- Reminders
- Files

## Security Note

The quick test rules allow any authenticated user to read/write any document. For production, use the more restrictive rules in the `firestore.rules` file.