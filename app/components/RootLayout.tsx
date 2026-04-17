import { AnimatedOutlet } from './AnimatedOutlet';

function getTopLevelSegment(pathname: string) {
  const [segment] = pathname.split('/').filter(Boolean);
  return segment ?? 'home';
}

export function RootLayout() {
  return (
    <AnimatedOutlet
      className="min-h-screen"
      yOffset={18}
      transitionKey={getTopLevelSegment}
    />
  );
}