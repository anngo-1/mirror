# mirror - Collaborative Canvas and Text Editor 

This is a real-time collaborative canvas and text editor built with Next.js, React, and Socket.IO. It allows multiple users to draw and edit text together in the same session, without any signup required.

**Current Features:**

- **Real-time Collaboration:**  Multiple users can join the same session and see each other's changes instantly. Users can see each other's cursors.
- **Drawing Canvas:**
    - Various drawing tools (pencil, eraser, etc.)
    - Customizable stroke color and width
    - Zoom and pan functionality
    - Undo and redo actions
    - Canvas background color customization
    - Grid overlay option
- **Text Editor:**
    - Integrated text editor for rich text editing
- **No Signup Required:**  Start collaborating instantly by creating or joining a session.

**Getting Started**

First, run the development server using the node server:

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Running in Production**

To run the application in production:

1. **Build the Next.js application:**
   ```bash
   npm run build
   ```
   This command optimizes the Next.js app for production and creates a `.next` build directory.

2. **Start the Node.js server:**
   ```bash
   export NODE_ENV=production
   npm run start
   ```
   This command executes `node server.js`, starting the Node.js server in production mode. The `server.js` file is configured to serve the pre-built Next.js application (created by `npm run build`) when `NODE_ENV` is set to `production`. It also starts the WebSocket server for real-time features.

   **Environment Variable and `NODE_ENV`:**

   The `server.js` file and Next.js use the `NODE_ENV` environment variable to determine the environment the application is running in (development or production).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


**Note:** This is currently a rough draft and is under active development. Features and stability are not yet guaranteed.
