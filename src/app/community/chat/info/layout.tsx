export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function GroupInfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
