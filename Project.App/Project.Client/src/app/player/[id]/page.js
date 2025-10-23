import PlayerClient from './PlayerClient';

export default async function PlayerProfile({ params }) {
  const { id } = await params;

  // Auth check is handled by client-side guard in PlayerClient
  return <PlayerClient id={id} initialBalance={1000} />;
}
