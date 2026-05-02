export async function generateStaticParams() {
  return [{ username: 'me' }];
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
