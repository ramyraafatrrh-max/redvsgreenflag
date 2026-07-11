# Red Flag Green Flag Game - Separate Links

This version has separate pages:

- `owner.html` - facilitator / owner controls
- `participant.html` - participant voting page only
- `index.html` - simple landing page with both links
- `styles.css` - visual styling
- `app.js` - shared game logic

## Upload to GitHub

Upload all five files to the root of your GitHub repository:

```text
index.html
owner.html
participant.html
styles.css
app.js
```

Then enable GitHub Pages from Settings > Pages > Deploy from a branch > main > /root.

## Links

After publishing, your links will look like this:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/owner.html
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/participant.html
```

Share only the participant link with players.

## Important

This is still a static prototype. It separates the pages, but live synchronization across different devices requires a realtime backend such as Firebase, Supabase, or Azure SignalR.
