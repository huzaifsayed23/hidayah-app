export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
