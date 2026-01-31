import { PolicyAcceptClient } from "./PolicyAcceptClient";

export default async function PolicyAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; flow?: string }>;
}) {
  const params = await searchParams;

  return (
    <PolicyAcceptClient
      nextParam={params.next || null}
      flow={params.flow || null}
    />
  );
}
