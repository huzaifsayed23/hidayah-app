export async function generateStaticParams() {
  return Array.from({ length: 5 }, (_, i) => ({ level: (i + 1).toString() }));
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
