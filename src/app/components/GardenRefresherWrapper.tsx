/**
 * GardenRefresherWrapper Component
 *
 * This component is a simple wrapper around the GardenRefresher component.
 * Its only purpose is to provide a client component boundary that allows
 * the GardenRefresher to be used within server components like the app layout.
 *
 * Key features:
 * - Creates a client/server component boundary
 * - Enables the GardenRefresher to be included in server-rendered components
 * - Part of Next.js best practices for mixing client and server components
 */

'use client';

import GardenRefresher from './GardenRefresher';

// This is a simple client component wrapper to allow using
// GardenRefresher in the server component layout
export default function GardenRefresherWrapper() {
  return <GardenRefresher />;
}
