# Red Flag Green Flag Game - Live Version

This version fixes the problem where participant screens do not update when the owner starts the game.

It uses:

- GitHub Pages for the front-end
- Firebase Realtime Database for live synchronization
- Separate links for owner and participants

## Files to upload

Upload these files to the root of your GitHub repository:

```text
index.html
owner.html
participant.html
styles.css
app.js
firebase-config.js
README.md
```

## Your links

After GitHub Pages publishes:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/owner.html
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/participant.html
```

Share only `participant.html` with participants.

## Required Firebase setup

1. Create a Firebase project.
2. Create a Realtime Database.
3. Create a Web App in Firebase Project Settings.
4. Copy the Firebase config.
5. Paste it into `firebase-config.js`.
6. For first testing, use these Realtime Database rules:

```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": true
    }
  }
}
```

For production, these rules should be locked down with authentication.

## Why Firebase is needed

GitHub Pages is static hosting. It cannot keep shared live game state by itself. Firebase Realtime Database provides the shared live state so when the owner clicks Start or Next, participant screens update automatically.
