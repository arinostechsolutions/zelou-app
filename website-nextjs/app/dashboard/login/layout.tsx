// Layout específico para login - sem AuthProvider para reduzir bundle
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

