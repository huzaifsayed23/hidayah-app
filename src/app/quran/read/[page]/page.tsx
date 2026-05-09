import QuranReaderClient from './QuranReaderClient';

export function generateStaticParams() {
  return [{ page: '1' }];
}

export default function Page() {
  return <QuranReaderClient />;
}
