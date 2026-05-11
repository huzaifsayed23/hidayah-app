import { Suspense } from 'react';
import QuranReaderClient from './QuranReaderClient';

export function generateStaticParams() {
  const params = [];
  for (let i = 1; i <= 604; i++) {
    params.push({ page: i.toString() });
  }
  return params;
}

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = parseInt(page);
  
  // Accurate Juz calculation
  let juzNum = 30;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (pageNum < JUZ_START_PAGES[i]) {
      juzNum = i;
      break;
    }
    if (i === JUZ_START_PAGES.length - 1) juzNum = 30;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-hidayah-primary" />}>
      <QuranReaderClient initialPage={pageNum} juzNumber={juzNum} />
    </Suspense>
  );
}
