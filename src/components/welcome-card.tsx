import { Binoculars, Rocket } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TeamSwitcher } from "~/components/team-switcher";
import { TiltCard } from "~/components/tilt-card";

export function WelcomeCard({
  teams,
  name,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
  name: string | undefined;
}) {
  return (
    <TiltCard>
      <Card>
        <CardHeader>
          <CardTitle>
            👋 Welcome{name ? " back, " + name : " to Regreso"},
          </CardTitle>
          <CardDescription>
            Learn the basics of how to use Regreso.
          </CardDescription>
        </CardHeader>
        <CardContent className="sm:px-3 xl:px-6">
          <TeamSwitcher teams={teams} />

          <div className="mt-4 flex gap-2">
            <Button disabled size="sm" variant="outline">
              <Rocket />
              Setup Guide
            </Button>
            <Button disabled size="sm">
              <Binoculars /> Start Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </TiltCard>
  );
}
