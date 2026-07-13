import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './OnboardingWizard'

export default async function Onboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <OnboardingWizard email={user?.email} />
}
