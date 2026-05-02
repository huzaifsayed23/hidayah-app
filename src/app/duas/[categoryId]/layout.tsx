export async function generateStaticParams() {
  return [{ categoryId: 'general' }];
}

export default function DuaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
