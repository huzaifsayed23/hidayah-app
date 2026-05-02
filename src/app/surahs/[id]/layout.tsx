export async function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ id: (i + 1).toString() }));
}

export default function SurahLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
