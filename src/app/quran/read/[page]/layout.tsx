export async function generateStaticParams() {
  return Array.from({ length: 604 }, (_, i) => ({ page: (i + 1).toString() }));
}

export default function QuranLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
