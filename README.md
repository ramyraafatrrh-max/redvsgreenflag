# Red Flag Green Flag Game

A GitHub Pages-ready front-end prototype for a facilitator game with two phases:

- Owner phase: start game, view current statement, see participant count, move to next statement, and show final percentages.
- Participant phase: wait screen, join with name, vote red flag or green flag, and view final result.

## Files

Upload these files to the root of your GitHub repository:

```text
index.html
README.md
```

## How to run on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html` and `README.md` to the repository root.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch: `main`, folder: `/root`.
6. Click **Save**.
7. After GitHub Pages finishes deploying, open your published URL.

## Important limitation

This version is a static front-end prototype. It is ideal for demo/testing from one browser session. For real participants on separate devices, connect the app to a realtime backend such as Firebase, Supabase, or Azure SignalR.
