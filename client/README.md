# Minimal Expo Hello World client

This is a very small example Expo client meant to be run on your machine with Expo Go.

How to run (on your machine):

1. Install Expo CLI if you don't have it (optional):

   npm install --global expo-cli

2. From this repository root, go to the client folder and install dependencies:

   cd client
   npm install

3. Start the Expo dev server (tunnel or LAN):

   npx expo start --tunnel

4. Open Expo Go on your phone and scan the QR code. The app is a simple Hello World.

If you want this client to talk to the API we previously had, set API base URL in code (App.tsx) to your machine IP (e.g. http://192.168.1.100:3000) or use a tunnel.
