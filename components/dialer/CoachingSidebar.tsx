import BattleCards from '@/components/dialer/BattleCards';
import LeadIntel from '@/components/dialer/LeadIntel';

interface CoachingSidebarProps {
  leadName: string;
  companyName: string;
  companySize: string;
  industry: string;
  revenue: string;
  activity: string;
  profileUrl?: string;
  notes: string;
}

export default function CoachingSidebar({ leadName, companyName, companySize, industry, revenue, activity, profileUrl, notes }: CoachingSidebarProps) {
  return (
    <aside className="hidden xl:block xl:w-[320px]">
      <div className="space-y-5">
        <BattleCards />

        <LeadIntel
          companyName={companyName}
          companySize={companySize}
          industry={industry}
          revenue={revenue}
          activity={activity}
          profileUrl={profileUrl}
          notes={notes}
        />
      </div>
    </aside>
  );
}
