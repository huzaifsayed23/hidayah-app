export async function generateStaticParams() {
  return [{ categoryId: 'general', duaId: '1' }];
}

export default function DuaDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
