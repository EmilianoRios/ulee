import { redirect } from 'next/navigation'

export default async function EstadisticasPage({
  params,
}: {
  params: Promise<{ venueId: string }>
}) {
  const { venueId } = await params
  redirect(`/${venueId}/reservas`)
}
