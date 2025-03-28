import Link from "next/link";

import { Binoculars, Rocket } from "lucide-react";
import { useOnborda } from "onborda";

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
  const { startOnborda } = useOnborda();
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
          <TeamSwitcher id="team-switcher" teams={teams} />

          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/guide">
                <Rocket />
                Setup Guide
              </Link>
            </Button>
            <Button
              size="sm"
              id="start-tour"
              onClick={() => {
                startOnborda("welcome-tour");
              }}
            >
              <Binoculars /> Start Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </TiltCard>
  );
}
