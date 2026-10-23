import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'InfraVision — From sketch to cloudscape.', description: 'A thoughtful AI design studio for turning architecture sketches into visible, reviewable AWS infrastructure.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
