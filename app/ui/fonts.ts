import { Inter, Lusitana } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });

// Se cambió weight a '400' en lugar de ['400']
export const lusitana = Lusitana({ subsets: ['latin'], weight: '400' });
